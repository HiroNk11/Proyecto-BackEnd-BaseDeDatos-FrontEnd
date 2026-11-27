import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AccionesPedido from "../components/AccionesPedido";
import NuevoPedidoModal from "../components/NuevoPedidoModal";
import ResourceState from "../components/ResourceState";
import StatusBadge from "../components/StatusBadge";
import { errorMessage } from "../lib/problem";
import type { Pedido, PedidosPaginados } from "../models/Pedido";
import { obtenerPedido, obtenerPedidos } from "../services/pedidoService";
const filters = [
  { label: "Todos", value: "" },
  { label: "Pendientes", value: "Pendiente" },
  { label: "Confirmados", value: "Confirmado" },
  { label: "Entregados", value: "Entregado" },
  { label: "Cancelados", value: "Cancelado" },
];
const money = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    amount,
  );
export default function PedidosScreen() {
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [data, setData] = useState<PedidosPaginados | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState<Pedido | null>(null);
  function refresh() {
    if (loading) return;
    setLoading(true);
    setError("");
    setRevision((v) => v + 1);
  }
  useEffect(() => {
    let active = true;
    obtenerPedidos(page, 10, status || undefined)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((failure: unknown) => {
        if (active) {
          setError(errorMessage(failure));
          setData(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, status, revision]);
  function filter(value: string) {
    setStatus(value);
    setPage(1);
    setError("");
    setLoading(true);
    setRevision((v) => v + 1);
  }
  async function refreshDetail() {
    if (!selected || detailBusy || detailRefreshing) return;
    setDetailRefreshing(true);
    setDetailError("");
    try {
      setSelected(await obtenerPedido(selected.id));
    } catch (failure) {
      setDetailError(errorMessage(failure));
    } finally {
      setDetailRefreshing(false);
    }
  }
  function updated(id: number) {
    setSelected(null);
    setSuccess(`Pedido #${id} actualizado.`);
    setError("");
    setLoading(true);
    setRevision((v) => v + 1);
  }
  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <FlatList
        data={error ? [] : data?.items || []}
        refreshing={loading && !!data}
        onRefresh={refresh}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.heading}>
            <Text style={s.brand}>COMERCIOPEDIDOS</Text>
            <Text style={s.title}>Tus operaciones, al día.</Text>
            <Text style={s.text}>Seguimiento e historial de pedidos.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSuccess("");
                setCreate(true);
              }}
              style={s.primary}
            >
              <Text style={s.white}>Nuevo pedido</Text>
            </Pressable>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filters}
            >
              {filters.map((item) => (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: status === item.value,
                    disabled: loading,
                  }}
                  disabled={loading}
                  onPress={() => filter(item.value)}
                  style={[s.chip, status === item.value && s.chosen]}
                >
                  <Text style={[s.chipText, status === item.value && s.white]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {success.length > 0 && (
              <Text accessibilityRole="alert" style={s.success}>
                {success}
              </Text>
            )}
            {loading && (
              <View style={s.loading}>
                <ActivityIndicator color="#175b72" />
                <Text style={s.text}>Actualizando pedidos…</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <ResourceState
              error={error}
              empty="Aún no tenés pedidos en esta vista"
              onRetry={refresh}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver pedido ${item.id}`}
            onPress={() => {
              setDetailError("");
              setSelected(item);
            }}
            style={s.card}
          >
            <View style={s.row}>
              <Text style={s.number}>Pedido #{item.id}</Text>
              <StatusBadge estado={item.estado} />
            </View>
            <Text style={s.customer}>{item.nombreCliente}</Text>
            <Text style={s.text}>
              {new Date(item.fecha).toLocaleDateString("es-AR")} ·{" "}
              {item.detalles.reduce((n, d) => n + d.cantidad, 0)} unidades
            </Text>
            <View style={s.row}>
              <Text style={s.total}>{money(item.total)}</Text>
              <Text style={s.link}>Ver detalle</Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          data && data.totalPaginas > 0 ? (
            <View style={s.pagination}>
              <Pressable
                accessibilityRole="button"
                disabled={loading || page <= 1}
                style={[s.secondary, (loading || page <= 1) && s.disabled]}
                onPress={() => {
                  setLoading(true);
                  setPage(page - 1);
                }}
              >
                <Text style={s.link}>Anterior</Text>
              </Pressable>
              <Text style={s.text}>
                {page} / {data.totalPaginas}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={loading || page >= data.totalPaginas}
                style={[
                  s.secondary,
                  (loading || page >= data.totalPaginas) && s.disabled,
                ]}
                onPress={() => {
                  setLoading(true);
                  setPage(page + 1);
                }}
              >
                <Text style={s.link}>Siguiente</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
      {create && (
        <NuevoPedidoModal
          onCerrar={() => setCreate(false)}
          onCreado={(id) => {
            setCreate(false);
            setSuccess(`Pedido #${id} creado.`);
            setPage(1);
            setLoading(true);
            setRevision((v) => v + 1);
          }}
        />
      )}
      {selected && (
        <Modal
          visible
          animationType="slide"
          onRequestClose={() => {
            if (!detailBusy && !detailRefreshing) setSelected(null);
          }}
        >
          <SafeAreaView style={s.root}>
            <ScrollView
              contentContainerStyle={s.content}
              refreshControl={
                <RefreshControl
                  refreshing={detailRefreshing}
                  onRefresh={() => void refreshDetail()}
                />
              }
            >
              <Pressable
                accessibilityRole="button"
                disabled={detailBusy || detailRefreshing}
                onPress={() => setSelected(null)}
                style={s.secondary}
              >
                <Text style={s.link}>Volver a pedidos</Text>
              </Pressable>
              <Text style={s.title}>Pedido #{selected.id}</Text>
              <StatusBadge estado={selected.estado} />
              {detailError.length > 0 && (
                <Text accessibilityRole="alert" style={{ color: "#a13d35" }}>
                  {detailError}
                </Text>
              )}
              <Text style={s.customer}>{selected.nombreCliente}</Text>
              <Text style={s.text}>
                {new Date(selected.fecha).toLocaleString("es-AR")}
              </Text>
              {selected.detalles.map((line, index) => (
                <View style={s.card} key={`${line.productoId}-${index}`}>
                  <Text style={s.customer}>{line.nombreProducto}</Text>
                  <Text style={s.text}>
                    {line.cantidad} × {money(line.precioUnitario)}
                  </Text>
                  <Text style={s.total}>{money(line.subtotal)}</Text>
                </View>
              ))}
              <Text style={s.total}>Total {money(selected.total)}</Text>
              <AccionesPedido
                key={`${selected.id}-${selected.estado}`}
                onBusyChange={setDetailBusy}
                pedidoId={selected.id}
                estado={selected.estado}
                deshabilitado={loading || detailRefreshing}
                onActualizado={updated}
              />
              <Pressable
                accessibilityRole="button"
                disabled={detailBusy || detailRefreshing}
                onPress={() => void refreshDetail()}
                style={s.secondary}
              >
                <Text style={s.link}>Actualizar seguimiento</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f6f9" },
  content: { padding: 20, paddingBottom: 36, gap: 15, flexGrow: 1 },
  heading: { gap: 12, marginBottom: 8 },
  brand: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: "#39778b",
  },
  title: { fontSize: 28, fontWeight: "700", color: "#1b2d38", lineHeight: 34 },
  text: { color: "#617482", fontSize: 14, lineHeight: 21 },
  primary: {
    backgroundColor: "#175b72",
    padding: 14,
    borderRadius: 9,
    minHeight: 48,
    alignItems: "center",
  },
  white: { color: "#fff", fontWeight: "600" },
  filters: { gap: 9, paddingVertical: 4 },
  chip: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d4e0e8",
    borderRadius: 8,
    minHeight: 44,
    backgroundColor: "#fff",
  },
  chosen: { backgroundColor: "#175b72", borderColor: "#175b72" },
  chipText: { color: "#425d6c", fontSize: 14 },
  card: {
    borderWidth: 1,
    borderColor: "#dce5eb",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  number: { fontSize: 15, fontWeight: "600", color: "#4b6370" },
  customer: { fontSize: 18, fontWeight: "600", color: "#1b2d38" },
  total: { fontSize: 22, fontWeight: "700", color: "#175b72" },
  link: { color: "#175b72", fontWeight: "600", fontSize: 14 },
  secondary: {
    padding: 13,
    borderRadius: 8,
    backgroundColor: "#e5eef4",
    minHeight: 46,
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
  },
  disabled: { opacity: 0.4 },
  success: {
    padding: 14,
    backgroundColor: "#e1f3e8",
    color: "#226445",
    borderRadius: 8,
    fontSize: 14,
  },
  loading: { flexDirection: "row", gap: 10, alignItems: "center" },
});
