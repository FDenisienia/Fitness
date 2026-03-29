import { useEffect, useRef } from 'react';

/**
 * Intervalo que solo corre con la pestaña visible (ahorra red y CPU).
 * Al volver a visible ejecuta el callback una vez y rearma el temporizador.
 */
export function usePageVisibleInterval(callback, intervalMs) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    let id;
    const tick = () => cbRef.current();
    const clear = () => {
      if (id != null) clearInterval(id);
      id = null;
    };
    const arm = () => {
      clear();
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      id = setInterval(tick, intervalMs);
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        tick();
        arm();
      } else {
        clear();
      }
    };
    if (typeof document === 'undefined') {
      id = setInterval(tick, intervalMs);
      return clear;
    }
    if (document.visibilityState === 'visible') arm();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clear();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [intervalMs]);
}
