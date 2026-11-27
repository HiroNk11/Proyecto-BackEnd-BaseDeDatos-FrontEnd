import Modal from "./Modal";
interface Props {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  procesando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}
export default function ConfirmModal({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Volver",
  procesando = false,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <Modal title={titulo} busy={procesando} onClose={onCancelar}>
      <p>{mensaje}</p>
      <div className="modal-actions">
        <button
          className="btn btn-danger"
          disabled={procesando}
          onClick={onConfirmar}
        >
          {procesando && <span className="spinner" aria-hidden="true" />}
          {procesando ? "Procesando…" : textoConfirmar}
        </button>
        <button
          className="btn btn-secondary"
          disabled={procesando}
          onClick={onCancelar}
        >
          {textoCancelar}
        </button>
      </div>
    </Modal>
  );
}
