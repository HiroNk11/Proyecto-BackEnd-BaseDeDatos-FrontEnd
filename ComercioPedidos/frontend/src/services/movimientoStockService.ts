import axios, { API_BASE_URL } from "./http";

import type { MovimientoStock } from "../models/MovimientoStock";

import type { ResultadoPaginado } from "../models/Pedido";

export interface FiltrosMovimientosStock {
  productoId?: number;
  tipo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  tamanioPagina?: number;
}
export interface RegistrarMovimientoStock {
  productoId: number;
  cantidad: number;
  motivo?: string;
}

const API_URL = API_BASE_URL + "/movimientos-stock";

export const obtenerMovimientosStock = async (
  filtros: FiltrosMovimientosStock = {},
): Promise<ResultadoPaginado<MovimientoStock>> => {
  const response = await axios.get<ResultadoPaginado<MovimientoStock>>(
    API_URL,
    {
      params: filtros,
    },
  );

  return response.data;
};

export const registrarEntradaStock = async (
  datos: RegistrarMovimientoStock,
): Promise<void> => {
  await axios.post(`${API_URL}/entrada`, datos);
};

export const registrarSalidaStock = async (
  datos: RegistrarMovimientoStock,
): Promise<void> => {
  await axios.post(`${API_URL}/salida`, datos);
};

export interface AjusteStock {
  tipoMovimiento: "Ingreso" | "AjusteManual";
  cantidad: number;
  motivo: string;
  version?: string;
}
export const ajustarStock = async (
  id: number,
  dto: AjusteStock,
): Promise<void> => {
  await axios.post(`${API_BASE_URL}/Productos/${id}/ajustes-stock`, dto);
};
export const historialProducto = async (
  id: number,
  pagina = 1,
): Promise<ResultadoPaginado<MovimientoStock>> =>
  (
    await axios.get<ResultadoPaginado<MovimientoStock>>(
      `${API_BASE_URL}/Productos/${id}/movimientos-stock`,
      { params: { pagina, tamanioPagina: 10 } },
    )
  ).data;
