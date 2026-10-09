interface ConfirmModalProps {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  procesando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

function ConfirmModal({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  procesando = false,
  onConfirmar,
  onCancelar
}: ConfirmModalProps) {
  return (
    <div className="modal-overlay">
      <div
        className="modal confirm-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="confirm-modal-content">

          <h2>{titulo}</h2>

          <p>{mensaje}</p>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-danger"
              disabled={procesando}
              onClick={onConfirmar}
            >
              {procesando
                ? "Procesando..."
                : textoConfirmar}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={procesando}
              onClick={onCancelar}
            >
              {textoCancelar}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;