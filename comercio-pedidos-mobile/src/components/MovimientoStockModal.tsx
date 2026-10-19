import { useEffect, useRef, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Producto } from "../models/Producto";
import type {
    TipoMovimientoManual,
} from "../services/movimientoStockService";
import {
    registrarMovimientoStock,
} from "../services/movimientoStockService";
import { obtenerProductos } from "../services/productoService";

interface Props {
  tipo: TipoMovimientoManual;
  onCerrar: () => void;
  onRegistrado: () => void;
}

export default function MovimientoStockModal({
  tipo,
  onCerrar,
  onRegistrado,
}: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorProductos, setErrorProductos] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const enviando = useRef(false);

  useEffect(() => {
    let activo = true;

    obtenerProductos()
      .then((datos) => {
        if (activo) setProductos(datos);
      })
      .catch(() => {
        if (activo) {
          setErrorProductos("No se pudieron cargar los productos.");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [recarga]);

  const cerrar = () => {
    if (!enviando.current) onCerrar();
  };

  const guardar = async () => {
    if (enviando.current || cargando || errorProductos) return;

    setError("");

    if (productoId === null) {
      setError("Seleccioná un producto.");
      return;
    }

    const cantidadNumerica = Number(cantidad);

    if (
      !/^\d+$/.test(cantidad.trim()) ||
      !Number.isSafeInteger(cantidadNumerica) ||
      cantidadNumerica <= 0 ||
      cantidadNumerica > 2147483647
    ) {
      setError("Ingresá una cantidad entera válida mayor que cero.");
      return;
    }

    enviando.current = true;
    setGuardando(true);

    try {
      await registrarMovimientoStock(tipo, {
        productoId,
        cantidad: cantidadNumerica,
        motivo:
          motivo.trim() ||
          (tipo === "Entrada" ? "Reposición manual" : "Salida manual"),
      });
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el movimiento."
      );

      enviando.current = false;
      setGuardando(false);
      return;
    }

    enviando.current = false;
    setGuardando(false);
    onRegistrado();
  };

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={cerrar}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titulo}>
            Registrar {tipo.toLowerCase()} de stock
          </Text>

          <Text style={styles.label}>Producto</Text>

          {cargando ? (
            <Text style={styles.texto}>Cargando productos...</Text>
          ) : errorProductos ? (
            <View style={styles.grupo}>
              <Text style={styles.error}>{errorProductos}</Text>

              <Pressable
                accessibilityRole="button"
                style={styles.boton}
                onPress={() => {
                  setErrorProductos("");
                  setCargando(true);
                  setRecarga((valor) => valor + 1);
                }}
              >
                <Text style={styles.botonTexto}>
                  Reintentar carga
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grupo}>
              {productos.length === 0 && (
                <Text style={styles.texto}>
                  No hay productos disponibles para seleccionar.
                </Text>
              )}

              {productos.map((producto) => (
                <Pressable
                  key={producto.id}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: productoId === producto.id,
                    disabled: guardando,
                  }}
                  disabled={guardando}
                  onPress={() => setProductoId(producto.id)}
                  style={[
                    styles.producto,
                    productoId === producto.id && styles.seleccionado,
                  ]}
                >
                  <Text style={styles.productoNombre}>
                    {productoId === producto.id ? "✓ " : ""}
                    {producto.nombre}
                  </Text>

                  <Text style={styles.texto}>
                    Stock actual: {producto.stock}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>Cantidad</Text>

          <TextInput
            accessibilityLabel="Cantidad"
            style={styles.input}
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="number-pad"
            placeholder="Ej: 3"
            placeholderTextColor="#6b7280"
            editable={!guardando}
            maxLength={10}
          />

          <Text style={styles.label}>Motivo</Text>

          <TextInput
            accessibilityLabel="Motivo"
            style={styles.input}
            value={motivo}
            onChangeText={setMotivo}
            placeholder={
              tipo === "Entrada"
                ? "Ej: Compra a proveedor"
                : "Ej: Producto dañado"
            }
            placeholderTextColor="#6b7280"
            editable={!guardando}
            maxLength={250}
          />

          {error !== "" && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={
              guardando ||
              cargando ||
              errorProductos !== "" ||
              productos.length === 0
            }
            onPress={guardar}
            style={[
              styles.boton,
              tipo === "Salida" && styles.botonSalida,
              (guardando ||
                cargando ||
                errorProductos !== "" ||
                productos.length === 0) &&
                styles.deshabilitado,
            ]}
          >
            <Text style={styles.botonTexto}>
              {guardando
                ? "Registrando..."
                : `Registrar ${tipo.toLowerCase()}`}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={guardando}
            onPress={cerrar}
            style={[
              styles.botonCancelar,
              guardando && styles.deshabilitado,
            ]}
          >
            <Text style={styles.texto}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  titulo: {
    fontSize: 25,
    fontWeight: "700",
    color: "#111827",
  },
  label: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  texto: {
    fontSize: 14,
    color: "#4b5563",
  },
  grupo: {
    gap: 8,
  },
  producto: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    gap: 5,
  },
  seleccionado: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  productoNombre: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 16,
  },
  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    color: "#111827",
    fontSize: 16,
  },
  error: {
    padding: 12,
    color: "#991b1b",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
  },
  boton: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  botonSalida: {
    backgroundColor: "#dc2626",
  },
  botonTexto: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  botonCancelar: {
    padding: 16,
    alignItems: "center",
  },
  deshabilitado: {
    opacity: 0.5,
  },
});