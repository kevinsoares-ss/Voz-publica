import { Tabs } from "expo-router";
import { colors } from "../../theme/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 66,
          paddingBottom: 8,
          paddingTop: 7,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", tabBarLabel: "Início" }} />
      <Tabs.Screen name="representatives" options={{ title: "Agentes", tabBarLabel: "Agentes" }} />
      <Tabs.Screen name="commitments" options={{ title: "Compromissos", tabBarLabel: "Compromissos" }} />
      <Tabs.Screen name="favorites" options={{ title: "Favoritos", tabBarLabel: "Favoritos" }} />
    </Tabs>
  );
}
