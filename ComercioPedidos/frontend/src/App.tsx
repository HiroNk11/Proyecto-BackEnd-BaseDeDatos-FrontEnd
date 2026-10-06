import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Inicio from "./pages/Inicio";
import Productos from "./pages/productos";
import Clientes from "./pages/clientes";
import Pedidos from "./pages/pedidos";
import "./styles/layout.css";
import "./styles/ui.css";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/pedidos" element={<Pedidos />} />
      </Route>
    </Routes>
  );
}

export default App;