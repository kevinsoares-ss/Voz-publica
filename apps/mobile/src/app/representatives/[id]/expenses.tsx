import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { EmptyState, ErrorState, LoadingState, Notice } from "../../../components/Feedback";
import { Screen } from "../../../components/Screen";
import { getExpenses, officialExpensesUrl, type OfficialList } from "../../../services/api";
import { colors } from "../../../theme/colors";

export default function RepresentativeExpensesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const representativeId = Array.isArray(id) ? id[0] : id;
  const [yearText, setYearText] = useState(String(new Date().getFullYear()));
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState<OfficialList | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextYear = Number(yearText)) {
    if (!representativeId || !Number.isInteger(nextYear) || nextYear < 1900 || nextYear > 2200) {
      setError("Informe um ano válido e um ID oficial de deputado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setResult(await getExpenses({ representativeId, year: nextYear, limit: 20 }));
      setYear(nextYear);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha inesperada.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [representativeId]);

  const officialUrl = representativeId ? officialExpensesUrl(representativeId, year) : "";

  return (
    <Screen>
      <Text style={styles.kicker}>CONSULTA OFICIAL</Text>
      <Text style={styles.title}>Despesas públicas</Text>
      <Text style={styles.subtitle}>Deputado ID {representativeId ?? "não informado"}</Text>
      <Text style={styles.label}>Ano</Text>
      <TextInput
        value={yearText}
        onChangeText={setYearText}
        keyboardType="number-pad"
        maxLength={4}
        style={styles.input}
        accessibilityLabel="Ano das despesas"
      />
      <Pressable onPress={() => void load()} style={styles.button}>
        <Text style={styles.buttonText}>Consultar Câmara</Text>
      </Pressable>
      <Notice
        title="Sem totais presumidos"
        body="O app não soma valores nem converte uma lista vazia em R$ 0,00. A resposta e o período consultado são apresentados conforme retornados pela fonte."
      />
      {loading ? <LoadingState label="Consultando despesas oficiais..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load(year)} /> : null}
      {!loading && !error && result?.data.length === 0 ? (
        <EmptyState
          title="Nenhuma despesa retornada"
          body={`A API oficial respondeu sem registros para o deputado e ano ${year}. Isso descreve somente esta consulta e seus filtros.`}
        />
      ) : null}
      {!loading && !error && result && result.data.length > 0 ? (
        <Notice
          title={`${result.data.length} registro(s) retornado(s)`}
          body="Os campos de despesa ainda não foram normalizados porque as amostras usadas na validação retornaram vazias. Consulte a resposta oficial para conferir os dados sem uma interpretação incompleta."
        />
      ) : null}
      {result ? (
        <>
          <Text style={styles.source}>Fonte consultada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.source.consultedAt))}</Text>
          <Pressable onPress={() => void Linking.openURL(officialUrl)} style={styles.sourceButton}>
            <Text style={styles.sourceButtonText}>Abrir consulta oficial ↗</Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: -8 },
  subtitle: { color: colors.muted, fontSize: 13 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: -8 },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.ink },
  button: { backgroundColor: colors.forest, borderRadius: 12, padding: 13, alignItems: "center" },
  buttonText: { color: colors.white, fontWeight: "800" },
  source: { color: colors.muted, fontSize: 11, textAlign: "center" },
  sourceButton: { backgroundColor: colors.mint, borderRadius: 12, padding: 12, alignItems: "center" },
  sourceButtonText: { color: colors.forest, fontSize: 13, fontWeight: "800" },
});
