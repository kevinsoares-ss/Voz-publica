import { Stack } from "expo-router";
import { colors } from "../theme/colors";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.forest,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="representatives/[id]" options={{ title: "Perfil público" }} />
      <Stack.Screen name="representatives/[id]/expenses" options={{ title: "Despesas" }} />
      <Stack.Screen name="proposals/index" options={{ title: "Proposições" }} />
      <Stack.Screen name="proposals/[id]" options={{ title: "Detalhes da proposição" }} />
      <Stack.Screen name="votes/[id]" options={{ title: "Votos individuais" }} />
    </Stack>
  );
}
