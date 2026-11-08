import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import { Screen } from "../components/Screen";
import {
  getCguAgencies,
  getProposal,
  getProposals,
  getRepresentatives,
  type CguAgency,
  type OfficialRecord,
  type Representative,
} from "../services/api";
import { colors } from "../theme/colors";

type SearchType = "all" | "representatives" | "proposals" | "agencies";
type ProposalResult = { id: string; title: string; code: string };

const filters: Array<{ value: SearchType; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "representatives", label: "Agentes" },
  { value: "proposals", label: "Proposições" },
  { value: "agencies", label: "Órgãos" },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const [query, setQuery] = useState(initialQuery ?? "");
  const [type, setType] = useState<SearchType>("all");
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [agencies, setAgencies] = useState<CguAgency[]>([]);
  const [proposals, setProposals] = useState<ProposalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partialErrors, setPartialErrors] = useState<string[]>([]);
  const requestId = useRef(0);
  const initialSearchDone = useRef(false);

  const runSearch = useCallback(async (term = query) => {
    const normalized = term.trim();
    if (!normalized) {
      setError("Digite um nome, código de proposição ou órgão para pesquisar.");
      setLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    setPartialErrors([]);
    setRepresentatives([]);
    setAgencies([]);
    setProposals([]);

    const tasks: Array<Promise<unknown>> = [];
    const taskTypes: SearchType[] = [];
    if (type === "all" || type === "representatives") {
      tasks.push(getRepresentatives({ page: 1, limit: 20, search: normalized }));
      taskTypes.push("representatives");
    }
    if ((type === "all" || type === "agencies") && normalized.length >= 2) {
      tasks.push(getCguAgencies(normalized));
      taskTypes.push("agencies");
    }
    if (type === "all" || type === "proposals") {
      tasks.push(searchProposal(normalized));
      taskTypes.push("proposals");
    }

    const results = await Promise.allSettled(tasks);
    if (requestId.current !== currentRequest) return;

    const failures: string[] = [];
    results.forEach((result, index) => {
      const resultType = taskTypes[index];
      if (result.status === "rejected") {
        const message =
          result.reason instanceof Error
            ? result.reason.message
            : "A fonte não respondeu à pesquisa.";
        failures.push(`${sourceLabel(resultType)}: ${message}`);
        return;
      }

      if (resultType === "representatives") {
        setRepresentatives(
          (result.value as { data: Representative[] }).data,
        );
      } else if (resultType === "agencies") {
        setAgencies((result.value as { data: CguAgency[] }).data);
      } else {
        setProposals(result.value as ProposalResult[]);
      }
    });

    setPartialErrors(failures);
    if (failures.length === results.length) {
      setError("As fontes disponíveis não puderam concluir esta pesquisa.");
    }
    setLoading(false);
  }, [query, type]);

  useEffect(() => {
    if (!initialQuery?.trim() || initialSearchDone.current) return;
    initialSearchDone.current = true;
    setQuery(initialQuery);
    void runSearch(initialQuery);
  }, [initialQuery, runSearch]);

  const visibleRepresentatives =
    type === "all" || type === "representatives" ? representatives : [];
  const visibleAgencies = type === "all" || type === "agencies" ? agencies : [];
  const visibleProposals = type === "all" || type === "proposals" ? proposals : [];
  const hasResults =
    visibleRepresentatives.length + visibleAgencies.length + visibleProposals.length > 0;

  return (
    <Screen>
      <Text style={styles.kicker}>CONSULTA MULTIFONTE</Text>
      <Text style={styles.title}>Busca global</Text>
      <Text style={styles.subtitle}>
        Pesquise agentes e órgãos. Proposições podem ser localizadas pelo
        identificador oficial, como “PL 123/2024”.
      </Text>

      <Text style={styles.label}>O que você quer encontrar?</Text>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Buscar agentes, proposições ou órgãos"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => void runSearch()}
          placeholder="Nome, PL 123/2024 ou órgão"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.input}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            onPress={() => setQuery("")}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() => void runSearch()}
        style={[styles.searchButton, loading && styles.disabled]}
      >
        <Text style={styles.searchButtonText}>
          {loading ? "Pesquisando..." : "Pesquisar"}
        </Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        accessibilityLabel="Tipos de resultado"
      >
        {filters.map((filter) => (
          <Pressable
            key={filter.value}
            accessibilityRole="button"
            accessibilityState={{ selected: type === filter.value }}
            onPress={() => setType(filter.value)}
            style={[styles.chip, type === filter.value && styles.chipSelected]}
          >
            <Text style={[styles.chipText, type === filter.value && styles.chipTextSelected]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? <LoadingState label="Consultando as fontes disponíveis..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={() => void runSearch()} />
      ) : null}
      {!loading && partialErrors.map((message) => (
        <Text key={message} style={styles.partialError}>{message}</Text>
      ))}
      {!loading && !error && !hasResults && query.trim() ? (
        <EmptyState
          title="Dados não encontrados"
          body="As fontes consultadas não retornaram registros para este termo. Confira a grafia ou tente outro identificador."
        />
      ) : null}
      {!query.trim() ? (
        <EmptyState
          title="Comece uma pesquisa"
          body="A busca usa cadastros oficiais disponíveis. Não há busca textual de proposições na fonte integrada; informe o tipo, número e ano para localizar uma proposição."
        />
      ) : null}

      {visibleRepresentatives.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agentes públicos</Text>
          {visibleRepresentatives.map((person) => (
            <ResultRow
              key={person.id}
              title={person.name}
              detail={[roleLabel(person.role), person.party, person.state]
                .filter(Boolean)
                .join(" · ")}
              source={person.source.name}
              onPress={() =>
                router.push({
                  pathname: "/representatives/[id]",
                  params: { id: person.id },
                } as Href)
              }
            />
          ))}
          <Text style={styles.source}>{visibleRepresentatives[0].source.name}</Text>
        </View>
      ) : null}

      {visibleProposals.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proposições da Câmara</Text>
          {visibleProposals.map((proposal) => (
            <ResultRow
              key={proposal.id}
              title={proposal.code}
              detail={proposal.title}
              source="Câmara dos Deputados — Dados Abertos"
              onPress={() => router.push(`/proposals/${proposal.id}` as Href)}
            />
          ))}
        </View>
      ) : null}

      {visibleAgencies.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Órgãos públicos</Text>
          {visibleAgencies.map((agency, index) => (
            <ResultRow
              key={`${agency.codigo ?? "agency"}-${index}`}
              title={agency.descricao ?? "Nome não informado pela fonte"}
              detail={`Código SIAFI: ${agency.codigo ?? "não informado"}`}
              source="Portal da Transparência — CGU"
              onPress={() =>
                router.push({
                  pathname: "/cgu/expenses",
                  params: {
                    agencyCode: agency.codigo ?? "",
                    agencyName: agency.descricao ?? "",
                  },
                } as Href)
              }
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

async function searchProposal(term: string): Promise<ProposalResult[]> {
  const byCode = term.match(/^([A-Z]{1,10})\s+(\d{1,10})\/(\d{4})$/i);
  if (byCode) {
    const result = await getProposals({
      page: 1,
      limit: 20,
      type: byCode[1].toUpperCase(),
      year: Number(byCode[3]),
      number: Number(byCode[2]),
    });
    return result.data.map(mapProposal);
  }
  if (/^\d{1,20}$/.test(term)) {
    const result = await getProposal(term);
    return [mapProposal(result.data)];
  }
  return [];
}

function mapProposal(record: OfficialRecord): ProposalResult {
  const id = String(record.id ?? "");
  const type = typeof record.siglaTipo === "string" ? record.siglaTipo : "Proposição";
  const number = record.numero == null ? "" : String(record.numero);
  const year = record.ano == null ? "" : String(record.ano);
  return {
    id,
    title:
      typeof record.ementa === "string"
        ? record.ementa
        : "Ementa não informada pela fonte",
    code: [type, number && `nº ${number}`, year].filter(Boolean).join(" · "),
  };
}

function roleLabel(role: Representative["role"]): string {
  const labels: Record<Representative["role"], string> = {
    PRESIDENT: "Presidente",
    GOVERNOR: "Governador(a)",
    MAYOR: "Prefeito(a)",
    SENATOR: "Senador(a)",
    FEDERAL_DEPUTY: "Deputado federal",
    STATE_DEPUTY: "Deputado estadual",
    CITY_COUNCILLOR: "Vereador(a)",
  };
  return labels[role];
}

function sourceLabel(type: SearchType) {
  if (type === "representatives") return "Agentes";
  if (type === "agencies") return "Órgãos";
  return "Proposições";
}

function ResultRow({
  title,
  detail,
  source,
  onPress,
}: {
  title: string;
  detail: string;
  source: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.result, pressed && styles.pressed]}
    >
      <Text style={styles.resultTitle}>{title}</Text>
      <Text style={styles.resultDetail}>{detail}</Text>
      <Text style={styles.source}>{source} · Abrir ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    color: colors.ink,
  },
  clearButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  clearText: { color: colors.muted, fontSize: 24 },
  searchButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
  searchButtonText: { color: colors.onPrimary, fontWeight: "800" },
  filters: { gap: 8, paddingVertical: 2 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: colors.primary },
  section: { gap: 9 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  result: {
    minHeight: 76,
    padding: 14,
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderColor: colors.line,
    borderWidth: 1,
  },
  pressed: { opacity: 0.82 },
  resultTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  resultDetail: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  source: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  partialError: { color: colors.gold, fontSize: 12, lineHeight: 18 },
});
