import { Link, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ErrorState } from "../../components/Feedback";
import { Screen } from "../../components/Screen";
import { checkApiHealth } from "../../services/api";
import { colors } from "../../theme/colors";

export default function HomeScreen() {
  const [apiState, setApiState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  async function checkHealth() {
    setApiState("loading");
    try {
      await checkApiHealth();
      setApiState("ready");
      setError("");
    } catch (caught) {
      setApiState("error");
      setError(caught instanceof Error ? caught.message : "Falha inesperada.");
    }
  }

  useEffect(() => {
    void checkHealth();
  }, []);

  return (
    <Screen>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}><Text style={styles.brandGlyph}>V</Text></View>
        <View>
          <Text style={styles.brandName}>Voz Pública</Text>
          <Text style={styles.brandTagline}>Informação pública, com fonte.</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TRANSPARÊNCIA PÚBLICA</Text>
        <Text style={styles.headline}>Acompanhe a atuação pública com contexto.</Text>
        <Text style={styles.heroBody}>
          Consulte informações oficiais sobre agentes públicos. Cada dado
          preserva sua origem e quando foi consultado.
        </Text>
        <Link href={"/(tabs)/representatives" as Href} asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Consultar agentes públicos  →</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.statusCard}>
        <View style={[styles.statusDot, apiState === "ready" ? styles.goodDot : null]} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>
            {apiState === "loading" ? "Verificando conexão" : apiState === "ready" ? "API conectada" : "API indisponível"}
          </Text>
          <Text style={styles.statusBody}>
            {apiState === "ready"
              ? "Os dados vêm do serviço local e da fonte oficial."
              : apiState === "error"
                ? error
                : "Conferindo a API e o banco de dados."}
          </Text>
        </View>
        {apiState === "error" ? (
          <Pressable accessibilityRole="button" onPress={() => void checkHealth()}>
            <Text style={styles.retry}>Tentar</Text>
          </Pressable>
        ) : null}
      </View>

      {apiState === "error" ? (
        <ErrorState message={error} onRetry={() => void checkHealth()} />
      ) : null}

      <Text style={styles.sectionTitle}>Explore</Text>
      <Link href={"/(tabs)/representatives" as Href} asChild>
        <Pressable style={styles.linkCard}>
          <View style={styles.linkIcon}><Text style={styles.linkGlyph}>01</Text></View>
          <View style={styles.linkCopy}>
            <Text style={styles.linkTitle}>Agentes públicos</Text>
            <Text style={styles.linkBody}>Pesquise por cargo, nome, partido ou localização.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </Link>
      <Link href={"/(tabs)/commitments" as Href} asChild>
        <Pressable style={styles.linkCard}>
          <View style={[styles.linkIcon, styles.iconGold]}><Text style={styles.goldGlyph}>02</Text></View>
          <View style={styles.linkCopy}>
            <Text style={styles.linkTitle}>Compromissos documentados</Text>
            <Text style={styles.linkBody}>Registros e evidências, sem conclusões automáticas.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </Link>
      <Link href={"/cgu/expenses" as Href} asChild>
        <Pressable style={styles.linkCard}>
          <View style={[styles.linkIcon, styles.iconGold]}><Text style={styles.goldGlyph}>03</Text></View>
          <View style={styles.linkCopy}>
            <Text style={styles.linkTitle}>Despesas do Executivo Federal</Text>
            <Text style={styles.linkBody}>Consulte valores anuais por órgão publicados pela CGU.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </Link>
      <Link href={"/proposals" as Href} asChild>
        <Pressable style={styles.linkCard}>
          <View style={[styles.linkIcon, styles.iconGold]}><Text style={styles.goldGlyph}>04</Text></View>
          <View style={styles.linkCopy}>
            <Text style={styles.linkTitle}>Proposições legislativas</Text>
            <Text style={styles.linkBody}>Pesquise proposições, tramitações e votações oficiais.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </Link>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Nosso compromisso</Text>
        <Text style={styles.disclaimerBody}>
          Não inventamos dados. Quando a fonte não informa ou não retorna
          registros, isso é indicado com clareza.
        </Text>
      </View>
      <Text style={styles.footer}>Fontes consultadas: Câmara e Senado · Dados Abertos</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 3 },
  brandMark: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  brandGlyph: { color: colors.white, fontSize: 22, fontWeight: "800" },
  brandName: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  brandTagline: { color: colors.muted, fontSize: 12, marginTop: 2 },
  hero: { backgroundColor: colors.forest, borderRadius: 24, padding: 22, gap: 12 },
  eyebrow: { color: "#B9D7C8", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  headline: { color: colors.white, fontSize: 26, lineHeight: 32, fontWeight: "800" },
  heroBody: { color: "#DCEBE2", fontSize: 14, lineHeight: 21 },
  primaryButton: { backgroundColor: "#D2E8DA", paddingVertical: 13, paddingHorizontal: 16, borderRadius: 13, alignSelf: "flex-start", marginTop: 3 },
  primaryButtonText: { color: colors.forest, fontWeight: "800", fontSize: 14 },
  statusCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 15, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.amber },
  goodDot: { backgroundColor: "#39845E" },
  statusCopy: { flex: 1, gap: 3 },
  statusTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  statusBody: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  retry: { color: colors.forest, fontWeight: "700" },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "800", marginTop: 2 },
  linkCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 17, padding: 14, gap: 12 },
  linkIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  linkGlyph: { color: colors.forest, fontWeight: "800" },
  iconGold: { backgroundColor: colors.amberBackground },
  goldGlyph: { color: colors.amber, fontWeight: "800" },
  linkCopy: { flex: 1, gap: 4 },
  linkTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  linkBody: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  arrow: { color: colors.green, fontSize: 25 },
  disclaimer: { padding: 16, borderRadius: 17, backgroundColor: colors.mint, gap: 5 },
  disclaimerTitle: { color: colors.forest, fontSize: 13, fontWeight: "800" },
  disclaimerBody: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  footer: { color: colors.muted, fontSize: 11, textAlign: "center", paddingVertical: 4 },
});
