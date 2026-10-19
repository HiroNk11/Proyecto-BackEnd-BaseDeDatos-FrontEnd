export interface MovimientoStock {
  id: number;
  productoId: number;
  nombreProducto: string;
  fecha: string;
  tipo: string;
  cantidad: number;
  stockAnterior: number;
  stockPosterior: number;
  motivo: string | null;
  pedidoId: number | null;
}

export interface MovimientosStockPaginados {
  items: MovimientoStock[];
  pagina: number;
  tamanioPagina: number;
  totalRegistros: number;
  totalPaginas: number;
}