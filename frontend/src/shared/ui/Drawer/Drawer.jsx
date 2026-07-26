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

import './Drawer.css';

function Drawer({
  children,
  className,
  description,
  footer,
  initialFocusRef,
  onClose,
  open,
  side = 'right',
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
    initialFocusRef,
  });

  if (!open) return null;

  return createPortal(
    <div
      className="ui-drawer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <aside
        ref={dialogRef}
        className={classNames(
          'ui-drawer',
          `ui-drawer--${side}`,
          `ui-drawer--${size}`,
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <header className="ui-drawer__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && (
              <p id={descriptionId}>{description}</p>
            )}
          </div>
          <IconButton
            tone="ghost"
            icon="bi bi-x-lg"
            label="Cerrar panel"
            onClick={onClose}
          />
        </header>

        <div className="ui-drawer__body">
          {children}
        </div>

        {footer && (
          <footer className="ui-drawer__footer">
            {footer}
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}

export default Drawer;
