import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { obtenerProductos } from "../services/productoService";
import { crearPedido } from "../services/pedidoService";
import { errorMessage } from "../lib/problem";
import ResourceState from "./ResourceState";
interface Props {
  onCerrar: () => void;
  onCreado: (id: number) => void;
}
const money = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    amount,
  );

export default function NuevoPedidoModal({ onCerrar, onCreado }: Props) {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [client, setClient] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([obtenerClientes(), obtenerProductos()])
      .then(([customers, items]) => {
        if (active) {
          setClients(customers.filter((c) => c.activo));
          setProducts(items.filter((p) => p.activo));
        }
      })
      .catch((failure: unknown) => {
        if (active) setLoadError(errorMessage(failure));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const selected = products.filter((p) => (quantities[p.id] || 0) > 0);
  const total = selected.reduce(
    (sum, p) => sum + p.precio * quantities[p.id],
    0,
  );
  const units = selected.reduce((sum, p) => sum + quantities[p.id], 0);
  function quantity(product: Producto, value: number) {
    if (!busy && Number.isSafeInteger(value) && value >= 0)
      setQuantities((previous) => ({ ...previous, [product.id]: value }));
  }
  async function save() {
    if (lock.current || loading || loadError) return;
    if (!client || !selected.length) {
      setError("Seleccioná un cliente y agregá al menos un producto.");
      return;
    }
    if (
      selected.length > 100 ||
      selected.some((p) => quantities[p.id] > p.stock)
    ) {
      setError(
        "Revisá las cantidades: no pueden superar el stock disponible ni 100 productos distintos.",
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const id = await crearPedido({
        clienteId: client,
        detalles: selected.map((p) => ({
          productoId: p.id,
          cantidad: quantities[p.id],
        })),
      });
      onCreado(id);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!lock.current) onCerrar();
      }}
    >
      <SafeAreaView style={s.root}>
        <KeyboardAvoidingView
          style={s.root}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={s.header}>
            <View>
              <Text style={s.eyebrow}>VENTA COMERCIAL</Text>
              <Text style={s.title}>Nuevo pedido</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar pedido"
              disabled={busy}
              onPress={onCerrar}
              style={s.close}
            >
              <Text style={s.link}>Cerrar</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
          >
            {loading || loadError ? (
              <ResourceState
                loading={loading}
                error={loadError}
                onRetry={() => {
                  setLoading(true);
                  setLoadError("");
                  setRevision((v) => v + 1);
                }}
              />
            ) : (
              <>
                <Text style={s.label}>Cliente</Text>
                {clients.length === 0 && (
                  <ResourceState empty="No hay clientes activos" />
                )}
                <View style={s.customerList}>
                  {clients.map((c) => (
                    <Pressable
                      key={c.id}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: client === c.id,
                        disabled: busy,
                      }}
                      disabled={busy}
                      onPress={() => setClient(c.id)}
                      style={[s.customer, client === c.id && s.chosen]}
                    >
                      <Text style={s.name}>
                        {client === c.id ? "✓ " : ""}
                        {c.nombre} {c.apellido}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={s.label}>Productos</Text>
                <Text style={s.hint}>
                  Elegí cantidades. La API confirmará precio y disponibilidad.
                </Text>
                {products.length === 0 && (
                  <ResourceState empty="No hay productos activos" />
                )}
                {products.map((p) => (
                  <View key={p.id} style={s.card}>
                    <Text style={s.name}>{p.nombre}</Text>
                    <Text style={s.price}>{money(p.precio)}</Text>
                    <View style={s.row}>
                      <Text style={s.hint}>Stock: {p.stock}</Text>
                      <View style={s.quantity}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Quitar ${p.nombre}`}
                          disabled={busy || !(quantities[p.id] > 0)}
                          onPress={() =>
                            quantity(p, (quantities[p.id] || 0) - 1)
                          }
                          style={[
                            s.step,
                            (busy || !quantities[p.id]) && s.disabled,
                          ]}
                        >
                          <Text style={s.stepText}>−</Text>
                        </Pressable>
                        <TextInput
                          accessibilityLabel={`Cantidad de ${p.nombre}`}
                          keyboardType="number-pad"
                          value={String(quantities[p.id] || 0)}
                          editable={!busy}
                          selectTextOnFocus
                          onChangeText={(value) => {
                            if (/^\d*$/.test(value)) quantity(p, Number(value));
                          }}
                          maxLength={10}
                          style={s.quantityInput}
                        />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Agregar ${p.nombre}`}
                          disabled={busy || (quantities[p.id] || 0) >= p.stock}
                          onPress={() =>
                            quantity(p, (quantities[p.id] || 0) + 1)
                          }
                          style={[
                            s.step,
                            (busy || (quantities[p.id] || 0) >= p.stock) &&
                              s.disabled,
                          ]}
                        >
                          <Text style={s.stepText}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
            {error.length > 0 && (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            )}
          </ScrollView>
          <View style={s.summary}>
            <View style={s.row}>
              <View>
                <Text style={s.hint}>{units} unidades · total estimado</Text>
                <Text style={s.total}>{money(total)}</Text>
              </View>
              {busy && <ActivityIndicator color="#175b72" />}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: busy || loading || !!loadError || !client || !units,
                busy,
              }}
              disabled={busy || loading || !!loadError || !client || !units}
              onPress={() => void save()}
              style={[
                s.button,
                (busy || loading || !client || !units) && s.disabled,
              ]}
            >
              <Text style={s.white}>
                {busy ? "Creando pedido…" : "Crear pedido"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f6f9" },
  header: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#dce5eb",
    backgroundColor: "#fff",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#33758a",
  },
  title: { fontSize: 26, fontWeight: "700", color: "#1b2d38", marginTop: 5 },
  close: { minHeight: 44, justifyContent: "center", padding: 10 },
  link: { color: "#175b72", fontWeight: "600" },
  content: { padding: 18, gap: 14, paddingBottom: 28 },
  label: { fontSize: 19, fontWeight: "700", color: "#1b2d38", marginTop: 8 },
  hint: { color: "#617482", fontSize: 14, lineHeight: 21 },
  customerList: { gap: 9 },
  customer: {
    padding: 15,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#dce5eb",
    borderRadius: 9,
    backgroundColor: "#fff",
  },
  chosen: { backgroundColor: "#e1f0f5", borderColor: "#4e8ba1" },
  name: { color: "#1b2d38", fontSize: 16, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 11,
    padding: 17,
    gap: 11,
    borderWidth: 1,
    borderColor: "#dce5eb",
  },
  price: { fontSize: 18, color: "#175b72", fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  quantity: { flexDirection: "row", alignItems: "center", gap: 5 },
  step: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f1f5",
  },
  stepText: { fontSize: 23, color: "#175b72", fontWeight: "600" },
  quantityInput: {
    minWidth: 50,
    minHeight: 44,
    maxWidth: 100,
    textAlign: "center",
    fontSize: 17,
    color: "#1b2d38",
    borderWidth: 1,
    borderColor: "#dce5eb",
    borderRadius: 7,
  },
  summary: {
    padding: 18,
    gap: 13,
    borderTopWidth: 1,
    borderColor: "#dce5eb",
    backgroundColor: "#fff",
  },
  total: { fontSize: 25, fontWeight: "700", color: "#1b2d38", marginTop: 5 },
  button: {
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#175b72",
  },
  white: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },
  error: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#fde8e6",
    color: "#a13d35",
    fontSize: 14,
    lineHeight: 21,
  },
});
