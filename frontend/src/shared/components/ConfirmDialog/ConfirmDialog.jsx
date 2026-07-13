import './ConfirmDialog.css';

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className={`confirm-icon ${variant}`}>
          <i className="bi bi-exclamation-triangle" />
        </div>

        <div className="confirm-content">
          <h4>{title}</h4>
          <p>{message}</p>
        </div>

        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`btn confirm-button ${variant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

