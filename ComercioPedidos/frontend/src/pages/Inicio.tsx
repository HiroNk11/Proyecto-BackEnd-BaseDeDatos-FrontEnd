import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Pedido } from "../models/Pedido";
import type { Producto } from "../models/Producto";

import { obtenerClientes } from "../services/clienteService";
import { obtenerProductos } from "../services/productoService";
import { obtenerPedidos } from "../services/pedidoService";


function Inicio() {

  const navigate = useNavigate();

  const [clientesActivos, setClientesActivos] =
    useState(0);

  const [productosActivos, setProductosActivos] =
    useState(0);

  const [stockBajo, setStockBajo] =
    useState(0);

  const [pedidosPendientes, setPedidosPendientes] =
    useState(0);

  const [ultimosPedidos, setUltimosPedidos] =
    useState<Pedido[]>([]);

  const [productosConAlerta, setProductosConAlerta] =
    useState<Producto[]>([]);

  const [cargando, setCargando] =
    useState(true);


  /* =========================
     CARGAR DASHBOARD
  ========================= */

  useEffect(() => {

    const cargarDashboard = async () => {

      try {

        const [
          clientes,
          productos,
          pedidosPendientesResultado,
          pedidosRecientesResultado
        ] = await Promise.all([

          obtenerClientes(),

          obtenerProductos(),

          obtenerPedidos({
            estado: "Pendiente",
            pagina: 1,
            tamanioPagina: 1
          }),

          obtenerPedidos({
            pagina: 1,
            tamanioPagina: 5
          })

        ]);


        /* CLIENTES ACTIVOS */

        const cantidadClientesActivos =
          clientes.filter(
            (cliente) =>
              cliente.activo
          ).length;


        /* PRODUCTOS ACTIVOS */

        const cantidadProductosActivos =
        productos.filter(
          (producto) =>
            producto.activo &&
          producto.stock > 0
        ).length;


        /* STOCK BAJO */

        const cantidadStockBajo =
          productos.filter(
            (producto) =>
              producto.activo &&
              producto.stock > 0 &&
              producto.stock <= 5
          ).length;


        /* ALERTAS DE STOCK */

        const productosConStockCritico =
          productos
            .filter(
              (producto) =>
                producto.activo &&
                producto.stock <= 5
            )
            .sort(
              (a, b) =>
                a.stock - b.stock
            );


        /* ACTUALIZAR ESTADOS */

        setClientesActivos(
          cantidadClientesActivos
        );

        setProductosActivos(
          cantidadProductosActivos
        );

        setStockBajo(
          cantidadStockBajo
        );

        setPedidosPendientes(
          pedidosPendientesResultado.totalRegistros
        );

        setUltimosPedidos(
          pedidosRecientesResultado.items
        );

        setProductosConAlerta(
          productosConStockCritico
        );

      } catch (error) {

        console.error(
          "Error al cargar el dashboard:",
          error
        );

      } finally {

        setCargando(false);
      }
    };


    cargarDashboard();

  }, []);


  return (

    <div>

      {/* ENCABEZADO */}

      <div className="page-header">

        <div>

          <h1>
            Inicio
          </h1>

          <p>
            Resumen general del sistema de gestión
          </p>

        </div>

      </div>


      {/* TARJETAS */}

      <div className="dashboard-grid">


        {/* CLIENTES */}

        <button
          type="button"
          className="dashboard-card dashboard-card-link"
          onClick={() =>
            navigate("/clientes?estado=activo")
          }
        >

          <span className="dashboard-card-label">
            Clientes activos
          </span>

          <strong className="dashboard-card-value">

            {cargando
              ? "—"
              : clientesActivos}

          </strong>

          <p>
            Clientes disponibles para operar
          </p>

          <span className="dashboard-card-action">
            Ver clientes →
          </span>

        </button>


        {/* PRODUCTOS */}

        <button
          type="button"
          className="dashboard-card dashboard-card-link"
          onClick={() =>
            navigate("/productos?estado=disponible")
          }
        >

          <span className="dashboard-card-label">
            Productos Disponibles
          </span>

          <strong className="dashboard-card-value">

            {cargando
              ? "—"
              : productosActivos}

          </strong>

          <p>
            Productos disponibles en catálogo
          </p>

          <span className="dashboard-card-action">
            Ver productos →
          </span>

        </button>


        {/* STOCK BAJO */}

        <button
          type="button"
          className="dashboard-card dashboard-card-link"
          onClick={() =>
            navigate("/productos?estado=stock-bajo")
          }
        >

          <span className="dashboard-card-label">
            Stock bajo
          </span>

          <strong className="dashboard-card-value">

            {cargando
              ? "—"
              : stockBajo}

          </strong>

          <p>
            Productos entre 1 y 5 unidades
          </p>

          <span className="dashboard-card-action">
            Revisar stock →
          </span>

        </button>


        {/* PEDIDOS PENDIENTES */}

        <button
          type="button"
          className="dashboard-card dashboard-card-link"
          onClick={() =>
            navigate("/pedidos?estado=Pendiente")
          }
        >

          <span className="dashboard-card-label">
            Pedidos pendientes
          </span>

          <strong className="dashboard-card-value">

            {cargando
              ? "—"
              : pedidosPendientes}

          </strong>

          <p>
            Pedidos que requieren atención
          </p>

          <span className="dashboard-card-action">
            Ver pedidos →
          </span>

        </button>

      </div>


      {/* =========================
          PEDIDOS RECIENTES
      ========================= */}

      <div className="dashboard-section">

        <div className="dashboard-section-header">

          <div>

            <h2>
              Pedidos recientes
            </h2>

            <p>
              Últimos movimientos registrados en el sistema
            </p>

          </div>

        </div>


        <div className="table-card">

          <table className="data-table">

            <thead>

              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>

            </thead>


            <tbody>

              {ultimosPedidos.length === 0 ? (

                <tr>

                  <td colSpan={5}>
                    No hay pedidos registrados.
                  </td>

                </tr>

              ) : (

                ultimosPedidos.map(
                  (pedido) => (

                    <tr key={pedido.id}>

                      <td>
                        #{pedido.id}
                      </td>


                      <td>
                        {pedido.nombreCliente}
                      </td>


                      <td>

                        {new Date(
                          pedido.fecha
                        ).toLocaleDateString(
                          "es-AR"
                        )}

                      </td>


                      <td>

                        <span
                          className={`order-status order-status-${pedido.estado.toLowerCase()}`}
                        >
                          {pedido.estado}
                        </span>

                      </td>


                      <td>

                        {pedido.total.toLocaleString(
                          "es-AR",
                          {
                            style: "currency",
                            currency: "ARS"
                          }
                        )}

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =========================
          ALERTAS DE STOCK
      ========================= */}

      <div className="dashboard-section">

        <div className="dashboard-section-header">

          <div>

            <h2>
              Alertas de stock
            </h2>

            <p>
              Productos que requieren reposición
            </p>

          </div>

        </div>


        <div className="table-card">

          <table className="data-table">

            <thead>

              <tr>
                <th>Producto</th>
                <th>Stock actual</th>
                <th>Estado</th>
              </tr>

            </thead>


            <tbody>

              {productosConAlerta.length === 0 ? (

                <tr>

                  <td colSpan={3}>
                    No hay productos con problemas de stock.
                  </td>

                </tr>

              ) : (

                productosConAlerta.map(
                  (producto) => (

                    <tr key={producto.id}>

                      <td>
                        {producto.nombre}
                      </td>


                      <td>
                        {producto.stock}
                      </td>


                      <td>

                        {producto.stock === 0 ? (

                          <span className="stock-badge stock-out">
                            Sin stock
                          </span>

                        ) : (

                          <span className="stock-badge stock-low">
                            Stock bajo
                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


export default Inicio;