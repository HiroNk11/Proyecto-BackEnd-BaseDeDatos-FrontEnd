export interface DetallePedido {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  clienteId: number;
  nombreCliente: string;
  fecha: string;
  estado: string;
  total: number;
  detalles: DetallePedido[];
}

export interface ResultadoPaginado<T> {
  items: T[];
  pagina: number;
  tamanioPagina: number;
  totalRegistros: number;
  totalPaginas: number;
}

export interface CrearDetallePedido {
  productoId: number;
  cantidad: number;
}

export interface CrearPedido {
  clienteId: number;
  detalles: CrearDetallePedido[];
}

s