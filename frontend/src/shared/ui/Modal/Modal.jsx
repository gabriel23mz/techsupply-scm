import {
  useId,
} from 'react';
import {
  createPortal,
} from 'react-dom';

import IconButton from '../IconButton/IconButton';
import {
  classNames,
} from '../internal/classNames';
import {
  useDialogLifecycle,
} from '../internal/useDialogLifecycle';

import './Modal.css';

function Modal({
  children,
  className,
  closeOnBackdrop = true,
  closeOnEscape = true,
  description,
  footer,
  initialFocusRef,
  onClose,
  open,
  size = 'md',
  title,
}) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = description
    ? `${generatedId}-description`
    : undefined;
  const dialogRef = useDialogLifecycle({
    open,
    onClose,
    closeOnEscape,
    initialFocusRef,
  });

  if (!open) return null;

  return createPortal(
    <div
      className="ui-dialog-overlay"
      onMouseDown={(event) => {
        if (
          closeOnBackdrop &&
          event.target === event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <section
        ref={dialogRef}
        className={classNames(
          'ui-modal',
          `ui-modal--${size}`,
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <header className="ui-modal__header">
          <div className="ui-modal__heading">
            <h2 id={titleId}>{title}</h2>
            {description && (
              <p id={descriptionId}>{description}</p>
            )}
          </div>

          <IconButton
            tone="ghost"
            icon="bi bi-x-lg"
            label="Cerrar diálogo"
            onClick={onClose}
          />
        </header>

        <div className="ui-modal__body">
          {children}
        </div>

        {footer && (
          <footer className="ui-modal__footer">
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
}

export default Modal;
