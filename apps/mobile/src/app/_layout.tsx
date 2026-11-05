import { Stack } from "expo-router";
import { colors } from "../theme/colors";
import { ThemeProvider } from "../theme/ThemeProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
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
        <Stack.Screen name="sources" options={{ title: "Fontes e metodologia" }} />
        <Stack.Screen name="sources/[id]" options={{ title: "Detalhe da fonte" }} />
        <Stack.Screen name="search" options={{ title: "Busca global" }} />
        <Stack.Screen name="agencies" options={{ title: "Órgãos públicos" }} />
        <Stack.Screen name="help" options={{ title: "Ajuda e reporte" }} />
        <Stack.Screen name="settings" options={{ title: "Acessibilidade e preferências" }} />
        <Stack.Screen name="about" options={{ title: "Sobre o Voz Pública" }} />
      </Stack>
    </ThemeProvider>
  );
}
