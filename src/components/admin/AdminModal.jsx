import './AdminModal.css'

function AdminModal({ open, title, onClose, children, footer, size = 'md' }) {
  if (!open) return null
  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e)=>{ if(e.target===e.currentTarget) onClose?.() }}>
      <div className={`admin-modal__panel admin-modal__panel--${size}`}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">{title}</h2>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="إغلاق">×</button>
        </div>
        <div className="admin-modal__body">{children}</div>
        {footer ? <div className="admin-modal__footer">{footer}</div> : null}
      </div>
    </div>
  )
}

export default AdminModal
