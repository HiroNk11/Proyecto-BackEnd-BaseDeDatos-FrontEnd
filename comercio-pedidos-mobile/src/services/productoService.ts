import { API_URL } from "../config/api";
import type { Producto } from "../models/Producto";

export async function obtenerProductos(): Promise<Producto[]> {
  const respuesta = await fetch(`${API_URL}/productos`);

  if (!respuesta.ok) {
    throw new Error(
      `No se pudieron obtener los productos (${respuesta.status}).`
    );
  }

  const datos: unknown = await respuesta.json();

  if (!Array.isArray(datos)) {
    throw new Error("La API no devolvió una lista de productos.");
  }

  return datos as Producto[];
}