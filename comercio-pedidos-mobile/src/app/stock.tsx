import { useEffect, useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MovimientoStockModal from "@/components/MovimientoStockModal";
import type {
    MovimientosStockPaginados,
} from "../models/MovimientoStock";
import type {
    TipoMovimientoManual,
} from "../services/movimientoStockService";
import {
    obtenerMovimientosStock,
} from "../services/movimientoStockService";


export default function StockScreen() {

    const [tipoManual, setTipoManual] =
  useState<TipoMovimientoManual | null>(null);

const [mensajeExito, setMensajeExito] = useState("");

  const [datos, setDatos] =
    useState<MovimientosStockPaginados | null>(null);
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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
const movimientoRegistrado = () => {
  setMensajeExito(
    tipoManual === "Entrada"
      ? "Entrada registrada correctamente."
      : "Salida registrada correctamente."
  );

  setTipoManual(null);
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

    obtenerMovimientosStock(pagina)
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
              : "No se pudieron cargar los movimientos."
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

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={datos?.items ?? []}
        keyExtractor={(movimiento) => movimiento.id.toString()}
        contentContainerStyle={styles.contenido}
        refreshing={cargando}
        onRefresh={actualizar}
        ListHeaderComponent={
          <View style={styles.encabezado}>
            <Text style={styles.marca}>ComercioPedidos</Text>
            <Text style={styles.titulo}>Movimientos de stock</Text>
<View style={styles.fila}>
  <Pressable
    accessibilityRole="button"
    disabled={cargando}
    style={[
      styles.boton,
      cargando && styles.deshabilitado,
    ]}
    onPress={() => {
      setMensajeExito("");
      setTipoManual("Entrada");
    }}
  >
    <Text style={styles.botonTexto}>+ Entrada</Text>
  </Pressable>

  <Pressable
    accessibilityRole="button"
    disabled={cargando}
    style={[
      styles.boton,
      { backgroundColor: "#dc2626" },
      cargando && styles.deshabilitado,
    ]}
    onPress={() => {
      setMensajeExito("");
      setTipoManual("Salida");
    }}
  >
    <Text style={styles.botonTexto}>− Salida</Text>
  </Pressable>
</View>

{mensajeExito !== "" && (
  <Text style={{ color: "#166534", fontWeight: "600" }}>
    {mensajeExito}
  </Text>
)}
            <Text style={styles.texto}>
              {cargando
                ? "Cargando movimientos..."
                : datos
                  ? `${datos.totalRegistros} movimientos registrados`
                  : "Consultá las entradas y salidas"}
            </Text>

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
              No hay movimientos en esta página.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={styles.fila}>
              <Text style={styles.numero}>Movimiento #{item.id}</Text>

              <Text
                style={[
                  styles.tipo,
                  item.tipo === "Entrada"
                    ? styles.entrada
                    : styles.salida,
                ]}
              >
                {item.tipo}
              </Text>
            </View>

            <Text style={styles.nombre}>{item.nombreProducto}</Text>

            <Text style={styles.texto}>
              {new Date(item.fecha).toLocaleDateString("es-AR")}
            </Text>

            <Text style={styles.cantidad}>
              {item.tipo === "Entrada" ? "+" : "-"}
              {item.cantidad} unidades
            </Text>

            <Text style={styles.texto}>
              Stock: {item.stockAnterior} → {item.stockPosterior}
            </Text>

            <Text style={styles.texto}>
              Motivo: {item.motivo || "Sin motivo registrado"}
            </Text>

            <Text style={styles.texto}>
              {item.pedidoId !== null
                ? `Pedido asociado: #${item.pedidoId}`
                : "Movimiento manual"}
            </Text>
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
      {tipoManual !== null && (
  <MovimientoStockModal
    tipo={tipoManual}
    onCerrar={() => setTipoManual(null)}
    onRegistrado={movimientoRegistrado}
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
    fontSize: 28,
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
    fontSize: 15,
    fontWeight: "600",
    color: "#4b5563",
  },
  nombre: {
    fontSize: 19,
    fontWeight: "600",
    color: "#111827",
  },
  cantidad: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  tipo: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "600",
  },
  entrada: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  salida: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
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