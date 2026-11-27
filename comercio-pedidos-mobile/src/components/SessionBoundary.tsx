import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  clearSession,
  dismissSessionNotice,
  getSessionSnapshot,
  setDevelopmentToken,
  subscribeSession,
} from "../lib/session";

export default function SessionBoundary({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  function connect() {
    if (!setDevelopmentToken(token)) {
      setError(
        "Ingresá un JWT con sus tres segmentos. La API validará la sesión.",
      );
      return;
    }
    setToken("");
    setOpen(false);
    setError("");
  }
  return (
    <View style={s.root}>
      {__DEV__ && (
        <View style={s.toolbar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(!open)}
            style={s.touch}
          >
            <Text style={s.link}>Acceso de desarrollo</Text>
          </Pressable>
          {(open || session.status === 401) && (
            <View style={s.form}>
              <Text style={s.text}>
                Token temporal en memoria. No se guarda ni se registra.
              </Text>
              <TextInput
                accessibilityLabel="Access token"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                value={token}
                onChangeText={setToken}
                style={s.input}
                placeholder="JWT de desarrollo"
              />
              <View style={s.row}>
                <Pressable
                  accessibilityRole="button"
                  onPress={connect}
                  style={s.button}
                >
                  <Text style={s.white}>Usar token</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    clearSession();
                    setToken("");
                  }}
                  style={s.touch}
                >
                  <Text style={s.link}>Borrar sesión</Text>
                </Pressable>
              </View>
              {error.length > 0 && (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
      {session.status && (
        <View accessibilityRole="alert" style={s.notice}>
          <Text style={s.heading}>
            {session.status === 401
              ? "Sesión requerida o expirada"
              : "Acceso restringido"}
          </Text>
          <Text style={s.text}>
            {session.status === 401
              ? "Identificate para continuar. En desarrollo podés configurar un token temporal."
              : "Tu cuenta no tiene permisos para esta operación. Las demás funciones siguen disponibles."}
          </Text>
          {session.status === 403 && (
            <Pressable
              accessibilityRole="button"
              onPress={dismissSessionNotice}
              style={s.touch}
            >
              <Text style={s.link}>Ocultar aviso</Text>
            </Pressable>
          )}
        </View>
      )}
      {session.status !== 401 && (
        <View key={session.revision} style={s.root}>
          {children}
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 },
  toolbar: {
    paddingHorizontal: 16,
    backgroundColor: "#edf4f7",
    borderBottomWidth: 1,
    borderColor: "#d5e2e9",
  },
  touch: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  link: { fontSize: 14, fontWeight: "600", color: "#175b72" },
  form: { gap: 12, paddingBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#b8cad5",
    backgroundColor: "#fff",
    color: "#1b2d38",
    padding: 12,
    borderRadius: 7,
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  button: {
    minHeight: 46,
    padding: 12,
    borderRadius: 7,
    backgroundColor: "#175b72",
  },
  white: { color: "#fff", fontWeight: "600" },
  notice: {
    padding: 18,
    gap: 10,
    backgroundColor: "#fff2d7",
    borderBottomWidth: 1,
    borderColor: "#ead6a5",
  },
  heading: { fontWeight: "700", fontSize: 17, color: "#76521a" },
  text: { fontSize: 14, lineHeight: 21, color: "#425d6c" },
  error: { fontSize: 14, color: "#9e3434" },
});
