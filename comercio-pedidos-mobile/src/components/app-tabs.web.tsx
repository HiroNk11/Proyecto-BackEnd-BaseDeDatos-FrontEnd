import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import { Pressable, StyleSheet, Text, View } from "react-native";
function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={[s.tab, isFocused && s.active]}
    >
      <Text style={[s.text, isFocused && s.selected]}>{children}</Text>
    </Pressable>
  );
}
export default function AppTabs() {
  return (
    <Tabs style={s.root}>
      <TabList asChild>
        <View style={s.nav}>
          {[
            { name: "index", href: "/" as const, label: "Productos" },
            { name: "clientes", href: "/clientes" as const, label: "Clientes" },
            { name: "pedidos", href: "/pedidos" as const, label: "Pedidos" },
            { name: "stock", href: "/stock" as const, label: "Stock" },
          ].map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </View>
      </TabList>
      <TabSlot style={s.root} />
    </Tabs>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#dce5eb",
  },
  tab: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: "#e4eff5" },
  text: { fontSize: 13, color: "#536a78" },
  selected: { fontWeight: "700", color: "#175b72" },
});
