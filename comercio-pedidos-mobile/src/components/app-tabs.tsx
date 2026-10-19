import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>
          Productos
        </NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="clientes">
        <NativeTabs.Trigger.Label>
          Clientes
        </NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/explore.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="pedidos">
  <NativeTabs.Trigger.Label>Pedidos</NativeTabs.Trigger.Label>

  <NativeTabs.Trigger.Icon
    src={require("@/assets/images/tabIcons/explore.png")}
    renderingMode="template"
  />
</NativeTabs.Trigger>
<NativeTabs.Trigger name="stock">
  <NativeTabs.Trigger.Label>Stock</NativeTabs.Trigger.Label>

  <NativeTabs.Trigger.Icon
    src={require("@/assets/images/tabIcons/explore.png")}
    renderingMode="template"
  />
</NativeTabs.Trigger>
    </NativeTabs>
  );
}