import { useEffect, useState } from "react";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ErrorState } from "../../components/Feedback";
import { Screen } from "../../components/Screen";
import { checkApiHealth } from "../../services/api";
import { colors } from "../../theme/colors";

type ApiState = "loading" | "ready" | "error";

export default function HomeScreen() {
  const router = useRouter();
  const [apiState, setApiState] = useState<ApiState>("loading");
  const [search, setSearch] = useState("");

  async function checkHealth() {
    setApiState("loading");
    try {
      await checkApiHealth();
      setApiState("ready");
    } catch {
      setApiState("error");
    }
  }

  useEffect(() => {
    void checkHealth();
  }, []);

  function openSearch() {
    router.push({
      pathname: "/search",
      params: search.trim() ? { q: search.trim() } : {},
    } as Href);
  }

  return (
    <Screen>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandGlyph}>V</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>Voz Pública</Text>
          <Text style={styles.brandTagline}>Informação pública, com fonte.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir mais opções"
          onPress={() => router.push("/(tabs)/more" as Href)}
          style={styles.moreButton}
        >
          <Text style={styles.moreButtonText}>···</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TRANSPARÊNCIA PÚBLICA</Text>
        <Text style={styles.headline}>Acompanhe quem representa você.</Text>
        <Text style={styles.heroBody}>
          Consulte informações públicas com origem identificada e contexto
          claro.
        </Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon} accessible={false}>⌕</Text>
          <TextInput
            accessibilityLabel="Buscar agentes, proposições ou órgãos"
            placeholder="Busque agentes, proposições ou órgãos"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={openSearch}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              onPress={() => setSearch("")}
              hitSlop={8}
            >
              <Text style={styles.clearSearch}>×</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openSearch}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Buscar informações</Text>
          <Text style={styles.primaryArrow} accessible={false}>→</Text>
        </Pressable>
      </View>

      <View
        accessibilityRole="summary"
        style={styles.statusCard}
      >
        <View
          style={[
            styles.statusDot,
            apiState === "ready" && styles.goodDot,
            apiState === "error" && styles.errorDot,
          ]}
        />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>
            {apiState === "loading"
              ? "Verificando serviço"
              : apiState === "ready"
                ? "Serviço disponível"
                : "Serviço temporariamente indisponível"}
          </Text>
          <Text style={styles.statusBody}>
            {apiState === "ready"
              ? "Consultas públicas prontas para uso."
              : apiState === "error"
                ? "Tente novamente em instantes."
                : "Verificando conexão com os dados."}
          </Text>
        </View>
        {apiState === "error" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void checkHealth()}
            style={styles.retryButton}
          >
            <Text style={styles.retry}>Tentar</Text>
          </Pressable>
        ) : null}
      </View>
      {apiState === "error" ? (
        <ErrorState
          message="Não foi possível consultar o serviço agora."
          onRetry={() => void checkHealth()}
        />
      ) : null}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Explore</Text>
          <Text style={styles.sectionSubtitle}>Acesso rápido às consultas</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/more" as Href)}
        >
          <Text style={styles.seeAll}>Ver tudo</Text>
        </Pressable>
      </View>

      <View style={styles.shortcutGrid}>
        <Shortcut
          label="Agentes públicos"
          detail="Cargo, partido e localidade"
          icon="◎"
          onPress={() => router.push("/(tabs)/representatives" as Href)}
        />
        <Shortcut
          label="Atuação legislativa"
          detail="Proposições da Câmara"
          icon="▤"
          onPress={() => router.push("/(tabs)/activity" as Href)}
        />
        <Shortcut
          label="Despesas públicas"
          detail="Consultas oficiais"
          icon="R$"
          onPress={() => router.push("/(tabs)/expenses" as Href)}
        />
        <Shortcut
          label="Compromissos"
          detail="Registros documentados"
          icon="✓"
          onPress={() => router.push("/(tabs)/commitments" as Href)}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/sources" as Href)}
        style={styles.trustCard}
      >
        <View style={styles.trustIcon}>
          <Text style={styles.trustGlyph}>i</Text>
        </View>
        <View style={styles.trustCopy}>
          <Text style={styles.trustTitle}>Sobre os dados</Text>
          <Text style={styles.trustBody}>
            Veja fontes, escopo e limites de cada consulta.
          </Text>
        </View>
        <Text style={styles.arrow} accessible={false}>›</Text>
      </Pressable>
    </Screen>
  );
}

function Shortcut({
  label,
  detail,
  icon,
  onPress,
}: {
  label: string;
  detail: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
    >
      <View style={styles.shortcutIcon}>
        <Text style={styles.shortcutGlyph} accessible={false}>{icon}</Text>
      </View>
      <Text style={styles.shortcutTitle}>{label}</Text>
      <Text style={styles.shortcutDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  brandGlyph: { color: colors.white, fontSize: 22, fontWeight: "800" },
  brandCopy: { flex: 1 },
  brandName: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  brandTagline: { color: colors.muted, fontSize: 12, marginTop: 3 },
  moreButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  moreButtonText: { color: colors.ink, fontSize: 21, fontWeight: "800" },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: 22,
    padding: 22,
    gap: 12,
  },
  eyebrow: {
    color: "#B7CAE2",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  headline: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  heroBody: { color: "#D4DFEC", fontSize: 14, lineHeight: 21 },
  searchBox: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 2,
  },
  searchIcon: { color: colors.primary, fontSize: 24 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 11 },
  clearSearch: { color: colors.muted, fontSize: 23, paddingHorizontal: 4 },
  primaryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryPressed,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  primaryButtonText: { color: colors.white, fontWeight: "800", fontSize: 14 },
  primaryArrow: { color: colors.white, fontSize: 18 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  goodDot: { backgroundColor: colors.teal },
  errorDot: { backgroundColor: colors.red },
  statusCopy: { flex: 1, gap: 3 },
  statusTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  statusBody: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  retryButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  retry: { color: colors.primary, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: "800" },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: "700", padding: 8 },
  shortcutGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  shortcut: {
    width: "48%",
    flexGrow: 1,
    minHeight: 138,
    padding: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    gap: 7,
  },
  pressed: { opacity: 0.82 },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  shortcutGlyph: { color: colors.primary, fontSize: 19, fontWeight: "800" },
  shortcutTitle: { color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: "800" },
  shortcutDetail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  trustCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 14,
  },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  trustGlyph: { color: colors.primary, fontSize: 18, fontWeight: "800" },
  trustCopy: { flex: 1, gap: 3 },
  trustTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  trustBody: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  arrow: { color: colors.primary, fontSize: 25 },
});
