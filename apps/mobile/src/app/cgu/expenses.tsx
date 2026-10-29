import { useCallback, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

export default function CguExpensesScreen() {
  const [yearText, setYearText] = useState(String(new Date().getFullYear()));
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [agencySearch, setAgencySearch] = useState("");
  const [agencies, setAgencies] = useState<CguAgency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<CguAgency | null>(null);
  const [searchingAgencies, setSearchingAgencies] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError("Pesquise e selecione um órgão oficial antes da consulta.");
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

  async function searchAgencies() {
    const search = agencySearch.trim();
    if (search.length < 2) {
      setError("Digite pelo menos 2 caracteres para pesquisar órgãos.");
      return;
    }
    setSearchingAgencies(true);
    setError("");
    setSelectedAgency(null);
    setResult(null);
    setHasMore(true);
    try {
      const response = await getCguAgencies(search);
      setAgencies(response.data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível pesquisar órgãos na CGU.",
      );
    } finally {
      setSearchingAgencies(false);
    }
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
      <Text style={styles.label}>Pesquise o órgão no cadastro oficial SIAFI</Text>
      <TextInput
        value={agencySearch}
        onChangeText={setAgencySearch}
        maxLength={100}
        style={styles.input}
        accessibilityLabel="Nome do órgão para pesquisar na CGU"
        placeholder="Ex.: Ministério da Saúde"
        placeholderTextColor={colors.muted}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => void searchAgencies()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {searchingAgencies ? "Pesquisando..." : "Pesquisar órgãos oficiais"}
        </Text>
      </Pressable>
      {agencies.map((agency, index) => (
        <Pressable
          key={`${agency.codigo ?? "orgao"}-${index}`}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedAgency?.codigo === agency.codigo }}
          onPress={() => {
            setSelectedAgency(agency);
            setResult(null);
            setHasMore(true);
            setError("");
          }}
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
      {agencies.length === 0 && !searchingAgencies && agencySearch.length >= 2 ? (
        <Text style={styles.meta}>
          Pesquise para exibir órgãos retornados pelo cadastro oficial da CGU.
        </Text>
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
      ) : (
        <EmptyState
          title="Selecione um órgão oficial"
          body="As despesas anuais por órgão exigem um código SIAFI retornado pelo cadastro oficial. Nenhum código é presumido."
        />
      )}
      {loading ? <LoadingState label="Consultando a fonte oficial da CGU..." /> : null}
      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => void load(year, page)}
        />
      ) : null}
      {!loading && !error && result?.data.length === 0 ? (
        <EmptyState
          title="Nenhuma despesa retornada"
          body={`A CGU não retornou registros para a página consultada de ${year}. Isso descreve somente esta consulta; não significa que as despesas do período sejam zero.`}
        />
      ) : null}
      {!loading && !error && result ? (
        <>
          {result.data.map((expense, index) => (
            <ExpenseCard
              key={`${expense.codigoOrgao ?? "orgao"}-${index}`}
              expense={expense}
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

function ExpenseCard({ expense }: { expense: CguAnnualExpense }) {
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

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: -8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: -8 },
  input: {
    backgroundColor: colors.white,
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
  buttonText: { color: colors.white, fontWeight: "800" },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    gap: 8,
  },
  agencyName: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  agencyOption: {
    backgroundColor: colors.white,
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
