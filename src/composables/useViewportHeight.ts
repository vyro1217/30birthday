import { useEffect, useState } from 'react';

type ViewportState = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function getViewportState(): ViewportState {
  if (typeof window === 'undefined') {
    return { top: 0, left: 0, width: 0, height: 0 };
  }

  const visualViewport = window.visualViewport;

  return {
    top: Math.round(visualViewport?.offsetTop ?? 0),
    left: Math.round(visualViewport?.offsetLeft ?? 0),
    width: Math.round(visualViewport?.width ?? window.innerWidth),
    height: Math.round(visualViewport?.height ?? window.innerHeight),
  };
}

export function useViewportHeight() {
  const [viewport, setViewport] = useState<ViewportState>(getViewportState);

  useEffect(() => {
    let frameId: number | null = null;

    const updateViewport = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        setViewport((current) => {
          const next = getViewportState();
          if (
            current.top === next.top &&
            current.left === next.left &&
            current.width === next.width &&
            current.height === next.height
          ) {
            return current;
          }

          return next;
        });
        frameId = null;
      });
    };

    updateViewport();

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
    };
  }, []);

  return viewport;
}
