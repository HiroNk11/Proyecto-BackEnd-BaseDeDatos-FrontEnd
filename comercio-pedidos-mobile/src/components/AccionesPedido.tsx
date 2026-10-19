import { useRef, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import type {
    AccionPedido,
} from "../services/pedidoService";
import {
    cambiarEstadoPedido,
} from "../services/pedidoService";

interface Props {
  pedidoId: number;
  estado: string;
  deshabilitado: boolean;
  onActualizado: (
    pedidoId: number,
    accion: AccionPedido
  ) => void;
}

const etiquetas: Record<AccionPedido, string> = {
  confirmar: "Confirmar",
  entregar: "Entregar",
  cancelar: "Cancelar pedido",
};

export default function AccionesPedido({
  pedidoId,
  estado,
  deshabilitado,
  onActualizado,
}: Props) {
  const [accion, setAccion] =
    useState<AccionPedido | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const enviando = useRef(false);

  const acciones: AccionPedido[] =
    estado === "Pendiente"
      ? ["confirmar", "cancelar"]
      : estado === "Confirmado"
        ? ["entregar", "cancelar"]
        : [];

  const ejecutar = async () => {
    if (!accion || enviando.current || deshabilitado) return;

    const accionElegida = accion;

    enviando.current = true;
    setGuardando(true);
    setError("");

    try {
      await cambiarEstadoPedido(pedidoId, accionElegida);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el pedido."
      );

      enviando.current = false;
      setGuardando(false);
      return;
    }

    enviando.current = false;
    setGuardando(false);
    setAccion(null);

    onActualizado(pedidoId, accionElegida);
  };

  if (acciones.length === 0) return null;

  return (
    <View style={styles.contenedor}>
      {accion === null ? (
        <View style={styles.fila}>
          {acciones.map((opcion) => (
            <Pressable
              key={opcion}
              accessibilityRole="button"
              disabled={deshabilitado || guardando}
              style={[
                styles.boton,
                opcion === "cancelar" && styles.peligro,
                (deshabilitado || guardando) &&
                  styles.deshabilitado,
              ]}
              onPress={() => {
                setError("");
                setAccion(opcion);
              }}
            >
              <Text style={styles.botonTexto}>
                {etiquetas[opcion]}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.confirmacion}>
          <Text style={styles.texto}>
            ¿Querés {accion} el pedido #{pedidoId}?
          </Text>

          {accion === "cancelar" && (
            <Text style={styles.texto}>
              Se devolverán sus unidades al stock.
            </Text>
          )}

          {error !== "" && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}

          <View style={styles.fila}>
            <Pressable
              accessibilityRole="button"
              disabled={guardando || deshabilitado}
              onPress={ejecutar}
              style={[
                styles.boton,
                accion === "cancelar" && styles.peligro,
                (guardando || deshabilitado) &&
                  styles.deshabilitado,
              ]}
            >
              <Text style={styles.botonTexto}>
                {guardando ? "Procesando..." : "Sí, continuar"}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={guardando}
              style={styles.volver}
              onPress={() => {
                setAccion(null);
                setError("");
              }}
            >
              <Text style={styles.texto}>Volver</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginTop: 8,
  },
  fila: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  boton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  peligro: {
    backgroundColor: "#dc2626",
  },
  botonTexto: {
    color: "#ffffff",
    fontWeight: "600",
  },
  confirmacion: {
    padding: 12,
    gap: 12,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  texto: {
    color: "#374151",
    fontSize: 14,
  },
  error: {
    color: "#991b1b",
  },
  volver: {
    padding: 12,
  },
  deshabilitado: {
    opacity: 0.5,
  },
});