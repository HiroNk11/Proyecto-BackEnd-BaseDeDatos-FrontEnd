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

import type { Cliente } from "../models/Cliente";
import type { Producto } from "../models/Producto";
import { obtenerClientes } from "../services/clienteService";
import { crearPedido } from "../services/pedidoService";
import { obtenerProductos } from "../services/productoService";

interface Props {
  onCerrar: () => void;
  onCreado: (pedidoId: number) => void;
}

export default function NuevoPedidoModal({
  onCerrar,
  onCreado,
}: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [cantidades, setCantidades] =
    useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const enviando = useRef(false);

  useEffect(() => {
    let activo = true;

    Promise.all([obtenerClientes(), obtenerProductos()])
      .then(([clientesRecibidos, productosRecibidos]) => {
        if (activo) {
          setClientes(
            clientesRecibidos.filter((cliente) => cliente.activo)
          );
          setProductos(productosRecibidos);
        }
      })
      .catch(() => {
        if (activo) {
          setErrorCarga(
            "No se pudieron cargar los clientes y productos."
          );
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
    if (enviando.current || cargando || errorCarga) return;

    setError("");

    if (clienteId === null) {
      setError("Seleccioná un cliente.");
      return;
    }

    const seleccionados = productos.filter(
      (producto) =>
        (cantidades[producto.id] ?? "").trim() !== ""
    );

    if (seleccionados.length === 0) {
      setError("Ingresá la cantidad de al menos un producto.");
      return;
    }

    const detalles = [];

    for (const producto of seleccionados) {
      const texto = cantidades[producto.id].trim();
      const cantidad = Number(texto);

      if (
        !/^\d+$/.test(texto) ||
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0 ||
        cantidad > 2147483647
      ) {
        setError(
          `Ingresá una cantidad entera mayor que cero para ${producto.nombre}.`
        );
        return;
      }

      detalles.push({
        productoId: producto.id,
        cantidad,
      });
    }

    enviando.current = true;
    setGuardando(true);

    let pedidoId: number;

    try {
      pedidoId = await crearPedido({
        clienteId,
        detalles,
      });
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el pedido."
      );

      enviando.current = false;
      setGuardando(false);
      return;
    }

    enviando.current = false;
    setGuardando(false);
    onCreado(pedidoId);
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
          <Text style={styles.titulo}>Nuevo pedido</Text>

          {cargando ? (
            <Text style={styles.texto}>
              Cargando clientes y productos...
            </Text>
          ) : errorCarga ? (
            <View style={styles.grupo}>
              <Text style={styles.error}>{errorCarga}</Text>

              <Pressable
                accessibilityRole="button"
                style={styles.boton}
                onPress={() => {
                  setErrorCarga("");
                  setCargando(true);
                  setRecarga((valor) => valor + 1);
                }}
              >
                <Text style={styles.botonTexto}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Cliente</Text>

              {clientes.length === 0 && (
                <Text style={styles.texto}>
                  No hay clientes activos.
                </Text>
              )}

              {clientes.map((cliente) => (
                <Pressable
                  key={cliente.id}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: clienteId === cliente.id,
                    disabled: guardando,
                  }}
                  disabled={guardando}
                  onPress={() => setClienteId(cliente.id)}
                  style={[
                    styles.tarjeta,
                    clienteId === cliente.id &&
                      styles.seleccionado,
                  ]}
                >
                  <Text style={styles.nombre}>
                    {clienteId === cliente.id ? "✓ " : ""}
                    {cliente.nombre} {cliente.apellido}
                  </Text>
                </Pressable>
              ))}

              <Text style={styles.label}>Productos</Text>

              <Text style={styles.texto}>
                Completá la cantidad de los productos que querés
                incluir. Dejá vacíos los demás.
              </Text>

              {productos.length === 0 && (
                <Text style={styles.texto}>
                  No hay productos para seleccionar.
                </Text>
              )}

              {productos.map((producto) => (
                <View key={producto.id} style={styles.tarjeta}>
                  <Text style={styles.nombre}>
                    {producto.nombre}
                  </Text>

                  <Text style={styles.texto}>
                    $ {producto.precio.toLocaleString("es-AR")}
                    {" · Stock: "}
                    {producto.stock}
                  </Text>

                  <TextInput
                    accessibilityLabel={
                      `Cantidad de ${producto.nombre}`
                    }
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder="Cantidad"
                    placeholderTextColor="#6b7280"
                    value={cantidades[producto.id] ?? ""}
                    editable={!guardando}
                    maxLength={10}
                    onChangeText={(valor) =>
                      setCantidades((anteriores) => ({
                        ...anteriores,
                        [producto.id]: valor,
                      }))
                    }
                  />
                </View>
              ))}
            </>
          )}

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
              errorCarga !== "" ||
              clientes.length === 0 ||
              productos.length === 0
            }
            onPress={guardar}
            style={[
              styles.boton,
              (guardando ||
                cargando ||
                errorCarga !== "" ||
                clientes.length === 0 ||
                productos.length === 0) &&
                styles.deshabilitado,
            ]}
          >
            <Text style={styles.botonTexto}>
              {guardando ? "Creando..." : "Crear pedido"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={guardando}
            onPress={cerrar}
            style={styles.cancelar}
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
    gap: 12,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  label: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  texto: {
    fontSize: 14,
    color: "#4b5563",
  },
  grupo: {
    gap: 12,
  },
  tarjeta: {
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  seleccionado: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },
  nombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  error: {
    padding: 12,
    borderRadius: 8,
    color: "#991b1b",
    backgroundColor: "#fee2e2",
  },
  boton: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  botonTexto: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelar: {
    padding: 16,
    alignItems: "center",
  },
  deshabilitado: {
    opacity: 0.5,
  },
});