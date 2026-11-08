import { useCallback, useEffect, useState } from "react";
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
import { Screen } from "../../components/Screen";
import {
  getCguAgencies,
  getCguAnnualExpenses,
  type CguAgency,
  type CguAnnualExpense,
} from "../../services/api";
import { colors } from "../../theme/colors";

type Result = Awaited<ReturnType<typeof getCguAnnualExpenses>>;
const AGENCY_GROUPS = [
  { id: "ministries", label: "Ministérios", search: "Ministério" },
  { id: "agencies", label: "Agências", search: "Agência" },
  { id: "universities", label: "Universidades", search: "Universidade" },
  { id: "institutes", label: "Institutos", search: "Instituto" },
  { id: "foundations", label: "Fundações", search: "Fundação" },
] as const;
type AgencyGroupId = (typeof AGENCY_GROUPS)[number]["id"];

export default function CguExpensesScreen() {
  const params = useLocalSearchParams<{
    agencyCode?: string;
    agencyName?: string;
  }>();
  const agencyCode = Array.isArray(params.agencyCode)
    ? params.agencyCode[0]
    : params.agencyCode;
  const agencyName = Array.isArray(params.agencyName)
    ? params.agencyName[0]
    : params.agencyName;
  const [yearText, setYearText] = useState(String(new Date().getFullYear()));
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [agencyGroup, setAgencyGroup] = useState<AgencyGroupId>("ministries");
  const [agencyPage, setAgencyPage] = useState(1);
  const [agencies, setAgencies] = useState<CguAgency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<CguAgency | null>(
    agencyCode
      ? { codigo: agencyCode, descricao: agencyName ?? null }
      : null,
  );
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [hasMoreAgencies, setHasMoreAgencies] = useState(true);
  const [agencyError, setAgencyError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedExpense, setExpandedExpense] = useState<number | null>(null);

  useEffect(() => {
    if (!agencyCode) return;
    setSelectedAgency({ codigo: agencyCode, descricao: agencyName ?? null });
    setResult(null);
    setError("");
    setHasMore(true);
  }, [agencyCode, agencyName]);

  async function loadAgencyPage(
    groupId: AgencyGroupId,
    nextPage: number,
    append = false,
  ) {
    setLoadingAgencies(true);
    setAgencyError("");
    try {
      const group = AGENCY_GROUPS.find((item) => item.id === groupId);
      if (!group) throw new Error("Categoria de órgãos inválida.");
      const response = await getCguAgencies(group.search, nextPage);
      setAgencies((current) =>
        append ? [...current, ...response.data] : response.data,
      );
      setAgencyPage(nextPage);
      setHasMoreAgencies(response.data.length >= 15);
    } catch (caught) {
      setAgencyError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível carregar o catálogo oficial da CGU.",
      );
    } finally {
      setLoadingAgencies(false);
    }
  }

  useEffect(() => {
    void loadAgencyPage("ministries", 1);
  }, []);

  const load = useCallback(async (nextYear: number, nextPage = 1) => {
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
    if (!selectedAgency?.codigo) {
      setError("Escolha um órgão da lista oficial antes da consulta.");
      return;
    }

    if (nextPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const response = await getCguAnnualExpenses({
        year: nextYear,
        page: nextPage,
        agencyCode: selectedAgency.codigo,
      });
      if (nextPage === 1 || !result) {
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
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível consultar a CGU.",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [result, selectedAgency]);

  function chooseAgencyGroup(groupId: AgencyGroupId) {
    setAgencyGroup(groupId);
    setSelectedAgency(null);
    setResult(null);
    setError("");
    setAgencies([]);
    setAgencyPage(1);
    setHasMoreAgencies(true);
    void loadAgencyPage(groupId, 1);
  }

  function chooseAgency(agency: CguAgency) {
    setSelectedAgency(agency);
    setResult(null);
    setHasMore(true);
    setError("");
  }

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
      keyboardType="number-pad"
      maxLength={4}
      style={styles.input}
      accessibilityLabel="Ano das despesas da CGU"
    />
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
      {agencies.map((agency, index) => (
        <Pressable
          key={`${agency.codigo ?? "orgao"}-${index}`}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedAgency?.codigo === agency.codigo }}
          onPress={() => chooseAgency(agency)}
          style={[
            styles.agencyOption,
            selectedAgency?.codigo === agency.codigo ? styles.selectedAgency : null,
          ]}
        >
          <Text style={styles.agencyOptionName}>
            {agency.descricao ?? "Nome não informado pela fonte"}
          </Text>
          <Text style={styles.meta}>
            Código SIAFI: {agency.codigo ?? "Não informado pela fonte"}
          </Text>
        </Pressable>
      ))}
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
      {selectedAgency ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void load(Number(yearText), 1)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Consultar despesas de {selectedAgency.descricao ?? "órgão selecionado"}
          </Text>
        </Pressable>
      ) : null}
      {!selectedAgency && !loadingAgencies && !agencyError ? (
        <EmptyState
          title="Selecione um órgão oficial"
          body="As despesas anuais por órgão exigem um código SIAFI retornado pela lista oficial. Nenhum código é presumido."
        />
      ) : null}
      {loading ? <LoadingState label="Consultando a fonte oficial da CGU..." /> : null}
      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            if (selectedAgency) void load(year, page);
            else void loadAgencyPage(agencyGroup, agencyPage, agencyPage > 1);
          }}
        />
      ) : null}
      {!loading && !error && result?.data.length === 0 ? (
        <EmptyState
          title="Dados não encontrados"
          body={`A CGU não retornou registros para a página consultada de ${year}. Isso descreve somente esta consulta; não significa que as despesas do período sejam zero.`}
        />
      ) : null}
      {!loading && !error && result ? (
        <>
          {result.data.map((expense, index) => (
            <ExpenseCard
              key={`${expense.codigoOrgao ?? "orgao"}-${index}`}
              expense={expense}
              expanded={expandedExpense === index}
              onToggle={() =>
                setExpandedExpense((current) => current === index ? null : index)
              }
            />
          ))}
          {result.data.length > 0 && hasMore ? (
            <Pressable
              accessibilityRole="button"
              disabled={loadingMore}
              onPress={() => void load(year, page + 1)}
              style={styles.moreButton}
            >
              <Text style={styles.buttonText}>
                {loadingMore ? "Carregando..." : "Carregar próxima página"}
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
                setError("Não foi possível abrir o endereço oficial da CGU."),
              )
            }
            style={styles.sourceButton}
          >
            <Text style={styles.sourceButtonText}>Abrir consulta oficial ↗</Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

function ExpenseCard({
  expense,
  expanded,
  onToggle,
}: {
  expense: CguAnnualExpense;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.agencyName}>
        {expense.orgao ?? "Órgão não informado pela fonte"}
      </Text>
      {expense.orgaoSuperior ? (
        <Text style={styles.meta}>Órgão superior: {expense.orgaoSuperior}</Text>
      ) : null}
      <Text style={styles.meta}>
        Código: {expense.codigoOrgao ?? "Não informado pela fonte"}
      </Text>
      <View style={styles.values}>
        <ValueRow label="Empenhado" value={expense.empenhado} />
        <ValueRow label="Liquidado" value={expense.liquidado} />
        <ValueRow label="Pago" value={expense.pago} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.detailToggle}
      >
        <Text style={styles.detailToggleText}>
          {expanded ? "Ocultar detalhes" : "Ver detalhes do registro"}
        </Text>
      </Pressable>
      {expanded ? (
        <View style={styles.detailList}>
          <Text style={styles.detailTitle}>Dados retornados pela CGU</Text>
          {Object.entries(expense)
            .filter(([key]) =>
              !["ano", "orgao", "codigoOrgao", "orgaoSuperior", "codigoOrgaoSuperior",
                "empenhado", "liquidado", "pago"].includes(key),
            )
            .map(([key, value]) => (
              <ValueRow key={key} label={key} value={formatDetailValue(value)} />
            ))}
          <Text style={styles.meta}>
            Período: {expense.ano ?? "Não informado pela fonte"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ValueRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.valueRow}>
      <Text style={styles.meta}>{label}</Text>
      <Text style={styles.amount}>
        {value ? `R$ ${value}` : "Não informado pela fonte"}
      </Text>
    </View>
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

function formatDetailValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value === null || value === undefined) return "Não informado pela fonte";
  const serialized = JSON.stringify(value) ?? String(value);
  return serialized.length > 240 ? `${serialized.slice(0, 237)}...` : serialized;
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
  buttonText: { color: colors.onPrimary, fontWeight: "800" },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    gap: 8,
  },
  agencyName: { color: colors.ink, fontSize: 15, fontWeight: "800" },
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
  meta: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  values: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginTop: 4, paddingTop: 7 },
  detailToggle: { minHeight: 44, justifyContent: "center" },
  detailToggleText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  detailList: { gap: 7, borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  detailTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  valueRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, paddingVertical: 4 },
  amount: { color: colors.ink, fontSize: 12, fontWeight: "700", flexShrink: 1 },
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
