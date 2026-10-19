import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Producto } from "../models/Producto";
import { obtenerProductos } from "../services/productoService";

export default function ProductosScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
const [cargando, setCargando] = useState(true);
const [error, setError] = useState("");
const [actualizando, setActualizando] = useState(false);
const [recarga, setRecarga] = useState(0);

const actualizarProductos = () => {
  if (cargando || actualizando) {
    return;
  }

  setError("");
  setActualizando(true);
  setRecarga((valor) => valor + 1);
};

useEffect(() => {
  let activo = true;

  obtenerProductos()
    .then((datos) => {
      if (activo) {
        setProductos(datos);
      }
    })
    .catch((error: unknown) => {
      if (activo) {
        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los productos."
        );
      }
    })
    .finally(() => {
      if (activo) {
        setCargando(false);
        setActualizando(false);
      }
    });

  return () => {
    activo = false;
  };
}, [recarga]);
  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={productos}
        refreshing={actualizando}
        onRefresh={actualizarProductos}
        keyExtractor={(producto) => producto.id.toString()}
        contentContainerStyle={styles.contenido}
        ListHeaderComponent={
          <View style={styles.encabezado}>
            <Text style={styles.marca}>ComercioPedidos</Text>
            <Text style={styles.titulo}>Productos</Text>
            <Text style={styles.subtitulo}>
              Consultá precios y existencias
            </Text>
           <Text style={styles.aviso}>
  {cargando
    ? "Cargando productos..."
    : actualizando
      ? "Actualizando productos..."
      : `${productos.length} productos encontrados`}
</Text>

{error !== "" && (
  <View style={styles.errorContenedor}>
    <Text style={styles.errorTexto}>
      {error}
    </Text>

    {productos.length > 0 && (
      <Text style={styles.aviso}>
        Se muestran los últimos datos cargados.
      </Text>
    )}

    <Pressable
      accessibilityRole="button"
      style={styles.botonReintentar}
      disabled={cargando || actualizando}
      onPress={actualizarProductos}
    >
      <Text style={styles.botonTexto}>
        Reintentar
      </Text>
    </Pressable>
  </View>
)}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Text style={styles.nombre}>{item.nombre}</Text>

            <Text style={styles.precio}>
              $ {item.precio.toLocaleString("es-AR")}
            </Text>

            <View style={styles.filaStock}>
              <Text style={styles.stock}>
                Stock: {item.stock} unidades
              </Text>

              <Text
                style={[
                  styles.estado,
                  item.stock === 0
                    ? styles.sinStock
                    : item.stock <= 5
                      ? styles.stockBajo
                      : styles.disponible,
                ]}
              >
                {item.stock === 0
                  ? "Sin stock"
                  : item.stock <= 5
                    ? "Stock bajo"
                    : "Disponible"}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  contenido: {
    padding: 20,
    paddingBottom: 100,
    gap: 14,
  },
  encabezado: {
    marginBottom: 10,
    gap: 6,
  },
  marca: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  titulo: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
  },
  subtitulo: {
    fontSize: 15,
    color: "#6b7280",
  },
  aviso: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  },
  tarjeta: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  nombre: {
    fontSize: 19,
    fontWeight: "600",
    color: "#111827",
  },
  precio: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563eb",
  },
  filaStock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  stock: {
    fontSize: 14,
    color: "#4b5563",
  },
  estado: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: "hidden",
  },
  disponible: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  stockBajo: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  sinStock: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },

  errorContenedor: {
  marginTop: 10,
  padding: 14,
  gap: 10,
  backgroundColor: "#fee2e2",
  borderRadius: 10,
},
errorTexto: {
  color: "#991b1b",
  fontSize: 14,
},
botonReintentar: {
  alignSelf: "flex-start",
  backgroundColor: "#2563eb",
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 8,
},
botonTexto: {
  color: "#ffffff",
  fontWeight: "600",
},
});