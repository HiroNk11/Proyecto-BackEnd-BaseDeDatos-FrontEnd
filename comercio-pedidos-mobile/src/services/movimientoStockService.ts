import type {
  MovimientosStockPaginados,
} from "../models/MovimientoStock";

import { API_URL } from "../config/api";

export async function obtenerMovimientosStock(
  pagina = 1,
  tamanioPagina = 10
): Promise<MovimientosStockPaginados> {
  const respuesta = await fetch(
    `${API_URL}/movimientos-stock?pagina=${pagina}&tamanioPagina=${tamanioPagina}`
  );

  if (!respuesta.ok) {
    throw new Error(
      `No se pudieron obtener los movimientos (${respuesta.status}).`
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
      "La API no devolvió el formato esperado de movimientos."
    );
  }

  return datos as MovimientosStockPaginados;
}
export type TipoMovimientoManual = "Entrada" | "Salida";

export interface RegistrarMovimientoStock {
  productoId: number;
  cantidad: number;
  motivo: string;
}

export async function registrarMovimientoStock(
  tipo: TipoMovimientoManual,
  datos: RegistrarMovimientoStock
): Promise<void> {
  const respuesta = await fetch(
    `${API_URL}/movimientos-stock/${tipo.toLowerCase()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    }
  );

  if (!respuesta.ok) {
    let mensaje = `No se pudo registrar el movimiento (${respuesta.status}).`;

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
      // Conservamos el mensaje general si no hay un JSON válido.
    }

    throw new Error(mensaje);
  }
}