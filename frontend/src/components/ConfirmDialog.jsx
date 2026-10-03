export function ConfirmDialog({ isOpen, title, description, confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onClose }) {
  if (!isOpen) return null

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="dialog-box">
        <h3 id="confirm-title">{title}</h3>
        <p>{description}</p>
        <div className="dialog-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>{cancelText}</button>
          <button type="button" className="button button-primary button-danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
