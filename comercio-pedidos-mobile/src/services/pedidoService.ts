import { authorizedFetch as fetch } from "./authorizedFetch";
import { API_URL } from "../config/api";
import type { CrearPedido, PedidosPaginados, Pedido } from "../models/Pedido";

export async function obtenerPedido(id: number): Promise<Pedido> {
  const response = await fetch(`${API_URL}/pedidos/${id}`);
  return response.json() as Promise<Pedido>;
}
export async function obtenerPedidos(
  pagina = 1,
  tamanioPagina = 10,
  estado?: string,
): Promise<PedidosPaginados> {
  const respuesta = await fetch(
    `${API_URL}/pedidos?pagina=${pagina}&tamanioPagina=${tamanioPagina}${estado ? `&estado=${encodeURIComponent(estado)}` : ""}`,
  );

  const datos: unknown = await respuesta.json();

  if (
    typeof datos !== "object" ||
    datos === null ||
    !("items" in datos) ||
    !Array.isArray(datos.items)
  ) {
    throw new Error("La API no devolvió el formato esperado de pedidos.");
  }

  return datos as PedidosPaginados;
}
export async function crearPedido(datos: CrearPedido): Promise<number> {
  const respuesta = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  const pedidoId: unknown = await respuesta.json();

  if (typeof pedidoId !== "number") {
    throw new Error(
      "El pedido se envió, pero la respuesta no contiene el ID esperado. Revisá el listado antes de volver a enviarlo.",
    );
  }

  return pedidoId;
}

export type AccionPedido =
  "confirmar" | "preparar" | "enviar" | "entregar" | "cancelar";

export async function cambiarEstadoPedido(
  pedidoId: number,
  accion: AccionPedido,
): Promise<void> {
  await fetch(`${API_URL}/pedidos/${pedidoId}/${accion}`, { method: "PUT" });
}
