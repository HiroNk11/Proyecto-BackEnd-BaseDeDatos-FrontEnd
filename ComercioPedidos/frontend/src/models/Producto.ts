export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  stockMinimo?: number;
  version?: string;
  activo: boolean;
}

export interface CrearProducto {
  stockMinimo?: number;
  version?: string;
  motivoStock?: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  activo: boolean;
}
