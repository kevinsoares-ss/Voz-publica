import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "../../components/Feedback";
import { RepresentativeCard } from "../../components/RepresentativeCard";
import { Screen } from "../../components/Screen";
import { getFavoriteIds, setFavorite } from "../../services/favorites";
import { getRepresentatives, type Representative } from "../../services/api";
import { colors } from "../../theme/colors";

const PAGE_SIZE = 20;
const ROLE_FILTERS: Array<{
  value: Representative["role"] | "";
  label: string;
}> = [
  { value: "", label: "Todos os cargos" },
  { value: "PRESIDENT", label: "Presidente" },
  { value: "GOVERNOR", label: "Governador(a)" },
  { value: "MAYOR", label: "Prefeito(a)" },
  { value: "SENATOR", label: "Senador(a)" },
  { value: "FEDERAL_DEPUTY", label: "Deputado federal" },
  { value: "STATE_DEPUTY", label: "Deputado estadual" },
  { value: "CITY_COUNCILLOR", label: "Vereador(a)" },
];

export default function RepresentativesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string; role?: string }>();
  const initialSearch = Array.isArray(params.search) ? params.search[0] : params.search;
  const initialRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const validInitialRole =
    ROLE_FILTERS.find((option) => option.value === initialRole)?.value ?? "";
  const [query, setQuery] = useState("");
  const [party, setParty] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<Representative["role"] | "">("");
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const loadPage = useCallback(async (nextPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const [result, ids] = await Promise.all([
        getRepresentatives({
          page: nextPage,
          limit: PAGE_SIZE,
          search: query,
          party,
          state,
          city,
          role: role || undefined,
        }),
        getFavoriteIds(),
      ]);
      setRepresentatives((current) =>
        append ? [...current, ...result.data] : result.data,
      );
      setFavoriteIds(ids);
      setPage(result.pagination.page);
      setTotal(result.pagination.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha inesperada.");
      if (!append) setRepresentatives([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [city, party, query, role, state]);

  useEffect(() => {
    const timer = setTimeout(() => void loadPage(1, false), 300);
    return () => clearTimeout(timer);
  }, [loadPage, refresh]);

  useEffect(() => {
    setQuery(initialSearch ?? "");
    setRole(validInitialRole);
  }, [initialSearch, validInitialRole]);

  useFocusEffect(
    useCallback(() => {
      void getFavoriteIds().then(setFavoriteIds).catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Não foi possível ler favoritos.");
      });
    }, []),
  );

  async function toggleFavorite(id: string) {
    try {
      setFavoriteIds(await setFavorite(id, !favoriteIds.includes(id)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar favorito.");
    }
  }

  return (
    <Screen>
      <Text style={styles.kicker}>TRANSPARÊNCIA POLÍTICA</Text>
      <Text style={styles.title}>Agentes públicos</Text>
      <Text style={styles.subtitle}>
        Busque representantes por nome, cargo, partido, estado e município.
      </Text>
      <Notice
        title="Origem dos dados eleitorais"
        body="Presidente, governador, prefeito, deputado estadual e vereador são importados dos resultados oficiais do TSE. O resultado eleitoral não confirma substituições posteriores no mandato; o ano e a fonte aparecem em cada registro."
      />
      <Text style={styles.fieldLabel}>Buscar por nome</Text>
      <TextInput
        accessibilityLabel="Buscar por nome do agente público"
        placeholder="Buscar por nome"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        returnKeyType="search"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roleFilters}
        accessibilityLabel="Filtrar por cargo"
      >
        {ROLE_FILTERS.map((option) => (
          <Pressable
            key={option.value || "all"}
            accessibilityRole="button"
            accessibilityState={{ selected: role === option.value }}
            onPress={() => setRole(option.value)}
            style={[styles.roleChip, role === option.value && styles.roleChipSelected]}
          >
            <Text style={[styles.roleChipText, role === option.value && styles.roleChipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.fieldLabel}>Outros filtros</Text>
      <View style={styles.filters}>
        <TextInput
          accessibilityLabel="Filtrar por partido"
          placeholder="Partido"
          placeholderTextColor={colors.muted}
          value={party}
          onChangeText={setParty}
          autoCapitalize="characters"
          style={[styles.search, styles.filterInput]}
        />
        <TextInput
          accessibilityLabel="Filtrar por estado"
          placeholder="UF"
          placeholderTextColor={colors.muted}
          value={state}
          onChangeText={(value) => setState(value.slice(0, 2).toUpperCase())}
          autoCapitalize="characters"
          maxLength={2}
          style={[styles.search, styles.ufInput]}
        />
      </View>
      <TextInput
        accessibilityLabel="Filtrar por município"
        placeholder="Município"
        placeholderTextColor={colors.muted}
        value={city}
        onChangeText={setCity}
        style={styles.search}
      />
      {query || party || state || city || role ? (
        <View style={styles.activeFilters}>
          <Text style={styles.activeLabel}>Filtros ativos</Text>
          <View style={styles.activeChip}>
            <Text style={styles.activeChipText}>
              {[role && ROLE_FILTERS.find((option) => option.value === role)?.label,
                query && `Nome: ${query}`,
                party && `Partido: ${party}`,
                state && `UF: ${state}`,
                city && `Município: ${city}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar todos os filtros"
              onPress={() => {
                setQuery("");
                setParty("");
                setState("");
                setCity("");
                setRole("");
              }}
              hitSlop={8}
            >
              <Text style={styles.activeClear}>×</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <View style={styles.clearFiltersRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar filtros"
          onPress={() => {
            setQuery("");
            setParty("");
            setState("");
            setCity("");
            setRole("");
          }}
          style={styles.clearButton}
        >
          <Text style={styles.clearText}>Limpar filtros</Text>
        </Pressable>
      </View>
      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>{loading ? "Consultando..." : `${total} registros`}</Text>
        <Pressable onPress={() => setRefresh((value) => value + 1)}>
          <Text style={styles.refresh}>Atualizar</Text>
        </Pressable>
      </View>

      {loading ? <LoadingState label="Carregando agentes públicos..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={() => setRefresh((value) => value + 1)} />
      ) : null}
      {!loading && !error && representatives.length === 0 ? (
        <EmptyState
          title="Dados não encontrados"
          body="As fontes integradas não retornaram registros para estes filtros. Confira o nome, partido ou UF e tente novamente."
          actionLabel="Limpar filtros"
          onAction={() => {
            setQuery("");
            setParty("");
            setState("");
            setCity("");
            setRole("");
          }}
        />
      ) : null}
      {!error
        ? representatives.map((representative) => (
            <RepresentativeCard
              key={representative.id}
              representative={representative}
              favorite={favoriteIds.includes(representative.id)}
              onPress={() =>
                router.push({
                  pathname: "/representatives/[id]",
                  params: { id: representative.id },
                } as Href)
              }
              onToggleFavorite={() => void toggleFavorite(representative.id)}
            />
          ))
        : null}
      {representatives.length < total && !loading && !error ? (
        <Pressable
          disabled={loadingMore}
          onPress={() => void loadPage(page + 1, true)}
          style={styles.moreButton}
        >
          <Text style={styles.moreText}>{loadingMore ? "Carregando..." : "Carregar mais registros"}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.footnote}>A cobertura de cargos e períodos depende das fontes oficiais integradas.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 30, fontWeight: "800", marginTop: -8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -9 },
  fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: "700", marginBottom: -9 },
  search: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 14, color: colors.ink, fontSize: 14 },
  filters: { flexDirection: "row", gap: 8, alignItems: "center" },
  clearFiltersRow: { alignItems: "flex-end" },
  roleFilters: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  roleChip: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  roleChipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  roleChipText: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  roleChipTextSelected: { color: colors.white },
  filterInput: { flex: 1 },
  ufInput: { width: 62, textAlign: "center" },
  clearButton: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  clearText: { color: colors.green, fontWeight: "700", fontSize: 12 },
  activeFilters: { gap: 6 },
  activeLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  activeChip: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 11,
    borderRadius: 12,
  },
  activeChipText: { flex: 1, color: colors.primary, fontSize: 11, fontWeight: "700" },
  activeClear: { color: colors.primary, fontSize: 21, fontWeight: "700", paddingHorizontal: 5 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultCount: { color: colors.muted, fontSize: 12 },
  refresh: { color: colors.forest, fontSize: 12, fontWeight: "700" },
  moreButton: { backgroundColor: colors.forest, borderRadius: 13, alignItems: "center", padding: 14 },
  moreText: { color: colors.onPrimary, fontWeight: "700" },
  footnote: { color: colors.muted, fontSize: 11, textAlign: "center", lineHeight: 17 },
});
