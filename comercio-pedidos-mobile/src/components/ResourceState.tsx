import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
export default function ResourceState({
  loading,
  error,
  empty = "No hay resultados",
  onRetry,
}: {
  loading?: boolean;
  error?: string;
  empty?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={s.box} accessibilityRole={error ? "alert" : undefined}>
      {loading ? (
        <>
          <ActivityIndicator color="#175b72" />
          <Text style={s.text}>Cargando datos…</Text>
        </>
      ) : (
        <>
          <Text style={[s.text, error ? s.error : s.title]}>
            {error || empty}
          </Text>
          {!error && (
            <Text style={s.text}>
              Actualizá la vista o registrá la primera operación.
            </Text>
          )}
          {onRetry && (
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={s.button}
            >
              <Text style={s.buttonText}>
                {error ? "Reintentar" : "Actualizar"}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  box: {
    padding: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce5eb",
    backgroundColor: "#fff",
    gap: 12,
    alignItems: "center",
  },
  text: { fontSize: 14, lineHeight: 22, color: "#536a78" },
  error: { color: "#a13d35" },
  title: { fontSize: 17, fontWeight: "600", color: "#1b2d38" },
  button: {
    minHeight: 44,
    padding: 12,
    borderRadius: 7,
    backgroundColor: "#eaf2f6",
  },
  buttonText: { color: "#175b72", fontWeight: "600" },
});
