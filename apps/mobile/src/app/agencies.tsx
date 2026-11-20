import { useCallback, useEffect, useRef, useState } from "react";
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
} from "../components/Feedback";
import { CguExpenseCard } from "../components/CguExpenseCard";
import { Screen } from "../components/Screen";
import { AGENCY_GROUPS, type AgencyGroupId } from "../constants/cgu";
import {
  getCguAgencyDirectoryPage,
  getCguAgencyExpensesWithFallback,
  replaceCguAgencyInList,
  type CguAgency,
  type CguAgencyExpenseLookup,
} from "../services/api";
import { colors } from "../theme/colors";

type ExpenseResult = CguAgencyExpenseLookup["result"];

export default function AgenciesScreen() {
  const [agencyGroup, setAgencyGroup] = useState<AgencyGroupId>("ministries");
  const [agencies, setAgencies] = useState<CguAgency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [loadingMoreAgencies, setLoadingMoreAgencies] = useState(false);
  const [agencyError, setAgencyError] = useState("");
  const [agencyPage, setAgencyPage] = useState(1);
  const [hasMoreAgencies, setHasMoreAgencies] = useState(false);
  const [consultedAt, setConsultedAt] = useState("");

  const [selectedAgency, setSelectedAgency] = useState<CguAgency | null>(null);
  const [yearText, setYearText] = useState(String(new Date().getFullYear()));
  const [year, setYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState<ExpenseResult["data"]>([]);
  const [expenseSource, setExpenseSource] =
    useState<ExpenseResult["source"] | null>(null);
  const [expensePage, setExpensePage] = useState(1);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingMoreExpenses, setLoadingMoreExpenses] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [agencyCodeNotice, setAgencyCodeNotice] = useState("");
  const [expandedExpense, setExpandedExpense] = useState<number | null>(null);

  const agencyRequestId = useRef(0);
  const expenseRequestId = useRef(0);

  const loadAgencies = useCallback(async (
    groupId: AgencyGroupId,
    nextPage: number,
    append = false,
  ) => {
    const request = ++agencyRequestId.current;
    if (append) setLoadingMoreAgencies(true);
    else setLoadingAgencies(true);
    setAgencyError("");
    try {
      const group = AGENCY_GROUPS.find((item) => item.id === groupId);
      if (!group) throw new Error("Categoria de órgãos inválida.");
      const result = await getCguAgencyDirectoryPage(group.search, nextPage);
      if (request !== agencyRequestId.current) return;
      setAgencies((current) =>
        append ? [...current, ...result.data] : result.data,
      );
      setConsultedAt(result.source.consultedAt);
      setAgencyPage(result.pagination.page);
      setHasMoreAgencies(result.hasMore);
    } catch (caught) {
      if (request !== agencyRequestId.current) return;
      setAgencyError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível carregar o catálogo oficial.",
      );
    } finally {
      if (request === agencyRequestId.current) {
        setLoadingAgencies(false);
        setLoadingMoreAgencies(false);
      }
    }
  }, []);

  const loadExpenses = useCallback(async (
    agency: CguAgency,
    nextYear: number,
    nextPage = 1,
  ) => {
    const request = ++expenseRequestId.current;
    if (
      !Number.isInteger(nextYear) ||
      nextYear < 2000 ||
      nextYear > new Date().getFullYear()
    ) {
      setExpenseError(
        `Informe um ano válido entre 2000 e ${new Date().getFullYear()}.`,
      );
      setExpenses([]);
      setExpenseSource(null);
      setHasMoreExpenses(false);
      setLoadingExpenses(false);
      setLoadingMoreExpenses(false);
      return;
    }
    if (!agency.codigo) {
      setExpenseError("Este órgão não possui código SIAFI para consultar despesas.");
      setLoadingExpenses(false);
      setLoadingMoreExpenses(false);
      return;
    }

    if (nextPage === 1) {
      setExpenses([]);
      setExpenseSource(null);
      setHasMoreExpenses(false);
      setLoadingExpenses(true);
      setAgencyCodeNotice("");
    } else {
      setLoadingMoreExpenses(true);
    }
    setExpenseError("");
    try {
      const lookup = await getCguAgencyExpensesWithFallback({
        agency,
        year: nextYear,
        page: nextPage,
        shouldContinue: () => request === expenseRequestId.current,
      });
      if (!lookup || request !== expenseRequestId.current) return;
      const result = lookup.result;
      const fallbackFromCode = lookup.fallbackFromCode;
      if (fallbackFromCode && lookup.agency.codigo) {
        setSelectedAgency(lookup.agency);
        setAgencies((current) =>
          replaceCguAgencyInList(
            current,
            fallbackFromCode,
            lookup.agency,
          ),
        );
        setAgencyCodeNotice(
          `O código ${fallbackFromCode} não retornou dados; encontramos despesas no código SIAFI ${lookup.agency.codigo}.`,
        );
      } else if (lookup.hasAlternativeCodes) {
        setAgencyCodeNotice(
          `O código ${agency.codigo} e outros códigos do catálogo para este órgão não retornaram despesas neste ano.`,
        );
      }

      if (nextPage === 1) {
        setExpenses(result.data);
        setHasMoreExpenses(result.data.length > 0);
        setExpandedExpense(null);
      } else if (result.data.length === 0) {
        setHasMoreExpenses(false);
      } else {
        setExpenses((current) => [...current, ...result.data]);
      }
      setExpenseSource(result.source);
      setExpensePage(result.pagination.page);
      setYear(nextYear);
    } catch (caught) {
      if (request !== expenseRequestId.current) return;
      setExpenseError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível consultar as despesas deste órgão.",
      );
    } finally {
      if (request === expenseRequestId.current) {
        setLoadingExpenses(false);
        setLoadingMoreExpenses(false);
      }
    }
  }, []);

  useEffect(() => {
    agencyRequestId.current += 1;
    expenseRequestId.current += 1;
    setAgencies([]);
    setAgencyPage(1);
    setHasMoreAgencies(false);
    setConsultedAt("");
    setLoadingAgencies(false);
    setLoadingMoreAgencies(false);
    setSelectedAgency(null);
    setExpenses([]);
    setExpenseSource(null);
    setExpenseError("");
    setAgencyCodeNotice("");
    setLoadingExpenses(false);
    setLoadingMoreExpenses(false);
    const defaultYear = new Date().getFullYear();
    setYearText(String(defaultYear));
    setYear(defaultYear);
    const group = AGENCY_GROUPS.find((item) => item.id === agencyGroup);
    if (!group) return;
    void loadAgencies(agencyGroup, 1);
  }, [agencyGroup, loadAgencies]);

  function chooseAgency(agency: CguAgency) {
    if (!agency.codigo) return;
    if (selectedAgency?.codigo === agency.codigo) {
      expenseRequestId.current += 1;
      setSelectedAgency(null);
      setExpenses([]);
      setExpenseSource(null);
      setExpenseError("");
      setAgencyCodeNotice("");
      setLoadingExpenses(false);
      setLoadingMoreExpenses(false);
      return;
    }

    setSelectedAgency(agency);
    setExpenses([]);
    setExpenseSource(null);
    setExpenseError("");
    setAgencyCodeNotice("");
    setHasMoreExpenses(false);
    setExpensePage(1);
    setExpandedExpense(null);
    setYearText(String(new Date().getFullYear()));
    void loadExpenses(agency, new Date().getFullYear());
  }

  return (
    <Screen>
      <Text style={styles.kicker}>DIRETÓRIO OFICIAL · CGU</Text>
      <Text style={styles.title}>Órgãos públicos</Text>
      <Text style={styles.subtitle}>
        Escolha uma categoria e toque em um órgão para ver suas despesas
        anuais sem sair desta lista.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        accessibilityLabel="Categorias de órgãos"
      >
        {AGENCY_GROUPS.map((group) => (
          <Pressable
            key={group.id}
            accessibilityRole="button"
            accessibilityState={{ selected: agencyGroup === group.id }}
            onPress={() => setAgencyGroup(group.id)}
            style={[
              styles.category,
              agencyGroup === group.id && styles.categorySelected,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                agencyGroup === group.id && styles.categoryTextSelected,
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
          onRetry={() => void loadAgencies(agencyGroup, agencyPage, agencyPage > 1)}
        />
      ) : null}
      {!loadingAgencies && !agencyError && agencies.length === 0 && !hasMoreAgencies ? (
        <EmptyState
          title="Órgãos não encontrados"
          body="A CGU não retornou órgãos para esta categoria."
        />
      ) : null}

      {agencies.map((agency, index) => {
        const isSelected = selectedAgency?.codigo === agency.codigo;
        const canConsult = Boolean(agency.codigo);
        return (
          <View
            key={`${agency.codigo ?? "agency"}-${index}`}
            style={[styles.agencyCard, isSelected && styles.selectedAgencyCard]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                canConsult
                  ? `Ver despesas de ${agency.descricao ?? "órgão"}`
                  : `${agency.descricao ?? "Órgão"} sem código SIAFI`
              }
              accessibilityState={{
                selected: isSelected,
                disabled: !canConsult,
                expanded: isSelected,
              }}
              disabled={!canConsult}
              onPress={() => chooseAgency(agency)}
              style={({ pressed }) => [
                styles.agencyButton,
                pressed && styles.pressed,
                !canConsult && styles.disabledCard,
              ]}
            >
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>
                  {agency.descricao ?? "Nome não informado pela fonte"}
                </Text>
                <Text style={styles.cardMeta}>
                  {canConsult
                    ? `Código SIAFI: ${agency.codigo} · ${isSelected ? "ocultar despesas" : "ver despesas"}`
                    : "Sem código SIAFI; despesas indisponíveis"}
                </Text>
              </View>
              {canConsult ? (
                <Text style={styles.arrow} accessible={false}>
                  {isSelected ? "⌃" : "›"}
                </Text>
              ) : null}
            </Pressable>

            {isSelected ? (
              <View style={styles.expensePanel}>
                <Text style={styles.expenseTitle}>
                  Despesas de {agency.descricao ?? "órgão selecionado"}
                </Text>
                <Text style={styles.expenseHint}>
                  Dados anuais da CGU. Cada consulta usa o código SIAFI deste órgão.
                </Text>
                <View style={styles.yearRow}>
                  <TextInput
                    accessibilityLabel={`Ano das despesas de ${agency.descricao ?? "órgão"}`}
                    value={yearText}
                    onChangeText={setYearText}
                    onSubmitEditing={() =>
                      void loadExpenses(agency, Number(yearText))
                    }
                    keyboardType="number-pad"
                    returnKeyType="search"
                    maxLength={4}
                    style={styles.yearInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={loadingExpenses}
                    onPress={() => void loadExpenses(agency, Number(yearText))}
                    style={[styles.yearButton, loadingExpenses && styles.disabledCard]}
                  >
                    <Text style={styles.yearButtonText}>
                      {loadingExpenses ? "Consultando..." : `Consultar ${yearText}`}
                    </Text>
                  </Pressable>
                </View>
                {agencyCodeNotice ? (
                  <Text style={styles.expenseHint}>{agencyCodeNotice}</Text>
                ) : null}

                {loadingExpenses && expenses.length === 0 ? (
                  <LoadingState label="Consultando despesas na CGU..." />
                ) : null}
                {!loadingExpenses && expenseError ? (
                  <ErrorState
                    message={expenseError}
                    onRetry={() => void loadExpenses(agency, Number(yearText))}
                  />
                ) : null}
                {!loadingExpenses && !expenseError && expenseSource && expenses.length === 0 ? (
                  <EmptyState
                    title="Dados não encontrados"
                    body={`A CGU não retornou despesas para ${agency.descricao ?? "este órgão"} (código SIAFI ${agency.codigo}) no ano ${year}. Tente outro ano ou órgão; esta consulta vazia não significa que as despesas sejam zero.`}
                  />
                ) : null}
                {expenses.map((expense, expenseIndex) => (
                  <CguExpenseCard
                    key={`${agency.codigo}-${expense.ano ?? year}-${expenseIndex}`}
                    expense={expense}
                    expanded={expandedExpense === expenseIndex}
                    onToggle={() =>
                      setExpandedExpense((current) =>
                        current === expenseIndex ? null : expenseIndex,
                      )
                    }
                  />
                ))}
                {loadingMoreExpenses ? (
                  <LoadingState label="Carregando mais despesas..." />
                ) : null}
                {hasMoreExpenses && expenses.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={loadingMoreExpenses}
                    onPress={() =>
                      void loadExpenses(agency, year, expensePage + 1)
                    }
                    style={[
                      styles.moreButton,
                      loadingMoreExpenses && styles.disabledCard,
                    ]}
                  >
                    <Text style={styles.moreButtonText}>
                      {loadingMoreExpenses ? "Carregando..." : "Carregar mais despesas"}
                    </Text>
                  </Pressable>
                ) : null}
                {expenseSource ? (
                  <>
                    <Text style={styles.source}>
                      Fonte: {expenseSource.name} · consultada em{" "}
                      {formatDate(expenseSource.consultedAt)}
                    </Text>
                    <Pressable
                      accessibilityRole="link"
                      onPress={() =>
                        void Linking.openURL(expenseSource.url).catch(() =>
                          setExpenseError(
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

      {loadingAgencies && agencies.length > 0 ? (
        <LoadingState label="Carregando mais órgãos oficiais..." />
      ) : null}
      {hasMoreAgencies && (agencies.length > 0 || !loadingAgencies) ? (
        <Pressable
          accessibilityRole="button"
          disabled={loadingMoreAgencies}
          onPress={() =>
            void loadAgencies(agencyGroup, agencyPage + 1, true)
          }
          style={[styles.moreButton, loadingMoreAgencies && styles.disabledCard]}
        >
          <Text style={styles.moreButtonText}>
            {loadingMoreAgencies ? "Carregando..." : "Carregar mais órgãos"}
          </Text>
        </Pressable>
      ) : null}
      {consultedAt ? (
        <Text style={styles.source}>
          Catálogo SIAFI · consultado em {formatDate(consultedAt)}
        </Text>
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
  kicker: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  categories: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  category: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  categorySelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  categoryTextSelected: { color: colors.primary, fontWeight: "800" },
  agencyCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  selectedAgencyCard: { borderColor: colors.primary },
  agencyButton: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  pressed: { opacity: 0.82 },
  disabledCard: { opacity: 0.6 },
  cardCopy: { flex: 1, gap: 5 },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  cardMeta: { color: colors.muted, fontSize: 12 },
  arrow: { color: colors.primary, fontSize: 24 },
  expensePanel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    padding: 14,
    gap: 10,
  },
  expenseTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  expenseHint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  yearRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  yearInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  yearButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  yearButtonText: { color: colors.onPrimary, fontSize: 12, fontWeight: "800" },
  moreButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
  },
  moreButtonText: { color: colors.onPrimary, fontWeight: "800" },
  source: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
  sourceButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  sourceButtonText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
});
