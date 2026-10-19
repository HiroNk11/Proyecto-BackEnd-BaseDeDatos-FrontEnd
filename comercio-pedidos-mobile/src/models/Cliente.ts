export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  direccion?: string | null;
  activo: boolean;
}