import { useEffect } from "react";

interface ToastProps {
  mensaje: string;
  tipo?: "success" | "error";
  duracion?: number;
  onCerrar: () => void;
}

function Toast({
  mensaje,
  tipo = "success",
  duracion = 3000,
  onCerrar
}: ToastProps) {

  useEffect(() => {
    const timer = setTimeout(() => {
      onCerrar();
    }, duracion);

    return () => {
      clearTimeout(timer);
    };
  }, [duracion, onCerrar]);

  return (
    <div
      className={`toast toast-${tipo}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-icon">
        {tipo === "success" ? "✓" : "!"}
      </span>

      <span className="toast-message">
        {mensaje}
      </span>

      <button
        type="button"
        className="toast-close"
        onClick={onCerrar}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;