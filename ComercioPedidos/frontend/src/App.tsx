import './App.css';

import { Routes, Route, Link } from "react-router-dom";

import Productos from "./pages/productos";
import Clientes from "./pages/clientes";
import Pedidos from "./pages/pedidos";


function App() {
  return (
    <div className="App">

      <nav>
        <Link to="/">Inicio</Link>
        {" | "}
        <Link to="/productos">Productos</Link>
        {" | "}
        <Link to="/clientes">Clientes</Link>
        {" | "}
        <Link to="/pedidos">Pedidos</Link>
      </nav>

      <Routes>

        <Route
          path="/"
          element={<h1>Sistema de Gestión de Pedidos</h1>}
        />

        <Route
          path="/productos"
          element={<Productos />}
        />

        <Route
          path="/clientes"
          element={<Clientes />}
        />
        
        <Route
        path="/pedidos"
        element={<Pedidos />}
        />

      </Routes>

    </div>
  );
}

export default App;

