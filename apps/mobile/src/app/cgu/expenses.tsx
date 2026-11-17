import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "../../components/Feedback";
import { CguExpenseCard } from "../../components/CguExpenseCard";
import { Screen } from "../../components/Screen";
import { AGENCY_GROUPS, type AgencyGroupId } from "../../constants/cgu";
import {
  getCguAgencyAnnualExpenses,
  getCguAgencies,
  type CguAgency,
} from "../../services/api";
import { colors } from "../../theme/colors";

type Result = Awaited<ReturnType<typeof getCguAgencyAnnualExpenses>>;

export default function CguExpensesScreen() {
  const params = useLocalSearchParams<{
    agencyCode?: string;
    agencyName?: string;
    category?: string;
  }>();
  const agencyCode = Array.isArray(params.agencyCode)
    ? params.agencyCode[0]
    : params.agencyCode;
  const agencyName = Array.isArray(params.agencyName)
    ? params.agencyName[0]
    : params.agencyName;
  const category = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const validCategory = AGENCY_GROUPS.find((group) => group.id === category)?.id;
  const [yearText, setYearText] = useState(String(new Date().getFullYear()));
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [agencyGroup, setAgencyGroup] = useState<AgencyGroupId>(
    validCategory ?? "ministries",
  );
  const [agencyPage, setAgencyPage] = useState(1);
  const [agencies, setAgencies] = useState<CguAgency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<CguAgency | null>(null);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [hasMoreAgencies, setHasMoreAgencies] = useState(true);
  const [agencyError, setAgencyError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedExpense, setExpandedExpense] = useState<number | null>(null);
  const expenseRequestId = useRef(0);
  const agencyRequestId = useRef(0);

  const loadAgencyPage = useCallback(async (
    groupId: AgencyGroupId,
    nextPage: number,
    append = false,
  ) => {
    const request = ++agencyRequestId.current;
    setLoadingAgencies(true);
    setAgencyError("");
    try {
      const group = AGENCY_GROUPS.find((item) => item.id === groupId);
      if (!group) throw new Error("Categoria de órgãos inválida.");
      const response = await getCguAgencies(group.search, nextPage);
      if (request !== agencyRequestId.current) return;
      setAgencies((current) =>
        append ? [...current, ...response.data] : response.data,
      );
      setAgencyPage(nextPage);
      setHasMoreAgencies(response.data.length >= 15);
    } catch (caught) {
      if (request !== agencyRequestId.current) return;
      setAgencyError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível carregar o catálogo oficial da CGU.",
      );
    } finally {
      if (request === agencyRequestId.current) setLoadingAgencies(false);
    }
  }, []);

  useEffect(() => {
    void loadAgencyPage(agencyGroup, 1);
  }, [agencyGroup, loadAgencyPage]);

  const load = useCallback(async (
    nextYear: number,
    nextPage: number,
    agency: CguAgency | null,
  ) => {
    const request = ++expenseRequestId.current;
    if (
      !Number.isInteger(nextYear) ||
      nextYear < 2000 ||
      nextYear > new Date().getFullYear()
    ) {
      setError("Informe um ano válido entre 2000 e o ano atual.");
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    if (!agency?.codigo) {
      setError("Escolha um órgão da lista oficial antes da consulta.");
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (nextPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const response = await getCguAgencyAnnualExpenses({
        year: nextYear,
        page: nextPage,
        agencyCode: agency.codigo,
      });
      if (request !== expenseRequestId.current) return;
      if (nextPage === 1) {
        setResult(response);
        setHasMore(response.data.length > 0);
      } else if (response.data.length === 0) {
        setHasMore(false);
      } else {
        setResult((current) =>
          current ? { ...response, data: [...current.data, ...response.data] } : response,
        );
      }
      setYear(nextYear);
      setPage(nextPage);
    } catch (caught) {
      if (request !== expenseRequestId.current) return;
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível consultar a CGU.",
      );
    } finally {
      if (request === expenseRequestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    if (validCategory) setAgencyGroup(validCategory);
  }, [validCategory]);

  useEffect(() => {
    if (!agencyCode) {
      setSelectedAgency(null);
      setResult(null);
      setError("");
      setHasMore(true);
      expenseRequestId.current += 1;
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const agency = { codigo: agencyCode, descricao: agencyName ?? null };
    setSelectedAgency(agency);
    setResult(null);
    setError("");
    setHasMore(true);
    void load(new Date().getFullYear(), 1, agency);
  }, [agencyCode, agencyName, load]);

  function chooseAgencyGroup(groupId: AgencyGroupId) {
    if (groupId === agencyGroup) return;
    agencyRequestId.current += 1;
    expenseRequestId.current += 1;
    setLoading(false);
    setLoadingMore(false);
    setAgencyGroup(groupId);
    setSelectedAgency(null);
    setResult(null);
    setError("");
    setAgencies([]);
    setAgencyPage(1);
    setHasMoreAgencies(true);
    setLoadingAgencies(false);
  }

  function chooseAgency(agency: CguAgency) {
    if (!agency.codigo) return;
    setSelectedAgency(agency);
    setResult(null);
    setHasMore(true);
    setError("");
    setExpandedExpense(null);
    void load(Number(yearText), 1, agency);
  }

  const displayedAgencies =
    selectedAgency?.codigo &&
    !agencies.some((agency) => agency.codigo === selectedAgency.codigo)
      ? [selectedAgency, ...agencies]
      : agencies;

  return (
    <Screen>
    <Text style={styles.kicker}>FONTE OFICIAL · CGU</Text>
    <Text style={styles.title}>Despesas por órgão</Text>
    <Text style={styles.subtitle}>
      Despesas anuais agregadas do Poder Executivo Federal; não são despesas
      pessoais de parlamentares.
    </Text>
    <Notice
      title="Valores conforme a fonte"
      body="Empenhado, liquidado e pago são campos publicados pela CGU. O app não soma, estima ou converte os valores retornados."
    />
    <Text style={styles.label}>Ano</Text>
    <TextInput
      value={yearText}
      onChangeText={setYearText}
      onSubmitEditing={() => {
        if (selectedAgency) void load(Number(yearText), 1, selectedAgency);
      }}
      returnKeyType="search"
      keyboardType="number-pad"
      maxLength={4}
      style={styles.input}
      accessibilityLabel="Ano das despesas da CGU"
    />
    {selectedAgency && Number(yearText) !== year ? (
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() => void load(Number(yearText), 1, selectedAgency)}
        style={[styles.button, loading && styles.disabledButton]}
      >
        <Text style={styles.buttonText}>Atualizar despesas para {yearText}</Text>
      </Pressable>
    ) : null}
    <Text style={styles.sectionTitle}>Órgãos e ministérios</Text>
    <Text style={styles.meta}>
      Escolha uma categoria para listar os órgãos do cadastro oficial SIAFI.
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.agencyGroups}
      accessibilityLabel="Categorias de órgãos"
    >
      {AGENCY_GROUPS.map((group) => (
        <Pressable
          key={group.id}
          accessibilityRole="button"
          accessibilityState={{ selected: agencyGroup === group.id }}
          onPress={() => chooseAgencyGroup(group.id)}
          style={[
            styles.agencyGroup,
            agencyGroup === group.id && styles.agencyGroupSelected,
          ]}
        >
          <Text
            style={[
              styles.agencyGroupText,
              agencyGroup === group.id && styles.agencyGroupTextSelected,
            ]}
          >
            {group.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
    {loadingAgencies && agencies.length === 0 ? (
      <LoadingState label="Carregando órgãos oficiais..." />
    ) : null}
    {!loadingAgencies && agencyError ? (
      <ErrorState
        message={agencyError}
        onRetry={() => void loadAgencyPage(agencyGroup, agencyPage, agencyPage > 1)}
      />
    ) : null}
    {!loadingAgencies && !agencyError && agencies.length === 0 ? (
      <EmptyState
        title="Órgãos não encontrados"
        body="A CGU não retornou órgãos nesta categoria."
      />
    ) : null}
      {displayedAgencies.map((agency, index) => {
        const isSelected = selectedAgency?.codigo === agency.codigo;
        return (
          <View
            key={`${agency.codigo ?? "orgao"}-${index}`}
            style={styles.agencyEntry}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, expanded: isSelected }}
              disabled={!agency.codigo}
              onPress={() => chooseAgency(agency)}
              style={[
                styles.agencyOption,
                isSelected ? styles.selectedAgency : null,
                !agency.codigo && styles.disabledButton,
              ]}
            >
              <Text style={styles.agencyOptionName}>
                {agency.descricao ?? "Nome não informado pela fonte"}
              </Text>
              <Text style={styles.meta}>
                Código SIAFI: {agency.codigo ?? "Não informado pela fonte"}
                {isSelected ? " · despesas abaixo" : " · ver despesas"}
              </Text>
            </Pressable>
            {isSelected ? (
              <View style={styles.resultsPanel}>
                <Text style={styles.resultsTitle}>
                  Despesas de {agency.descricao ?? "órgão selecionado"}
                </Text>
                <Text style={styles.meta}>
                  Inclui despesas diretamente vinculadas e de órgãos subordinados.
                </Text>
                {loading ? (
                  <LoadingState label="Consultando a fonte oficial da CGU..." />
                ) : null}
                {!loading && error ? (
                  <ErrorState
                    message={error}
                    onRetry={() => void load(year, page, selectedAgency)}
                  />
                ) : null}
                {!loading && !error && result?.data.length === 0 ? (
                  <EmptyState
                    title="Dados não encontrados"
                    body={`A CGU não retornou despesas para ${year}. O catálogo também inclui unidades históricas ou em extinção; tente outro órgão ou período.`}
                  />
                ) : null}
                {!loading && !error && result ? (
                  <>
                    {result.data.map((expense, expenseIndex) => (
                      <CguExpenseCard
                        key={`${expense.codigoOrgao ?? "orgao"}-${expenseIndex}`}
                        expense={expense}
                        expanded={expandedExpense === expenseIndex}
                        onToggle={() =>
                          setExpandedExpense((current) =>
                            current === expenseIndex ? null : expenseIndex,
                          )
                        }
                      />
                    ))}
                    {result.data.length > 0 && hasMore ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={loadingMore}
                        onPress={() =>
                          void load(year, page + 1, selectedAgency)
                        }
                        style={styles.moreButton}
                      >
                        <Text style={styles.buttonText}>
                          {loadingMore
                            ? "Carregando..."
                            : "Carregar próxima página"}
                        </Text>
                      </Pressable>
                    ) : null}
                    <Text style={styles.source}>
                      Fonte: {result.source.name} · consultada em{" "}
                      {formatDate(result.source.consultedAt)}
                    </Text>
                    <Pressable
                      accessibilityRole="link"
                      onPress={() =>
                        void Linking.openURL(result.source.url).catch(() =>
                          setError(
                            "Não foi possível abrir o endereço oficial da CGU.",
                          ),
                        )
                      }
                      style={styles.sourceButton}
                    >
                      <Text style={styles.sourceButtonText}>
                        Abrir consulta oficial ↗
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
      {hasMoreAgencies && agencies.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          disabled={loadingAgencies}
          onPress={() => void loadAgencyPage(agencyGroup, agencyPage + 1, true)}
          style={styles.moreButton}
        >
          <Text style={styles.buttonText}>
            {loadingAgencies ? "Carregando..." : "Carregar mais órgãos"}
          </Text>
        </Pressable>
      ) : null}
      {!selectedAgency && !loadingAgencies && !agencyError ? (
        <EmptyState
          title="Selecione um órgão oficial"
          body="As despesas anuais por órgão exigem um código SIAFI retornado pela lista oficial. Nenhum código é presumido."
        />
      ) : null}
    </Screen>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informado pela fonte"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: -8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: -8 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  agencyGroups: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  agencyGroup: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  agencyGroupSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  agencyGroupText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  agencyGroupTextSelected: { color: colors.primary, fontWeight: "800" },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.forest,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: colors.onPrimary, fontWeight: "800" },
  agencyEntry: { gap: 8 },
  agencyOption: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 13,
    padding: 13,
    gap: 5,
  },
  selectedAgency: { borderColor: colors.green, borderWidth: 2 },
  agencyOptionName: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  resultsPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  resultsTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  moreButton: {
    backgroundColor: colors.green,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
  },
  source: { color: colors.muted, fontSize: 11, textAlign: "center" },
  sourceButton: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  sourceButtonText: { color: colors.forest, fontSize: 13, fontWeight: "800" },
});
