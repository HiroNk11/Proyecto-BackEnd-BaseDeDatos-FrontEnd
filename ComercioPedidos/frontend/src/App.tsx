import './App.css'
import { useEffect, useState } from "react";
import type { Producto } from "./models/Producto";
import { obtenerProductos } from "./services/productoService";


function App() {
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const productosData = await obtenerProductos();
        setProductos(productosData);
      } catch (error) {
        console.error("Error al obtener los productos:", error);
      }
    };

    fetchProductos();
  }, []);

  return (
    <div className="App">
      <h1>Lista de Productos</h1>
      <ul>
        {productos.map((producto) => (
          <li key={producto.id}>
            {producto.nombre} - ${producto.precio}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;