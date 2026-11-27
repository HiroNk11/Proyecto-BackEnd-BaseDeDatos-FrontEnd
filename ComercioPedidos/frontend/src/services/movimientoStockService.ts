import axios, { API_BASE_URL } from "./http";

import type {
  MovimientoStock
} from "../models/MovimientoStock";

import type {
  ResultadoPaginado
} from "../models/Pedido";

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

const API_URL = API_BASE_URL + '/movimientos-stock';

export const obtenerMovimientosStock =
  async (
    filtros: FiltrosMovimientosStock = {}
  ): Promise<
    ResultadoPaginado<MovimientoStock>
  > => {

    const response = await axios.get<
      ResultadoPaginado<MovimientoStock>
    >(
      API_URL,
      {
        params: filtros
      }
    );

    return response.data;
  };

export const registrarEntradaStock = async (
  datos: RegistrarMovimientoStock
): Promise<void> => {
  await axios.post(
    `${API_URL}/entrada`,
    datos
  );
};

export const registrarSalidaStock = async (
  datos: RegistrarMovimientoStock
): Promise<void> => {
  await axios.post(
    `${API_URL}/salida`,
    datos
  );
};
