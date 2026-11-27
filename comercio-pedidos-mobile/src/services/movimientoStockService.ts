import { authorizedFetch as fetch } from "./authorizedFetch";
import type { MovimientosStockPaginados } from "../models/MovimientoStock";

import { API_URL } from "../config/api";

export async function obtenerMovimientosStock(
  pagina = 1,
  tamanioPagina = 10,
): Promise<MovimientosStockPaginados> {
  const respuesta = await fetch(
    `${API_URL}/movimientos-stock?pagina=${pagina}&tamanioPagina=${tamanioPagina}`,
  );

  const datos: unknown = await respuesta.json();

  if (
    typeof datos !== "object" ||
    datos === null ||
    !("items" in datos) ||
    !Array.isArray(datos.items)
  ) {
    throw new Error("La API no devolvió el formato esperado de movimientos.");
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
  datos: RegistrarMovimientoStock,
): Promise<void> {
  await fetch(`${API_URL}/movimientos-stock/${tipo.toLowerCase()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });
}
