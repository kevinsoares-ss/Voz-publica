import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, type Href } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Screen } from "../../components/Screen";
import {
  StatCard,
  SourceBadge,
  DashboardSkeleton,
  InitialLoader,
} from "../../components/ui";
import {
  checkApiHealth,
  getApiAssetUrl,
  getDashboard,
  type DashboardSummary,
} from "../../services/api";
import { colors } from "../../theme/colors";
import {
  formatCompactBRL,
  formatCurrencyBRL,
  formatDateTime,
  parseCurrencyToNumber,
} from "../../utils/format";

type ApiStatus = "loading" | "online" | "offline";

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isMobile = width < 640;

  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("loading");
  const [search, setSearch] = useState("");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [hiddenCards, setHiddenCards] = useState<string[]>([]);
  const [hideCeapsWidget, setHideCeapsWidget] = useState(false);
  const [initialLoadingComplete, setInitialLoadingComplete] = useState(false);

  const isReady = !loading || dashboard !== null;

  useEffect(() => {
    void AsyncStorage.getItem("@voz-publica/hidden-kpi-cards")
      .then((stored) => {
        if (stored) {
          try {
            setHiddenCards(JSON.parse(stored));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const hideCard = useCallback((cardKey: string) => {
    setHiddenCards((current) => {
      const updated = current.includes(cardKey) ? current : [...current, cardKey];
      void AsyncStorage.setItem("@voz-publica/hidden-kpi-cards", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const restoreCards = useCallback(() => {
    setHiddenCards([]);
    void AsyncStorage.removeItem("@voz-publica/hidden-kpi-cards").catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorNotice(null);

    try {
      const [dashboardData] = await Promise.all([
        getDashboard(),
        checkApiHealth()
          .then(() => setApiStatus("online"))
          .catch(() => setApiStatus("offline")),
      ]);

      setDashboard(dashboardData);
      setApiStatus("online");
    } catch (err) {
      setApiStatus("offline");
      setErrorNotice(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os dados em tempo real da API.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function handleSearchSubmit() {
    if (!search.trim()) return;
    router.push({
      pathname: "/search",
      params: { q: search.trim() },
    } as Href);
  }

  function handleFilterClick(filter: { role?: string; path?: string }) {
    if (filter.path) {
      router.push(filter.path as Href);
    } else if (filter.role) {
      router.push({
        pathname: "/(tabs)/representatives",
        params: { role: filter.role },
      } as Href);
    }
  }

  return (
    <View style={styles.rootFill}>
      {!initialLoadingComplete && (
        <InitialLoader
          isReady={isReady}
          onFinish={() => setInitialLoadingComplete(true)}
        />
      )}
      <Screen
        contentContainerStyle={[styles.screenContainer, isMobile && styles.screenContainerMobile]}
        scroll={true}
      >
      {/* Top Brand & App Navigation Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandGlyph}>V</Text>
          </View>
          <View style={styles.brandCopy}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandName}>Voz Pública</Text>
              <View
                style={[
                  styles.statusBadge,
                  apiStatus === "online"
                    ? styles.statusOnline
                    : apiStatus === "offline"
                      ? styles.statusOffline
                      : styles.statusLoading,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    apiStatus === "online"
                      ? styles.dotOnline
                      : apiStatus === "offline"
                        ? styles.dotOffline
                        : styles.dotLoading,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    apiStatus === "online"
                      ? styles.statusTextOnline
                      : apiStatus === "offline"
                        ? styles.statusTextOffline
                        : styles.statusTextLoading,
                  ]}
                >
                  {apiStatus === "online"
                    ? isMobile ? "Online" : "Dados Oficiais Online"
                    : apiStatus === "offline"
                      ? "Offline"
                      : "Verificando..."}
                </Text>
              </View>
            </View>
            <Text style={styles.brandTagline}>
              Painel Cidadão de Transparência Política & Fiscal
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atualizar dados do painel"
            onPress={() => void loadData()}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir mais opções"
            onPress={() => router.push("/(tabs)/more" as Href)}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Text style={styles.moreIcon}>···</Text>
          </Pressable>
        </View>
      </View>

      {/* Hero Banner with Integrated Global Search */}
      <View style={[styles.hero, isMobile && styles.heroMobile]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>TRANSPARÊNCIA GOVERNAMENTAL</Text>
          </View>
          <Text style={[styles.heroHeadline, isMobile && styles.heroHeadlineMobile]}>
            Monitore gastos públicos e a atuação dos seus representantes.
          </Text>
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            Dados oficiais abertos e auditáveis, extraídos diretamente da Câmara dos
            Deputados, Senado Federal e Controladoria-Geral da União (CGU).
          </Text>
        </View>

        {/* Global Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon} accessible={false}>
              ⌕
            </Text>
            <TextInput
              accessibilityLabel="Buscar agentes, despesas, proposições ou órgãos"
              placeholder="Busque por nome de agente, partido, ministério ou proposta..."
              placeholderTextColor="#8C9EBA"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {search ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                onPress={() => setSearch("")}
                hitSlop={8}
                style={styles.clearBtn}
              >
                <Text style={styles.clearIcon}>×</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Executar busca"
              onPress={handleSearchSubmit}
              style={({ pressed }) => [styles.searchSubmitBtn, pressed && styles.pressed]}
            >
              <Text style={styles.searchSubmitText}>Buscar</Text>
            </Pressable>
          </View>

          {/* Quick Filter Chips */}
          <View style={styles.quickChipsRow}>
            <Text style={styles.quickChipsLabel}>Atalhos rápidos:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              <Pressable
                onPress={() => handleFilterClick({ role: "FEDERAL_DEPUTY" })}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Text style={styles.chipIcon}>🏛</Text>
                <Text style={styles.chipText}>Deputados Federais</Text>
              </Pressable>
              <Pressable
                onPress={() => handleFilterClick({ role: "SENATOR" })}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Text style={styles.chipIcon}>⚖</Text>
                <Text style={styles.chipText}>Senadores</Text>
              </Pressable>
              <Pressable
                onPress={() => handleFilterClick({ path: "/cgu/expenses" })}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Text style={styles.chipIcon}>💰</Text>
                <Text style={styles.chipText}>Gastos CGU / SIAFI</Text>
              </Pressable>
              <Pressable
                onPress={() => handleFilterClick({ path: "/agencies" })}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Text style={styles.chipIcon}>🏢</Text>
                <Text style={styles.chipText}>Órgãos Públicos</Text>
              </Pressable>
              <Pressable
                onPress={() => handleFilterClick({ path: "/(tabs)/activity" })}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Text style={styles.chipIcon}>📜</Text>
                <Text style={styles.chipText}>Proposições</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Notice / Warning if API error */}
      {errorNotice ? (
        <View style={styles.errorNoticeBox}>
          <Text style={styles.errorNoticeIcon}>⚠</Text>
          <View style={styles.errorNoticeContent}>
            <Text style={styles.errorNoticeTitle}>Falha ao sincronizar dados em tempo real</Text>
            <Text style={styles.errorNoticeBody}>
              {errorNotice}. O aplicativo continuará navegável com informações locais.
            </Text>
          </View>
          <Pressable
            onPress={() => void loadData()}
            style={styles.errorRetryBtn}
          >
            <Text style={styles.errorRetryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Section Header: Visão Geral / Dashboard KPIs */}
      <View style={styles.sectionTitleRow}>
        <View>
          <Text style={styles.sectionKicker}>DASHBOARD EM TEMPO REAL</Text>
          <Text style={styles.sectionTitle}>Panorama de Transparência</Text>
        </View>
        {dashboard?.generatedAt ? (
          <Text style={styles.syncTimestamp}>
            Sincronizado: {formatDateTime(dashboard.generatedAt)}
          </Text>
        ) : null}
      </View>

      {/* Loading Skeleton or Dashboard KPIs */}
      {loading && !dashboard ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* KPI Stat Cards Grid */}
          <View style={styles.kpiGrid}>
            {!hiddenCards.includes("agents") && (
              <StatCard
                label="Agentes Públicos"
                value={dashboard?.agents.total ?? 594}
                badge="Congresso"
                badgeVariant="primary"
                description="513 Deputados + 81 Senadores"
                icon="◎"
                onPress={() => router.push("/(tabs)/representatives" as Href)}
                onHide={() => hideCard("agents")}
              />
            )}
            {!hiddenCards.includes("ceaps") && (
              <StatCard
                label="Gastos CEAPS"
                value={
                  dashboard?.senateCeaps.year
                    ? `Ano ${dashboard.senateCeaps.year}`
                    : "Senado"
                }
                badge="Cota Parlamentar"
                badgeVariant="gold"
                description="Reembolsos oficiais monitorados"
                icon="R$"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/representatives",
                    params: { role: "SENATOR" },
                  } as Href)
                }
                onHide={() => hideCard("ceaps")}
              />
            )}
            {!hiddenCards.includes("executive") && (
              <StatCard
                label="Executivo Federal"
                value={
                  dashboard?.executive.agencies.length
                    ? `${dashboard.executive.agencies.length} Ministérios`
                    : "CGU / SIAFI"
                }
                badge="Orçamento"
                badgeVariant="teal"
                description="Empenhos e pagamentos anuais"
                icon="🏛"
                onPress={() => router.push("/cgu/expenses" as Href)}
                onHide={() => hideCard("executive")}
              />
            )}
            {!hiddenCards.includes("parties") && (
              <StatCard
                label="Bancadas Partidárias"
                value={
                  dashboard?.agents.topParties.length
                    ? `${dashboard.agents.topParties.length} Principais`
                    : "Partidos"
                }
                badge="Representação"
                badgeVariant="muted"
                description="Distribuição política ativa"
                icon="⚖"
                onPress={() => router.push("/(tabs)/representatives" as Href)}
                onHide={() => hideCard("parties")}
              />
            )}
          </View>

          {/* Banner to Restore Hidden Cards if any */}
          {hiddenCards.length > 0 ? (
            <View style={styles.restoreBar}>
              <Text style={styles.restoreBarText}>
                {hiddenCards.includes("ceaps") && hiddenCards.length === 1
                  ? "Card de Gastos CEAPS ocultado."
                  : `${hiddenCards.length} cards ocultados.`}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restaurar cards ocultos"
                onPress={restoreCards}
                style={({ pressed }) => [styles.restoreBarBtn, pressed && styles.pressed]}
              >
                <Text style={styles.restoreBarBtnText}>Restaurar cards</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Responsive Two-Column or Stacked Widgets */}
          <View style={[styles.widgetsContainer, isDesktop && styles.widgetsContainerDesktop]}>
            {/* Widget 1: Maiores Gastos de CEAPS (Senado Federal) */}
            <View style={[styles.widgetCard, isDesktop && styles.widgetCardHalf, isMobile && styles.widgetCardMobile]}>
              <View style={styles.widgetHeader}>
                <View style={styles.widgetHeaderTitleGroup}>
                  <Text style={styles.widgetKicker}>SENADO FEDERAL</Text>
                  <Text style={styles.widgetTitle}>Maiores Gastos de CEAPS</Text>
                  <Text style={styles.widgetSubtitle}>
                    Reembolsos da Cota para Exercício da Atividade Parlamentar
                    {dashboard?.senateCeaps.year
                      ? ` · Exercício ${dashboard.senateCeaps.year}`
                      : ""}
                  </Text>
                </View>
                <View style={styles.widgetHeaderActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={hideCeapsWidget ? "Expandir gastos de CEAPS" : "Ocultar gastos de CEAPS"}
                    onPress={() => setHideCeapsWidget(!hideCeapsWidget)}
                    style={styles.widgetHideBtn}
                  >
                    <Text style={styles.widgetHideBtnText}>
                      {hideCeapsWidget ? "Expandir" : "Ocultar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/representatives",
                        params: { role: "SENATOR" },
                      } as Href)
                    }
                    style={styles.widgetActionLink}
                  >
                    <Text style={styles.widgetActionLinkText}>Ver todos</Text>
                  </Pressable>
                </View>
              </View>

              {!hideCeapsWidget && (
                <>
                  {dashboard?.senateCeaps.spenders && dashboard.senateCeaps.spenders.length > 0 ? (
                    <View style={styles.spendersList}>
                      {dashboard.senateCeaps.spenders.map((spender, index) => {
                        const photoUri = spender.photoUrl
                          ? getApiAssetUrl(spender.photoUrl)
                          : null;
                        return (
                          <Pressable
                            key={spender.id}
                            onPress={() =>
                              router.push(`/representatives/${encodeURIComponent(spender.id)}` as Href)
                            }
                            style={({ pressed }) => [
                              styles.spenderItem,
                              pressed && styles.pressed,
                              index === 0 && styles.firstSpenderItem,
                            ]}
                          >
                            <View style={styles.spenderRankBadge}>
                              <Text style={styles.spenderRankText}>#{index + 1}</Text>
                            </View>

                            {photoUri ? (
                              <Image
                                source={{ uri: photoUri }}
                                style={styles.spenderPhoto}
                              />
                            ) : (
                              <View style={[styles.spenderPhoto, styles.spenderPhotoPlaceholder]}>
                                <Text style={styles.spenderInitial}>
                                  {spender.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}

                            <View style={styles.spenderInfo}>
                              <Text style={styles.spenderName} numberOfLines={1}>
                                {spender.name}
                              </Text>
                              <View style={styles.spenderMetaRow}>
                                {spender.party ? (
                                  <View style={styles.partyBadge}>
                                    <Text style={styles.partyBadgeText}>{spender.party}</Text>
                                  </View>
                                ) : null}
                                {spender.state ? (
                                  <Text style={styles.stateText}>{spender.state}</Text>
                                ) : null}
                              </View>
                            </View>

                            <View style={styles.spenderValueColumn}>
                              <Text style={styles.spenderTotal}>
                                {formatCurrencyBRL(spender.total)}
                              </Text>
                              <Text style={styles.spenderValueLabel}>reembolsado</Text>
                            </View>
                            <Text style={styles.chevron} accessible={false}>
                              ›
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyWidget}>
                      <Text style={styles.emptyWidgetText}>
                        Aguardando sincronização de despesas do Senado Federal.
                      </Text>
                    </View>
                  )}

                  {/* Source Provenance */}
                  <View style={styles.widgetFooter}>
                    <SourceBadge
                      sourceName={
                        dashboard?.senateCeaps.source?.name ??
                        "Senado Federal · Dados Abertos (CEAPS)"
                      }
                      sourceType="SENADO_API"
                      consultedAt={dashboard?.senateCeaps.source?.consultedAt}
                      year={dashboard?.senateCeaps.year}
                      size="sm"
                    />
                  </View>
                </>
              )}
            </View>

            {/* Widget 2: Execução Orçamentária dos Ministérios (CGU) */}
            <View style={[styles.widgetCard, isDesktop && styles.widgetCardHalf, isMobile && styles.widgetCardMobile]}>
              <View style={styles.widgetHeader}>
                <View style={styles.widgetHeaderTitleGroup}>
                  <Text style={styles.widgetKicker}>EXECUTIVO FEDERAL · CGU</Text>
                  <Text style={styles.widgetTitle}>Principais Ministérios</Text>
                  <Text style={styles.widgetSubtitle}>
                    Volume de recursos públicos empenhados e pagos no exercício
                    {dashboard?.executive.year ? ` ${dashboard.executive.year}` : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push("/cgu/expenses" as Href)}
                  style={styles.widgetActionLink}
                >
                  <Text style={styles.widgetActionLinkText}>Consultar SIAFI</Text>
                </Pressable>
              </View>

              {dashboard?.executive.agencies && dashboard.executive.agencies.length > 0 ? (
                <View style={styles.agenciesList}>
                  {dashboard.executive.agencies.map((agency) => {
                    const paidNum = parseCurrencyToNumber(agency.pago) ?? 0;
                    const committedNum = parseCurrencyToNumber(agency.empenhado) ?? 0;
                    const executionRatio =
                      committedNum > 0
                        ? Math.min(100, Math.round((paidNum / committedNum) * 100))
                        : null;

                    return (
                      <Pressable
                        key={agency.code}
                        onPress={() =>
                          router.push({
                            pathname: "/cgu/expenses",
                            params: {
                              agencyCode: agency.code,
                              agencyName: agency.name,
                            },
                          } as Href)
                        }
                        style={({ pressed }) => [styles.agencyItem, pressed && styles.pressed]}
                      >
                        <View style={styles.agencyTopRow}>
                          <View style={styles.agencyNameContainer}>
                            <Text style={styles.agencyName} numberOfLines={1}>
                              {agency.name}
                            </Text>
                            <View style={styles.agencyCodeBadge}>
                              <Text style={styles.agencyCodeText}>SIAFI {agency.code}</Text>
                            </View>
                          </View>
                          <Text style={styles.chevron} accessible={false}>
                            ›
                          </Text>
                        </View>

                        <View style={styles.agencyNumbersRow}>
                          <View style={styles.agencyNumberCol}>
                            <Text style={styles.numberLabel}>Pago:</Text>
                            <Text style={styles.numberValuePaid}>
                              {formatCompactBRL(agency.pago)}
                            </Text>
                          </View>
                          <View style={styles.agencyNumberCol}>
                            <Text style={styles.numberLabel}>Empenhado:</Text>
                            <Text style={styles.numberValueCommitted}>
                              {formatCompactBRL(agency.empenhado)}
                            </Text>
                          </View>
                          {executionRatio !== null ? (
                            <View style={styles.agencyRatioBadge}>
                              <Text style={styles.agencyRatioText}>
                                {executionRatio}% pago
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Progress Bar of Budget Execution */}
                        {executionRatio !== null ? (
                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { width: `${executionRatio}%` },
                              ]}
                            />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyWidget}>
                  <Text style={styles.emptyWidgetText}>
                    {dashboard?.executive.unavailable
                      ? `Fonte temporariamente indisponível (${dashboard.executive.unavailable}).`
                      : "Aguardando registros da Controladoria-Geral da União."}
                  </Text>
                </View>
              )}

              {/* Source Provenance */}
              <View style={styles.widgetFooter}>
                <SourceBadge
                  sourceName={
                    dashboard?.executive.source?.name ??
                    "Portal da Transparência — Controladoria-Geral da União"
                  }
                  sourceType="CGU_API"
                  consultedAt={dashboard?.executive.source?.consultedAt}
                  year={dashboard?.executive.year}
                  size="sm"
                />
              </View>
            </View>
          </View>

          {/* Widget 3: Composição Parlamentar & Bancadas */}
          {dashboard?.agents && dashboard.agents.topParties.length > 0 && (
            <View style={styles.compositionCard}>
              <View style={styles.widgetHeader}>
                <View>
                  <Text style={styles.widgetKicker}>FORÇA POLÍTICA</Text>
                  <Text style={styles.widgetTitle}>Composição das Bancadas</Text>
                  <Text style={styles.widgetSubtitle}>
                    Distribuição dos representantes públicos cadastrados por partido
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push("/(tabs)/representatives" as Href)}
                  style={styles.widgetActionLink}
                >
                  <Text style={styles.widgetActionLinkText}>Ver bancadas</Text>
                </Pressable>
              </View>

              <View style={styles.partiesRow}>
                {dashboard.agents.topParties.map((party) => (
                  <Pressable
                    key={party.party}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/representatives",
                        params: { party: party.party },
                      } as Href)
                    }
                    style={({ pressed }) => [styles.partyChipCard, pressed && styles.pressed]}
                  >
                    <Text style={styles.partyChipName}>{party.party}</Text>
                    <View style={styles.partyChipCountBadge}>
                      <Text style={styles.partyChipCountText}>{party.count}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Navigation Shortcuts Grid */}
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionKicker}>EXPLORAÇÃO GUIADA</Text>
              <Text style={styles.sectionTitle}>Consultas Disponíveis</Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/more" as Href)}>
              <Text style={styles.seeAllText}>Mais áreas</Text>
            </Pressable>
          </View>

          <View style={styles.shortcutGrid}>
            <ShortcutCard
              label="Agentes Públicos"
              detail="Deputados e senadores, partidos, mandatos e contatos oficiais"
              icon="◎"
              isMobile={isMobile}
              onPress={() => router.push("/(tabs)/representatives" as Href)}
            />
            <ShortcutCard
              label="Despesas por Órgão"
              detail="Consultas anuais por ministérios e secretarias federais"
              icon="R$"
              isMobile={isMobile}
              onPress={() => router.push("/cgu/expenses" as Href)}
            />
            <ShortcutCard
              label="Catálogo SIAFI"
              detail="Diretório oficial de unidades governamentais e fundações"
              icon="🏢"
              isMobile={isMobile}
              onPress={() => router.push("/agencies" as Href)}
            />
            <ShortcutCard
              label="Atuação Legislativa"
              detail="Projetos de lei, tramitações e votações nominais na Câmara"
              icon="▤"
              isMobile={isMobile}
              onPress={() => router.push("/(tabs)/activity" as Href)}
            />
          </View>

          {/* Provenance & Methodology Commitment Banner */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver fontes oficiais e metodologia dos dados"
            onPress={() => router.push("/sources" as Href)}
            style={({ pressed }) => [styles.provenanceBanner, pressed && styles.pressed]}
          >
            <View style={styles.provenanceIconBox}>
              <Text style={styles.provenanceIcon}>ℹ</Text>
            </View>
            <View style={styles.provenanceCopy}>
              <Text style={styles.provenanceTitle}>
                Compromisso com a integridade dos dados
              </Text>
              <Text style={styles.provenanceText}>
                O Voz Pública não calcula notas subjetivas nem altera dados da origem.
                Todas as consultas mantêm o código SIAFI, o número do processo e o carimbo de
                data e hora oficial.
              </Text>
            </View>
            <Text style={styles.provenanceArrow} accessible={false}>
              →
            </Text>
          </Pressable>
        </>
      )}
    </Screen>
  </View>
  );
}

function ShortcutCard({
  label,
  detail,
  icon,
  onPress,
  isMobile,
}: {
  label: string;
  detail: string;
  icon: string;
  onPress: () => void;
  isMobile?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.shortcut,
        isMobile ? styles.shortcutMobile : styles.shortcutDesktop,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.shortcutIconBox}>
        <Text style={styles.shortcutGlyph} accessible={false}>
          {icon}
        </Text>
      </View>
      <View style={styles.shortcutTextGroup}>
        <Text style={styles.shortcutTitle}>{label}</Text>
        <Text style={styles.shortcutDetail}>{detail}</Text>
      </View>
      <Text style={styles.shortcutArrow} accessible={false}>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rootFill: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  screenContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  screenContainerMobile: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  brandGlyph: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  brandCopy: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  brandName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: colors.tealLight,
  },
  statusOffline: {
    backgroundColor: "#FCE8E6",
  },
  statusLoading: {
    backgroundColor: colors.primaryLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOnline: {
    backgroundColor: colors.teal,
  },
  dotOffline: {
    backgroundColor: colors.red,
  },
  dotLoading: {
    backgroundColor: colors.gold,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextOnline: {
    color: colors.teal,
  },
  statusTextOffline: {
    color: colors.red,
  },
  statusTextLoading: {
    color: colors.gold,
  },
  brandTagline: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIcon: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
  },
  moreIcon: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.8,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: 22,
    padding: 22,
    gap: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  heroMobile: {
    padding: 16,
    borderRadius: 18,
    gap: 12,
  },
  heroHeader: {
    gap: 8,
  },
  heroPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroPillText: {
    color: "#B7CAE2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroHeadline: {
    color: colors.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  heroHeadlineMobile: {
    fontSize: 20,
    lineHeight: 26,
  },
  heroSubtitle: {
    color: "#D4DFEC",
    fontSize: 13,
    lineHeight: 19,
  },
  heroSubtitleMobile: {
    fontSize: 12,
    lineHeight: 17,
  },
  searchContainer: {
    gap: 12,
    marginTop: 4,
  },
  searchBar: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  searchIcon: {
    color: colors.primary,
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 6,
  },
  clearIcon: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: "700",
  },
  searchSubmitBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchSubmitText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  quickChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickChipsLabel: {
    color: "#A2B6CF",
    fontSize: 11,
    fontWeight: "600",
  },
  chipsScroll: {
    gap: 8,
    paddingRight: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  chipIcon: {
    fontSize: 12,
  },
  chipText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  errorNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FCE8E6",
    borderColor: "#EBC9C6",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  errorNoticeIcon: {
    color: colors.red,
    fontSize: 20,
    fontWeight: "800",
  },
  errorNoticeContent: {
    flex: 1,
    gap: 2,
  },
  errorNoticeTitle: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "700",
  },
  errorNoticeBody: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 16,
  },
  errorRetryBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  errorRetryText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sectionKicker: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  syncTimestamp: {
    color: colors.muted,
    fontSize: 11,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    paddingVertical: 4,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  widgetsContainer: {
    gap: 16,
  },
  widgetsContainerDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  widgetCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  widgetCardMobile: {
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  widgetCardHalf: {
    flex: 1,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  widgetHeaderTitleGroup: {
    flex: 1,
    gap: 2,
  },
  widgetKicker: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  widgetTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  widgetSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  widgetActionLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  widgetActionLinkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  spendersList: {
    gap: 8,
  },
  spenderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  firstSpenderItem: {
    borderColor: colors.gold,
    backgroundColor: colors.goldLight,
  },
  spenderRankBadge: {
    width: 24,
    alignItems: "center",
  },
  spenderRankText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  spenderPhoto: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  spenderPhotoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  spenderInitial: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  spenderInfo: {
    flex: 1,
    gap: 3,
  },
  spenderName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  spenderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  partyBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  partyBadgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
  },
  stateText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  spenderValueColumn: {
    alignItems: "flex-end",
  },
  spenderTotal: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  spenderValueLabel: {
    color: colors.muted,
    fontSize: 10,
  },
  chevron: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 2,
  },
  agenciesList: {
    gap: 10,
  },
  agencyItem: {
    padding: 12,
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  agencyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  agencyNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  agencyName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  agencyCodeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  agencyCodeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  agencyNumbersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  agencyNumberCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  numberLabel: {
    color: colors.muted,
    fontSize: 11,
  },
  numberValuePaid: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "800",
  },
  numberValueCommitted: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  agencyRatioBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    marginLeft: "auto",
  },
  agencyRatioText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: colors.line,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.teal,
    borderRadius: 3,
  },
  emptyWidget: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWidgetText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
  },
  widgetFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  compositionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  partiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  partyChipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  partyChipName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  partyChipCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  partyChipCountText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  shortcutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  shortcut: {
    flexGrow: 1,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shortcutDesktop: {
    width: "48%",
    minWidth: 180,
  },
  shortcutMobile: {
    width: "100%",
  },
  shortcutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutGlyph: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  shortcutTextGroup: {
    flex: 1,
    gap: 2,
  },
  shortcutTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  shortcutDetail: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  shortcutArrow: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "700",
  },
  provenanceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.primaryLight,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  provenanceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  provenanceIcon: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  provenanceCopy: {
    flex: 1,
    gap: 3,
  },
  provenanceTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  provenanceText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  provenanceArrow: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  restoreBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  restoreBarText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  restoreBarBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  restoreBarBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  widgetHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  widgetHideBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  widgetHideBtnText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
});
