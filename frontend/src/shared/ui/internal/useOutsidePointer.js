import {
  useEffect,
} from 'react';

export function useOutsidePointer({
  enabled,
  refs,
  onOutside,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handlePointerDown = (event) => {
      const isInside = refs.some(
        (ref) => ref.current?.contains(event.target),
      );

      if (!isInside) {
        onOutside?.(event);
      }
    };

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      );
    };
  }, [enabled, onOutside, refs]);
}
