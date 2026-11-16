import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import { Screen } from "../components/Screen";
import { AGENCY_GROUPS, type AgencyGroupId } from "../constants/cgu";
import { getCguAgencies, type CguAgency } from "../services/api";
import { colors } from "../theme/colors";

export default function AgenciesScreen() {
  const router = useRouter();
  const [agencyGroup, setAgencyGroup] = useState<AgencyGroupId>("ministries");
  const [agencies, setAgencies] = useState<CguAgency[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [consultedAt, setConsultedAt] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const requestId = useRef(0);

  const loadAgencies = useCallback(async (
    groupId: AgencyGroupId,
    nextPage: number,
    append = false,
  ) => {
    const request = ++requestId.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const group = AGENCY_GROUPS.find((item) => item.id === groupId);
      if (!group) throw new Error("Categoria de órgãos inválida.");
      const result = await getCguAgencies(group.search, nextPage);
      if (request !== requestId.current) return;
      setAgencies((current) => append ? [...current, ...result.data] : result.data);
      setConsultedAt(result.source.consultedAt);
      setPage(result.pagination.page);
      setHasMore(result.data.length >= 15);
    } catch (caught) {
      if (request !== requestId.current) return;
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível carregar o catálogo oficial.",
      );
    } finally {
      if (request === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    setAgencies([]);
    setPage(1);
    setHasMore(false);
    setConsultedAt("");
    void loadAgencies(agencyGroup, 1);
  }, [agencyGroup, loadAgencies]);

  return (
    <Screen>
      <Text style={styles.kicker}>DIRETÓRIO OFICIAL · CGU</Text>
      <Text style={styles.title}>Órgãos públicos</Text>
      <Text style={styles.subtitle}>
        Escolha uma categoria e toque em um órgão para consultar as despesas
        anuais publicadas pela CGU.
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

      {loading && agencies.length === 0 ? (
        <LoadingState label="Carregando órgãos oficiais..." />
      ) : null}
      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => void loadAgencies(agencyGroup, page || 1, page > 1)}
        />
      ) : null}
      {!loading && !error && agencies.length === 0 ? (
        <EmptyState
          title="Órgãos não encontrados"
          body="A CGU não retornou órgãos para esta categoria."
        />
      ) : null}
      {agencies.map((agency, index) => (
        <Pressable
          key={`${agency.codigo ?? "agency"}-${index}`}
          accessibilityRole="button"
          accessibilityLabel={
            agency.codigo
              ? `Ver despesas de ${agency.descricao ?? "órgão"}`
              : `${agency.descricao ?? "Órgão"} sem código SIAFI`
          }
          accessibilityState={{ disabled: !agency.codigo }}
          disabled={!agency.codigo}
          onPress={() => {
            if (!agency.codigo) return;
            router.push({
              pathname: "/cgu/expenses",
              params: {
                agencyCode: agency.codigo,
                agencyName: agency.descricao ?? "",
                category: agencyGroup,
              },
            } as Href);
          }}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.pressed,
            !agency.codigo && styles.disabledCard,
          ]}
        >
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>
              {agency.descricao ?? "Nome não informado pela fonte"}
            </Text>
            <Text style={styles.cardMeta}>
              {agency.codigo
                ? `Código SIAFI: ${agency.codigo} · ver despesas`
                : "Sem código SIAFI; despesas indisponíveis"}
            </Text>
          </View>
          {agency.codigo ? (
            <Text style={styles.arrow} accessible={false}>›</Text>
          ) : null}
        </Pressable>
      ))}
      {loading && agencies.length > 0 ? (
        <LoadingState label="Carregando mais órgãos oficiais..." />
      ) : null}
      {hasMore && agencies.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          disabled={loadingMore}
          onPress={() => void loadAgencies(agencyGroup, page + 1, true)}
          style={[styles.moreButton, loadingMore && styles.disabled]}
        >
          <Text style={styles.moreButtonText}>
            {loadingMore ? "Carregando..." : "Carregar mais órgãos"}
          </Text>
        </Pressable>
      ) : null}
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
  card: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.82 },
  disabledCard: { opacity: 0.65 },
  cardCopy: { flex: 1, gap: 5 },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  cardMeta: { color: colors.muted, fontSize: 12 },
  arrow: { color: colors.primary, fontSize: 24 },
  moreButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  moreButtonText: { color: colors.onPrimary, fontWeight: "800" },
  source: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
});
