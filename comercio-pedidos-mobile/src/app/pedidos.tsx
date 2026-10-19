import AccionesPedido from "@/components/AccionesPedido";
import NuevoPedidoModal from "@/components/NuevoPedidoModal";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PedidosPaginados } from "../models/Pedido";
import { AccionPedido, obtenerPedidos } from "../services/pedidoService";


export default function PedidosScreen() {
  const [datos, setDatos] = useState<PedidosPaginados | null>(null);
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
const [mostrarNuevoPedido, setMostrarNuevoPedido] =
  useState(false);

const [mensajeExito, setMensajeExito] = useState("");
  const actualizar = () => {
    if (cargando) return;

    setError("");
    setCargando(true);
    setRecarga((valor) => valor + 1);
  };

  const cambiarPagina = (nuevaPagina: number) => {
    if (
      cargando ||
      !datos ||
      nuevaPagina < 1 ||
      nuevaPagina > datos.totalPaginas
    ) {
      return;
    }

    setError("");
    setCargando(true);
    setDatos(null);
    setPagina(nuevaPagina);
  };
const pedidoCreado = (pedidoId: number) => {
  setMostrarNuevoPedido(false);
  setMensajeExito(
    `Pedido #${pedidoId} creado correctamente.`
  );

  setError("");
  setCargando(true);

  if (pagina === 1) {
    setRecarga((valor) => valor + 1);
  } else {
    setDatos(null);
    setPagina(1);
  }
};

useEffect(() => {
  let activo = true;

  obtenerPedidos(pagina)
    .then((respuesta) => {
      if (activo) {
        setDatos(respuesta);
      }
    })
    .catch((error: unknown) => {
      if (activo) {
        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los pedidos."
        );
      }
    })
    .finally(() => {
      if (activo) {
        setCargando(false);
      }
    });

  return () => {
    activo = false;
  };
}, [pagina, recarga]);

const pedidoActualizado = (
  pedidoId: number,
  accion: AccionPedido
) => {
  const mensajes: Record<AccionPedido, string> = {
    confirmar: `Pedido #${pedidoId} confirmado.`,
    entregar: `Pedido #${pedidoId} entregado.`,
    cancelar: `Pedido #${pedidoId} cancelado. Stock devuelto.`,
  };

  setMensajeExito(mensajes[accion]);
  setError("");
  setCargando(true);
  setRecarga((valor) => valor + 1);
};
  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={datos?.items ?? []}
        keyExtractor={(pedido) => pedido.id.toString()}
        contentContainerStyle={styles.contenido}
        refreshing={cargando}
        onRefresh={actualizar}
        ListHeaderComponent={
          <View style={styles.encabezado}>
            <Text style={styles.marca}>ComercioPedidos</Text>
           <Text style={styles.titulo}>Pedidos</Text>

<Pressable
  accessibilityRole="button"
  style={[
    styles.boton,
    cargando && styles.deshabilitado,
  ]}
  disabled={cargando}
  onPress={() => {
    setMensajeExito("");
    setMostrarNuevoPedido(true);
  }}
>
  <Text style={styles.botonTexto}>+ Nuevo pedido</Text>
</Pressable>

{mensajeExito !== "" && (
  <Text style={{ color: "#166534", fontWeight: "600" }}>
    {mensajeExito}
  </Text>
)}

            {error !== "" && (
              <View style={styles.error}>
                <Text style={styles.errorTexto}>{error}</Text>

                {datos && (
                  <Text style={styles.texto}>
                    Se muestran los últimos datos cargados.
                  </Text>
                )}

                <Pressable
                  accessibilityRole="button"
                  style={styles.boton}
                  disabled={cargando}
                  onPress={actualizar}
                >
                  <Text style={styles.botonTexto}>Reintentar</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !cargando && !error ? (
            <Text style={styles.texto}>
              No hay pedidos en esta página.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={styles.fila}>
              <Text style={styles.numero}>Pedido #{item.id}</Text>

              <Text
                style={[
                  styles.estado,
                  item.estado === "Cancelado"
                    ? styles.cancelado
                    : item.estado === "Entregado"
                      ? styles.entregado
                      : styles.pendiente,
                ]}
              >
                {item.estado}
              </Text>
            </View>

            <Text style={styles.nombre}>{item.nombreCliente}</Text>

            <Text style={styles.texto}>
              {new Date(item.fecha).toLocaleDateString("es-AR")}
            </Text>

            {item.detalles.map((detalle, indice) => (
              <Text
                key={`${detalle.productoId}-${indice}`}
                style={styles.texto}
              >
                {detalle.cantidad} × {detalle.nombreProducto}
              </Text>
            ))}

            <Text style={styles.total}>
              Total: $ {item.total.toLocaleString("es-AR")}
              
            </Text>
            <AccionesPedido
  key={`${item.id}-${item.estado}`}
  pedidoId={item.id}
  estado={item.estado}
  deshabilitado={cargando}
  onActualizado={pedidoActualizado}
/>
          </View>
          
        )}
        ListFooterComponent={
          datos && datos.totalPaginas > 0 ? (
            <View style={styles.paginacion}>
              <Text style={styles.texto}>
                Página {datos.pagina} de {datos.totalPaginas}
              </Text>

              <View style={styles.fila}>
                <Pressable
                  accessibilityRole="button"
                  disabled={cargando || datos.pagina <= 1}
                  onPress={() => cambiarPagina(datos.pagina - 1)}
                  style={[
                    styles.boton,
                    (cargando || datos.pagina <= 1) &&
                      styles.deshabilitado,
                  ]}
                >
                  <Text style={styles.botonTexto}>Anterior</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={
                    cargando || datos.pagina >= datos.totalPaginas
                  }
                  onPress={() => cambiarPagina(datos.pagina + 1)}
                  style={[
                    styles.boton,
                    (cargando ||
                      datos.pagina >= datos.totalPaginas) &&
                      styles.deshabilitado,
                  ]}
                >
                  <Text style={styles.botonTexto}>Siguiente</Text>
                </Pressable>
              </View>
            </View>
          ) : null
        
        }
        
      />
      {mostrarNuevoPedido && (
  <NuevoPedidoModal
    onCerrar={() => setMostrarNuevoPedido(false)}
    onCreado={pedidoCreado}
  />
)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  contenido: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
    gap: 14,
  },
  encabezado: {
    gap: 8,
    marginBottom: 10,
  },
  marca: {
    color: "#2563eb",
    fontWeight: "600",
  },
  titulo: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
  },
  texto: {
    fontSize: 14,
    color: "#4b5563",
  },
  tarjeta: {
    padding: 18,
    gap: 10,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  numero: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  nombre: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  total: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563eb",
    marginTop: 4,
  },
  estado: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "600",
  },
  entregado: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  cancelado: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  pendiente: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  paginacion: {
    paddingVertical: 16,
    gap: 14,
  },
  boton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  botonTexto: {
    color: "#ffffff",
    fontWeight: "600",
  },
  deshabilitado: {
    opacity: 0.4,
  },
  error: {
    padding: 14,
    gap: 10,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
  },
  errorTexto: {
    color: "#991b1b",
  },
});