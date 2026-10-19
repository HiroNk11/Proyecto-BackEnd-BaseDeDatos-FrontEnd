import { API_URL } from "../config/api";
import type { CrearPedido, PedidosPaginados } from "../models/Pedido";
export async function obtenerPedidos(
  pagina = 1,
  tamanioPagina = 10
): Promise<PedidosPaginados> {
  const respuesta = await fetch(
    `${API_URL}/pedidos?pagina=${pagina}&tamanioPagina=${tamanioPagina}`
  );
if (!respuesta.ok) {
  throw new Error(
    `No se pudieron obtener los pedidos (${respuesta.status}).`
  );
}
  const datos: unknown = await respuesta.json();

  if (
    typeof datos !== "object" ||
    datos === null ||
    !("items" in datos) ||
    !Array.isArray(datos.items)
  ) {
    throw new Error(
      "La API no devolvió el formato esperado de pedidos."
    );
  }

  return datos as PedidosPaginados;
}
export async function crearPedido(
  datos: CrearPedido
): Promise<number> {
  const respuesta = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  if (!respuesta.ok) {
    let mensaje =
      `No se pudo crear el pedido (${respuesta.status}).`;

    try {
      const problema = await respuesta.json();

      if (problema.errors) {
        const errores = Object.values(problema.errors)
          .flat()
          .filter(
            (valor): valor is string =>
              typeof valor === "string"
          );

        if (errores.length > 0) {
          mensaje = errores.join("\n");
        }
      } else if (typeof problema.detail === "string") {
        mensaje = problema.detail;
      } else if (typeof problema.message === "string") {
        mensaje = problema.message;
      } else if (typeof problema.title === "string") {
        mensaje = problema.title;
      }
    } catch {
      // Conservamos el mensaje general.
    }

    throw new Error(mensaje);
  }

  const pedidoId: unknown = await respuesta.json();

  if (typeof pedidoId !== "number") {
    throw new Error(
      "El pedido se envió, pero la respuesta no contiene el ID esperado. Revisá el listado antes de volver a enviarlo."
    );
  }

  return pedidoId;
}

export type AccionPedido =
  | "confirmar"
  | "entregar"
  | "cancelar";

export async function cambiarEstadoPedido(
  pedidoId: number,
  accion: AccionPedido
): Promise<void> {
  const respuesta = await fetch(
    `${API_URL}/pedidos/${pedidoId}/${accion}`,
    { method: "PUT" }
  );

  if (!respuesta.ok) {
    let mensaje =
      `No se pudo ${accion} el pedido (${respuesta.status}).`;

    try {
      const problema = await respuesta.json();

      if (typeof problema.detail === "string") {
        mensaje = problema.detail;
      } else if (typeof problema.message === "string") {
        mensaje = problema.message;
      } else if (typeof problema.title === "string") {
        mensaje = problema.title;
      }
    } catch {
      // Conservamos el mensaje general.
    }

    throw new Error(mensaje);
  }
}