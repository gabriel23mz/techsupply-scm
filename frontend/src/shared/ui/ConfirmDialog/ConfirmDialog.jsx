import {
  useRef,
} from 'react';

import Button from '../Button/Button';
import Modal from '../Modal/Modal';

import './ConfirmDialog.css';

function ConfirmDialog({
  cancelText = 'Cancelar',
  confirmText = 'Confirmar',
  loading = false,
  message,
  onCancel,
  onConfirm,
  open,
  title,
  variant = 'danger',
}) {
  const cancelRef = useRef(null);
  const iconByVariant = {
    danger: 'bi bi-exclamation-triangle',
    warning: 'bi bi-exclamation-circle',
    info: 'bi bi-info-circle',
  };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      title={title}
      size="sm"
      initialFocusRef={cancelRef}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      className={`ui-confirm-dialog ui-confirm-dialog--${variant}`}
      footer={(
        <>
          <Button
            ref={cancelRef}
            tone="secondary"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            tone={variant}
            loading={loading}
            loadingLabel="Procesando..."
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      )}
    >
      <div className="ui-confirm-dialog__content">
        <span className="ui-confirm-dialog__icon">
          <i
            className={iconByVariant[variant] ?? iconByVariant.info}
            aria-hidden="true"
          />
        </span>
        <p>{message}</p>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
