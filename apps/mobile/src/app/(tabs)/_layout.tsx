import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";
import { colors } from "../../theme/colors";

const tabs = [
  { name: "index", label: "Início", icon: "⌂" },
  { name: "representatives", label: "Agentes", icon: "◎" },
  { name: "activity", label: "Atuação", icon: "▤" },
  { name: "expenses", label: "Despesas", icon: "R$" },
  { name: "more", label: "Mais", icon: "···" },
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: Platform.OS === "web" ? 68 : 74,
          paddingBottom: Platform.OS === "web" ? 9 : 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarItemStyle: { minHeight: 44 },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarLabel: tab.label,
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <Text
                accessible={false}
                style={{
                  color,
                  fontSize: tab.icon === "R$" ? 14 : 22,
                  fontWeight: focused ? "800" : "600",
                  lineHeight: 25,
                }}
              >
                {tab.icon}
              </Text>
            ),
          }}
        />
      ))}
      <Tabs.Screen name="commitments" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}
