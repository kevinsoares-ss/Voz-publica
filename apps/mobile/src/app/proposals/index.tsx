import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import { Screen } from "../../components/Screen";
import { getProposals, type OfficialRecord } from "../../services/api";
import { colors } from "../../theme/colors";

function field(record: OfficialRecord, key: string): string | null {
  const value = record[key];
  if (typeof value === "string" || typeof value === "number") return String(value);
  return null;
}

export default function ProposalsScreen() {
  const router = useRouter();
  const [yearText, setYearText] = useState("2025");
  const [typeText, setTypeText] = useState("PL");
  const [year, setYear] = useState(2025);
  const [type, setType] = useState("PL");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<OfficialRecord[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void search();
  }, []);

  async function search(nextPage = 1, append = false) {
    const parsedYear = Number(yearText);
    const parsedType = typeText.trim().toUpperCase();
    if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2200) {
      setError("Informe um ano válido entre 1900 e 2200.");
      return;
    }
    if (!/^[A-Z]{1,10}$/.test(parsedType)) {
      setError("Informe uma sigla de tipo válida, por exemplo PL.");
      return;
    }
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const result = await getProposals({
        page: nextPage,
        year: parsedYear,
        type: parsedType,
        limit: 20,
      });
      setRecords((current) => append ? [...current, ...result.data] : result.data);
      setHasMore(Boolean(result.pagination.nextUrl));
      setPage(nextPage);
      setYear(parsedYear);
      setType(parsedType);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível consultar a Câmara.");
      if (!append) setRecords([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.kicker}>DADOS OFICIAIS</Text>
      <Text style={styles.title}>Proposições</Text>
      <Text style={styles.subtitle}>Pesquise proposições legislativas diretamente na API da Câmara.</Text>
      <View style={styles.filters}>
        <View style={styles.field}>
          <Text style={styles.label}>Tipo</Text>
          <TextInput value={typeText} onChangeText={setTypeText} autoCapitalize="characters" maxLength={10} style={styles.input} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Ano</Text>
          <TextInput value={yearText} onChangeText={setYearText} keyboardType="number-pad" maxLength={4} style={styles.input} />
        </View>
        <Pressable onPress={() => void search()} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </Pressable>
      </View>

      <Text style={styles.resultLabel}>
        {loading ? "Consultando fonte oficial..." : `${records.length} registro(s) nesta página`}
      </Text>
      {loading ? <LoadingState label="Consultando proposições oficiais..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void search()} /> : null}
      {!loading && !error && records.length === 0 ? (
        <EmptyState
          title="Nenhuma proposição retornada"
          body="A fonte não retornou proposições para estes filtros. Tente outro tipo ou ano; não presumimos resultados ausentes."
        />
      ) : null}
      {!error ? records.map((record, index) => {
        const id = field(record, "id");
        const title = field(record, "ementa") ?? "Ementa não informada pela fonte";
        const type = field(record, "siglaTipo") ?? "Proposição";
        const number = field(record, "numero");
        const year = field(record, "ano");
        return (
          <Pressable
            key={id ?? `record-${index}`}
            onPress={() => {
              if (id) router.push(`/proposals/${encodeURIComponent(id)}`);
            }}
            style={styles.card}
          >
            <Text style={styles.badge}>{[type, number && `nº ${number}`, year].filter(Boolean).join(" · ")}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardLink}>Ver detalhes, tramitações e votações →</Text>
          </Pressable>
        );
      }) : null}
      {hasMore && !loading && !error ? (
        <Pressable
          disabled={loadingMore}
          onPress={() => void search(page + 1, true)}
          style={styles.moreButton}
        >
          <Text style={styles.searchButtonText}>{loadingMore ? "Carregando..." : "Carregar próxima página"}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.source}>Fonte: Câmara dos Deputados — Dados Abertos.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 30, fontWeight: "800", marginTop: -8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: -9 },
  filters: { flexDirection: "row", alignItems: "flex-end", gap: 9 },
  field: { flex: 1, gap: 5 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  input: { backgroundColor: colors.white, color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12 },
  searchButton: { backgroundColor: colors.forest, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 },
  searchButtonText: { color: colors.white, fontWeight: "800", fontSize: 13 },
  resultLabel: { color: colors.muted, fontSize: 12 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, gap: 8 },
  badge: { color: colors.green, fontSize: 11, fontWeight: "800" },
  cardTitle: { color: colors.ink, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  cardLink: { color: colors.forest, fontSize: 12, fontWeight: "700" },
  moreButton: { backgroundColor: colors.forest, borderRadius: 13, alignItems: "center", padding: 14 },
  source: { color: colors.muted, fontSize: 11, textAlign: "center" },
});
