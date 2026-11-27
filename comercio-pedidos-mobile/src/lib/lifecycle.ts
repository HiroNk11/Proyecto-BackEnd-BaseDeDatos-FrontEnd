export type OrderAction =
  "confirmar" | "preparar" | "enviar" | "entregar" | "cancelar";
export const orderStates = [
  "Pendiente",
  "Confirmado",
  "EnPreparacion",
  "Enviado",
  "Entregado",
  "Cancelado",
];
export const stateLabel = (state: string) =>
  state === "EnPreparacion" ? "En preparación" : state;
export function orderActions(state: string): OrderAction[] {
  const next: Record<string, OrderAction> = {
    Pendiente: "confirmar",
    Confirmado: "preparar",
    EnPreparacion: "enviar",
    Enviado: "entregar",
  };
  return typeof next[state] === "string" ? [next[state], "cancelar"] : [];
}
export function availability(stock: number, minimum = 0): string {
  return stock <= 0
    ? "Sin stock"
    : stock <= minimum
      ? "Últimas unidades"
      : "Disponible";
}
const movementLabels: Record<string, string> = {
  Ingreso: "Ingreso",
  ReservaPorPedido: "Reserva por pedido",
  LiberacionPorCancelacion: "Liberación por cancelación",
  AjusteManual: "Ajuste manual",
};
export const movementLabel = (type: string) =>
  Object.hasOwn(movementLabels, type) ? movementLabels[type] : type;
