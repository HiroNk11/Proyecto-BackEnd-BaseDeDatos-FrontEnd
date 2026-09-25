import axios from "axios"; // importa la biblioteca axios para realizar solicitudes HTTP
import type { Producto, CrearProducto } from "../models/Producto"; // importa la interfaz Producto desde el archivo models/Producto.ts 

const API_URL = "https://localhost:7072/api/Productos"; // Define la URL base de la API para obtener los productos

//  Define una función asíncrona llamada obtenerProductos que devuelve una promesa que resuelve un arreglo de objetos Producto
export const obtenerProductos = async (): Promise<Producto[]> => { // Define una función asíncrona llamada obtenerProductos que devuelve una promesa que resuelve un arreglo de objetos Producto
    
    const respuesta = await axios.get<Producto[]>(API_URL); // Realiza una solicitud GET a la URL de la API y espera la respuesta, especificando que se espera un arreglo de objetos Producto como respuesta
    return respuesta.data; // Devuelve los datos de la respuesta, que es un arreglo de objetos Producto
};

// Define una función asíncrona llamada crearProducto que recibe un objeto de tipo CrearProducto y devuelve una promesa que resuelve un objeto Producto
export const crearProducto = async (
    producto: CrearProducto
): Promise<Producto> => {

    const respuesta = await axios.post<Producto>(
        API_URL,
        producto
    );

    return respuesta.data;
};

export const eliminarProducto = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};

export const actualizarProducto = async (
    id: number,
    producto: CrearProducto
): Promise<void> => {
    await axios.put(`${API_URL}/${id}`, producto);
};