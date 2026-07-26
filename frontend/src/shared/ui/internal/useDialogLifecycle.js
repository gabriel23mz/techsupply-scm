import {
  useEffect,
  useRef,
} from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useDialogLifecycle({
  open,
  onClose,
  closeOnEscape = true,
  lockScroll = true,
  initialFocusRef,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;

    if (lockScroll) {
      document.body.classList.add('ui-scroll-locked');
    }

    const focusFrame = window.requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current ??
        dialogRef.current?.querySelector(FOCUSABLE_SELECTOR) ??
        dialogRef.current;

      target?.focus?.();
    });

    const handleKeyDown = (event) => {
      if (
        event.key === 'Escape' &&
        closeOnEscape
      ) {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll(
          FOCUSABLE_SELECTOR,
        ) ?? [],
      ).filter((element) => !element.hasAttribute('hidden'));

      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);

      if (lockScroll) {
        document.body.classList.remove('ui-scroll-locked');
      }

      previousFocusRef.current?.focus?.();
    };
  }, [
    closeOnEscape,
    initialFocusRef,
    lockScroll,
    onClose,
    open,
  ]);

  return dialogRef;
}
