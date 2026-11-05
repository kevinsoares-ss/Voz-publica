import { useRouter, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import { Screen } from "../components/Screen";
import { getCguAgencies, type CguAgency } from "../services/api";
import { colors } from "../theme/colors";

export default function AgenciesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [agencies, setAgencies] = useState<CguAgency[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consultedAt, setConsultedAt] = useState("");

  const search = useCallback(async () => {
    const term = query.trim();
    if (term.length < 2) {
      setError("Digite pelo menos 2 caracteres para buscar no catálogo SIAFI.");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const result = await getCguAgencies(term);
      setAgencies(result.data);
      setConsultedAt(result.source.consultedAt);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível consultar o catálogo oficial.",
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <Screen>
      <Text style={styles.kicker}>DIRETÓRIO OFICIAL</Text>
      <Text style={styles.title}>Órgãos públicos</Text>
      <Text style={styles.subtitle}>
        Consulte o catálogo SIAFI da CGU. Os códigos e nomes são apresentados
        conforme a fonte; nenhum identificador é presumido.
      </Text>
      <Text style={styles.label}>Nome ou trecho do nome do órgão</Text>
      <TextInput
        accessibilityLabel="Buscar órgão público"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => void search()}
        maxLength={100}
        placeholder="Ex.: Ministério da Saúde"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() => void search()}
        style={[styles.button, loading && styles.disabled]}
      >
        <Text style={styles.buttonText}>
          {loading ? "Pesquisando..." : "Pesquisar no catálogo"}
        </Text>
      </Pressable>
      {loading ? <LoadingState label="Consultando órgãos na CGU..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void search()} /> : null}
      {!loading && !error && searched && agencies.length === 0 ? (
        <EmptyState
          title="Nenhum órgão retornado"
          body="O catálogo SIAFI não retornou resultados para este termo. Tente parte do nome ou uma grafia diferente."
        />
      ) : null}
      {!error && agencies.map((agency, index) => (
        <Pressable
          key={`${agency.codigo ?? "agency"}-${index}`}
          accessibilityRole="link"
          onPress={() =>
            router.push({
              pathname: "/cgu/expenses",
              params: {
                agencyCode: agency.codigo ?? "",
                agencyName: agency.descricao ?? "",
              },
            } as Href)
          }
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>
              {agency.descricao ?? "Nome não informado pela fonte"}
            </Text>
            <Text style={styles.cardMeta}>
              Código SIAFI: {agency.codigo ?? "não informado"}
            </Text>
          </View>
          <Text style={styles.arrow} accessible={false}>›</Text>
        </Pressable>
      ))}
      {consultedAt ? (
        <Text style={styles.source}>
          Portal da Transparência — CGU · consultado em{" "}
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" })
            .format(new Date(consultedAt))}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 48,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    color: colors.ink,
  },
  button: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontWeight: "800" },
  card: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.82 },
  cardCopy: { flex: 1, gap: 5 },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  cardMeta: { color: colors.muted, fontSize: 12 },
  arrow: { color: colors.primary, fontSize: 24 },
  source: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
});
