import axios from "axios"; //   
import type {
  Pedido,
  ResultadoPaginado,
  CrearPedido
} from "../models/Pedido";


const API_URL = "https://localhost:7072/api/Pedidos";

export interface FiltrosPedidos {
  pagina?: number;
  tamanioPagina?: number;
  estado?: string;
  clienteId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}


export const obtenerPedidos = async (
  filtros: FiltrosPedidos = {}
): Promise<ResultadoPaginado<Pedido>> => {

  const respuesta = await axios.get<ResultadoPaginado<Pedido>>(
    API_URL,
    {
      params: {
        pagina: filtros.pagina ?? 1,
        tamanioPagina: filtros.tamanioPagina ?? 10,
        estado: filtros.estado,
        clienteId: filtros.clienteId,
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta
      }
    }
  );

  return respuesta.data;
};

export const confirmarPedido = async (id: number): Promise<void> => {
  await axios.put(`${API_URL}/${id}/confirmar`);
};

export const entregarPedido = async (id: number): Promise<void> => {
  await axios.put(`${API_URL}/${id}/entregar`);
};

export const cancelarPedido = async (id: number): Promise<void> => {
  await axios.put(`${API_URL}/${id}/cancelar`);
};

export const crearPedido = async (
  pedido: CrearPedido
): Promise<void> => {
  await axios.post(API_URL, pedido);
};