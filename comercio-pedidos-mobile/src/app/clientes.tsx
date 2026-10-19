import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Cliente } from "../models/Cliente";
import { obtenerClientes } from "../services/clienteService";

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  const actualizarClientes = () => {
    if (cargando || actualizando) {
      return;
    }

    setError("");
    setActualizando(true);
    setRecarga((valor) => valor + 1);
  };

  useEffect(() => {
    let activo = true;

    obtenerClientes()
      .then((datos) => {
        if (activo) {
          setClientes(datos);
        }
      })
      .catch((error: unknown) => {
        if (activo) {
          setError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los clientes."
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
        data={clientes}
        keyExtractor={(cliente) => cliente.id.toString()}
        contentContainerStyle={styles.contenido}
        refreshing={actualizando}
        onRefresh={actualizarClientes}
        ListHeaderComponent={
          <View style={styles.encabezado}>
            <Text style={styles.marca}>ComercioPedidos</Text>
            <Text style={styles.titulo}>Clientes</Text>
            <Text style={styles.descripcion}>
              Consultá los clientes del comercio
            </Text>

            <Text style={styles.aviso}>
              {cargando
                ? "Cargando clientes..."
                : actualizando
                  ? "Actualizando clientes..."
                  : `${clientes.length} clientes encontrados`}
            </Text>

            {error !== "" && (
              <View style={styles.errorContenedor}>
                <Text style={styles.errorTexto}>{error}</Text>

                {clientes.length > 0 && (
                  <Text style={styles.aviso}>
                    Se muestran los últimos datos cargados.
                  </Text>
                )}

                <Pressable
                  accessibilityRole="button"
                  style={styles.boton}
                  disabled={cargando || actualizando}
                  onPress={actualizarClientes}
                >
                  <Text style={styles.botonTexto}>
                    Reintentar
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !cargando && !actualizando && !error ? (
            <Text style={styles.descripcion}>
              Todavía no hay clientes registrados.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Text style={styles.nombre}>
              {item.nombre} {item.apellido}
            </Text>

            <Text style={styles.dato}>{item.email}</Text>

            <Text style={styles.dato}>
              Teléfono: {item.telefono || "Sin registrar"}
            </Text>

            <Text style={styles.dato}>
              Dirección: {item.direccion || "Sin registrar"}
            </Text>

            <Text
              style={[
                styles.estado,
                item.activo ? styles.activo : styles.inactivo,
              ]}
            >
              {item.activo ? "Activo" : "Inactivo"}
            </Text>
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
    flexGrow: 1,
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
  descripcion: {
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
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  nombre: {
    fontSize: 19,
    fontWeight: "600",
    color: "#111827",
  },
  dato: {
    fontSize: 14,
    color: "#4b5563",
  },
  estado: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: "hidden",
  },
  activo: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  inactivo: {
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
  boton: {
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