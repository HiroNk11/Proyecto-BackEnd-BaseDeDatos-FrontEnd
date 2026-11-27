import { authorizedFetch as fetch } from "./authorizedFetch";
import type { Cliente } from "../models/Cliente";

import { API_URL } from "../config/api";

export async function obtenerClientes(): Promise<Cliente[]> {
  const respuesta = await fetch(`${API_URL}/Clientes`);

  const datos: unknown = await respuesta.json();

  if (!Array.isArray(datos)) {
    throw new Error("La API no devolvió una lista de clientes.");
  }

  return datos as Cliente[];
}
