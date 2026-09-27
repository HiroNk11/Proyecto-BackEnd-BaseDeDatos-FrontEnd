import axios from "axios"; 
import type { Cliente , CrearCliente } from "../models/Cliente"; 


const API_URL = "https://localhost:7072/api/Clientes"; 

export const obtenerClientes = async (): Promise<Cliente[]> => { 
    const respuesta = await axios.get<Cliente[]>(API_URL); 
    return respuesta.data; 
};

export const crearCliente = async (
    cliente: CrearCliente
): Promise<Cliente> => {

    const respuesta = await axios.post<Cliente>(
        API_URL,
        cliente
    );

    return respuesta.data;
};

export const eliminarCliente = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};

export const actualizarCliente = async (
    id: number,
    cliente: CrearCliente                   
): Promise<void> => {
    await axios.put(`${API_URL}/${id}`, cliente);
};
