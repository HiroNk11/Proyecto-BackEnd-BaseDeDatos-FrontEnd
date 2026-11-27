import { StyleSheet, Text } from "react-native";
const colors: Record<string, { backgroundColor: string; color: string }> = {
  Pendiente: { backgroundColor: "#fff1d1", color: "#805512" },
  Confirmado: { backgroundColor: "#e3efff", color: "#265a94" },
  "En preparación": { backgroundColor: "#eee5fa", color: "#7143a1" },
  EnPreparacion: { backgroundColor: "#eee5fa", color: "#7143a1" },
  Enviado: { backgroundColor: "#dff2f4", color: "#236773" },
  Entregado: { backgroundColor: "#e1f3e8", color: "#226445" },
  Cancelado: { backgroundColor: "#fde7e5", color: "#a13d35" },
};
export default function StatusBadge({ estado }: { estado: string }) {
  return (
    <Text
      style={[
        s.badge,
        colors[estado] || { backgroundColor: "#eef2f5", color: "#425d6c" },
      ]}
    >
      {estado === "EnPreparacion" ? "En preparación" : estado}
    </Text>
  );
}
const s = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 7,
    overflow: "hidden",
  },
});
