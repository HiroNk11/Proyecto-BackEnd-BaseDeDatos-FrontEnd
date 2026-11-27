export interface Producto {
  activo: boolean;
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  stockMinimo?: number;
  version?: string;
}
