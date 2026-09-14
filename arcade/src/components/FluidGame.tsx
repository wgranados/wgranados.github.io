import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const COLS = 80;
const ROWS = 24;
const MAX_INPUT_LENGTH = 2000;

const PRESETS: Record<string, { label: string; text: string }> = {
  logo: {
    label: "IOCCC logo",
    text: `  @@@@  @        @     @    @@@@  @               @        @
  @     @              @    @                     @        @@@
  @@@@  @  @  @  @  @@@@    @@@@  @  @@@@@  @  @  @   @@   @     @@   @@@
  @     @  @  @  @  @  @       @  @  @ @ @  @  @  @  @  @  @    @  @  @  @
  @     @   @@@  @  @@@@    @@@@  @  @ @ @   @@@  @   @@ @  @@   @@   @




#                                                                          #
#####                                                                  #####
   ######                                                          ######
       #######                                                #######
            ########                                    ########
                  #########                      #########
                         ##########      ##########
                                 ##      ##`,
  },
  fountain: {
    label: "Fountain",
    text: `                                     x
                                     x
                                     x
                                     x
                                     x
                                     x
                                     x
                                     x
                                     x
                                     x
                                     x
                                     x
                                     x
                            ###      x      ###
                             ###     x     ###
                              ###    x    ###
                               #############`,
  },
  hourglass: {
    label: "Hourglass",
    // "clock.txt" — a water clock by HAMANO Tsukasa, from the same upstream
    // IOCCC archive as endoh1.c itself (CC BY-SA 4.0).
    text: `                       ########################
                       ##xxxxxxxxxxxxxxxxxxxx##
                       ##xxxxxxxxxxxxxxxxxxxx##
                       ##xxxxxxxxxxxxxxxxxxxx##
                       ##xxxxxxxxxxxxxxxxxxxx##
                       ##xxxxxxxxxxxxxxxxxxxx##
                       ###xxxxxxxxxxxxxxxxxx###
                        ###xxxxxxxxxxxxxxxx###
                          ###xxxxxxxxxxxx###
                            ###        ###
                              ###    ###
                               ###  ###
                              ###    ###
                            ###        ###
                          ###            ###
                        ###                ###
                       ###                  ###
                       ##                    ##
                       ##                    ##
                       ##                    ##
                       ##                    ##
                       ##                    ##
                       ########################`,
  },
};

type WorkerOutMessage =
  | { type: "ready" }
  | { type: "frame"; chunk: string }
  | { type: "error"; message: string };

export default function FluidGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [text, setText] = useState(PRESETS.logo.text);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const term = new Terminal({
      cols: COLS,
      rows: ROWS,
      convertEol: true,
      disableStdin: true,
      cursorBlink: false,
      fontSize: 14,
      fontFamily: "'Courier New', monospace",
      theme: { background: "#0a0a1a" },
    });
    term.open(containerRef.current);
    termRef.current = term;
    return () => {
      workerRef.current?.terminate();
      term.dispose();
    };
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setRunning(false);
  }, []);

  const pour = useCallback(() => {
    const term = termRef.current;
    if (!term) return;

    // A fresh scene needs a fresh module instance -- the C program's state
    // is a set of global arrays that only get populated once, on startup.
    workerRef.current?.terminate();
    setError(null);
    term.reset();

    const worker = new Worker(new URL("../game/fluid/fluid.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (ev: MessageEvent<WorkerOutMessage>) => {
      if (ev.data.type === "frame") term.write(ev.data.chunk);
      else if (ev.data.type === "error") setError(ev.data.message);
    };
    worker.onerror = (ev) => setError(ev.message);
    worker.postMessage({ type: "start", text: text.slice(0, MAX_INPUT_LENGTH) });

    workerRef.current = worker;
    setRunning(true);
  }, [text]);

  return (
    <div style={styles.container}>
      <div ref={containerRef} style={styles.terminal} />

      <div style={styles.controls}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_INPUT_LENGTH}
          rows={4}
          spellCheck={false}
          placeholder="Draw a scene: '#' is a solid wall, any other character is fluid."
          style={styles.textarea}
        />
        <div style={styles.buttonRow}>
          <button type="button" onClick={pour} style={styles.primary}>
            {running ? "Pour again" : "Pour"}
          </button>
          <button type="button" onClick={stop} disabled={!running} style={styles.secondary}>
            Stop
          </button>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => setText(preset.text)}
              style={text === preset.text ? styles.presetActive : styles.preset}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {error && <p style={styles.error}>Worker error: {error}</p>}
      </div>

      <p style={styles.attribution}>
        Fluid solver: a real, unmodified copy of{" "}
        <a href="https://github.com/ioccc-src/winner/blob/master/2012/endoh1/endoh1.c" target="_blank" rel="noopener noreferrer">
          endoh1.c
        </a>{" "}
        by Yusuke Endoh (IOCCC 2012), compiled to WebAssembly and run in a Web Worker — it renders raw ANSI
        frames exactly as it would in a terminal. Source and preset scenes are CC BY-SA 4.0 via the{" "}
        <a href="https://github.com/ioccc-src/winner" target="_blank" rel="noopener noreferrer">
          IOCCC winners archive
        </a>
        .
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "1rem 0",
  },
  terminal: {
    background: "#0a0a1a",
    padding: "0.75rem",
    borderRadius: 8,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    overflowX: "auto",
  },
  controls: {
    marginTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  textarea: {
    fontFamily: "'Courier New', monospace",
    fontSize: "0.85rem",
    padding: "0.6rem",
    borderRadius: 6,
    border: "1px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(255, 255, 255, 0.04)",
    color: "#eee",
    resize: "vertical",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
  },
  primary: {
    padding: "0.5rem 1.4rem",
    fontSize: "0.95rem",
    fontWeight: 700,
    border: "none",
    borderRadius: 6,
    background: "#48dbfb",
    color: "#0a0a1a",
    cursor: "pointer",
  },
  secondary: {
    padding: "0.5rem 1.4rem",
    fontSize: "0.95rem",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    background: "transparent",
    color: "#eee",
    cursor: "pointer",
  },
  preset: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 6,
    background: "rgba(255, 255, 255, 0.04)",
    color: "rgba(255, 255, 255, 0.7)",
    cursor: "pointer",
  },
  presetActive: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
    border: "1px solid #48dbfb",
    borderRadius: 6,
    background: "rgba(72, 219, 251, 0.12)",
    color: "#48dbfb",
    cursor: "pointer",
  },
  error: {
    color: "#ff6b6b",
    fontSize: "0.85rem",
  },
  attribution: {
    marginTop: "1.5rem",
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.4)",
    lineHeight: 1.6,
  },
};
