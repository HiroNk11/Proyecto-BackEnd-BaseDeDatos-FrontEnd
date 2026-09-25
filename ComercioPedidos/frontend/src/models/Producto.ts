export interface Producto {
   id: number;
   nombre: string;
   descripcion: string | null;
   precio: number;
   stock: number;
   activo: boolean;
}