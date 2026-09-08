import Modal from './Modal';

export default function UnsavedChangesModal({ onKeepEditing, onDiscard }) {
  return (
    <Modal title="Hay cambios sin guardar" onClose={onKeepEditing} width={420}>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 14, marginTop: 0 }}>
        Si sales ahora perderás los cambios realizados.
      </p>
      <div className="qlc-form-actions">
        <button className="qlc-btn ghost" onClick={onDiscard}>
          Salir sin guardar
        </button>
        <button className="qlc-btn primary" onClick={onKeepEditing}>
          Seguir editando
        </button>
      </div>
    </Modal>
  );
}
