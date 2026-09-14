// Runs the compiled endoh1.c (IOCCC 2012, by Yusuke Endoh — see
// src/wasm/fluid/endoh1.c) in a dedicated Worker.
//
// The program's main() never returns: it reads the "scene" text from stdin,
// then loops forever redrawing an ASCII-art frame to stdout. usleep() is a
// no-op in this build (no Asyncify), so the simulation actually runs as fast
// as the CPU allows — that's fine in a Worker (it won't block the page), we
// just throttle how often we forward a *complete* frame to the main thread.
// The only way to stop it is Worker.terminate() from the caller.
import createFluidModule from "../../wasm/fluid/gen/fluid.mjs";
// eslint-disable-next-line import/no-unresolved -- Vite asset URL import
import fluidWasmUrl from "../../wasm/fluid/gen/fluid.wasm?url";

interface StartMessage {
  type: "start";
  text: string;
}

const HOME_SEQ = "\x1b[1;1H";
const MIN_FRAME_INTERVAL_MS = 33; // ~30fps forwarded to the main thread

let currentFrame: string[] = [];
let lastSentAt = 0;

function sendFrame(lines: string[]) {
  const now = performance.now();
  if (now - lastSentAt < MIN_FRAME_INTERVAL_MS) return;
  lastSentAt = now;
  postMessage({ type: "frame", chunk: `${lines.join("\n")}\n` });
}

function onOutputLine(line: string) {
  // Every rendered frame starts with a cursor-home escape; once we see a new
  // one arrive on top of a frame we already started buffering, the previous
  // frame is complete — send it, never a partial one.
  if (line.includes(HOME_SEQ) && currentFrame.length) {
    sendFrame(currentFrame);
    currentFrame = [line];
  } else {
    currentFrame.push(line);
  }
}

self.onmessage = (ev: MessageEvent<StartMessage>) => {
  if (ev.data.type !== "start") return;

  // Safety cap: the program's particle array is a fixed 97687-double buffer
  // with no bounds checking (true to the original obfuscated entry), so an
  // unreasonably long paste could overrun it. A few hundred characters is
  // already a lot of fluid; this leaves a wide safety margin.
  const text = ev.data.text.slice(0, 2000);
  let idx = 0;

  createFluidModule({
    locateFile: () => fluidWasmUrl,
    stdin: () => (idx < text.length ? text.charCodeAt(idx++) : null),
    print: onOutputLine,
    printErr: (message: string) => postMessage({ type: "error", message }),
  }).then((Module: { callMain: (args: string[]) => void }) => {
    postMessage({ type: "ready" });
    try {
      Module.callMain([]);
    } catch (err) {
      // main() never returns in the C source; a thrown unwind here would be
      // unexpected, but don't let it go unreported.
      postMessage({ type: "error", message: String(err) });
    }
  });
};
