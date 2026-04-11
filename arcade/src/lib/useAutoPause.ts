import { useEffect, type RefObject, type Dispatch, type SetStateAction } from "react";

interface AutoPauseOpts {
  gsRef: RefObject<{ paused: boolean; phase: number }>;
  playPhase: number;
  forceRender: Dispatch<SetStateAction<number>>;
  onPause?: () => void;
}

export function useAutoPause({ gsRef, playPhase, forceRender, onPause }: AutoPauseOpts): void {
  useEffect(() => {
    const pause = () => {
      const gs = gsRef.current;
      if (gs.phase === playPhase && !gs.paused) {
        gs.paused = true;
        forceRender((n) => n + 1);
      }
      if (gs.phase === playPhase && onPause) {
        onPause();
      }
    };

    const onVisChange = () => {
      if (document.visibilityState === "hidden") pause();
    };

    const onBeforeUnload = () => {
      const gs = gsRef.current;
      if (gs.phase === playPhase) {
        if (!gs.paused) gs.paused = true;
        if (onPause) onPause();
      }
    };

    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("blur", pause);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("blur", pause);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [gsRef, playPhase, forceRender, onPause]);
}
