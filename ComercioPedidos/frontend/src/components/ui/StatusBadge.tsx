const styles: Record<string, string> = {
  Pendiente: "pending",
  Confirmado: "confirmed",
  "En preparación": "preparing",
  EnPreparacion: "preparing",
  Entregado: "delivered",
  Cancelado: "cancelled",
};
export default function StatusBadge({ estado }: { estado: string }) {
  return (
    <span className={`order-status status-${styles[estado] || "neutral"}`}>
      {estado === "EnPreparacion" ? "En preparación" : estado}
    </span>
  );
}
