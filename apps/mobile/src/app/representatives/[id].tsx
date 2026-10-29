import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "../../components/Feedback";
import { Screen } from "../../components/Screen";
import {
  getGovernmentActions,
  getRepresentative,
  type GovernmentActionRecord,
  type Representative,
} from "../../services/api";
import { getFavoriteIds, setFavorite } from "../../services/favorites";
import { colors } from "../../theme/colors";

export default function RepresentativeProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const representativeId = Array.isArray(id) ? id[0] : id;
  const [representative, setRepresentative] = useState<Representative | null>(null);
  const [actions, setActions] = useState<GovernmentActionRecord[]>([]);
  const [actionsError, setActionsError] = useState("");
  const [favorite, setFavoriteState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!representativeId) {
      setError("O identificador do agente público não foi informado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [result, ids] = await Promise.all([
        getRepresentative(representativeId),
        getFavoriteIds(),
      ]);
      setRepresentative(result.data);
      setFavoriteState(ids.includes(representativeId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha inesperada.");
    } finally {
      setLoading(false);
    }
  }, [representativeId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!representativeId) return;
    let active = true;
    void getGovernmentActions(representativeId)
      .then((result) => {
        if (active) setActions(result.data);
      })
      .catch((caught: unknown) => {
        if (active) {
          setActionsError(
            caught instanceof Error
              ? caught.message
              : "Não foi possível carregar as ações documentadas.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [representativeId]);

  async function toggleFavorite() {
    if (!representativeId) return;
    try {
      const next = await setFavorite(representativeId, !favorite);
      setFavoriteState(next.includes(representativeId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar favorito.");
    }
  }

  async function openOfficialSource() {
    if (!representative) return;
    const url = representative.sourceUrl ?? representative.source.url;
    try {
      await Linking.openURL(url);
    } catch {
      setError("Não foi possível abrir a fonte oficial neste dispositivo.");
    }
  }

  return (
    <Screen>
      {loading ? <LoadingState label="Carregando perfil..." /> : null}
      {!loading && error && !representative ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}
      {!loading && !error && !representative ? (
        <EmptyState
          title="Perfil indisponível"
          body="Este ID pode não estar sincronizado no banco local. A ausência do registro aqui não significa que a pessoa não exista na fonte oficial."
          actionLabel="Tentar novamente"
          onAction={() => void load()}
        />
      ) : null}
      {representative ? (
        <>
          <View style={styles.hero}>
            {representative.photoUrl ? (
              <Image source={{ uri: representative.photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.initial}>{representative.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.name}>{representative.name}</Text>
            <Text style={styles.meta}>
              {[representative.party, representative.state].filter(Boolean).join(" · ") ||
                "Partido e UF não informados pela fonte"}
            </Text>
            <Text style={styles.officialId}>
              ID oficial ({representative.sourceNamespace}): {representative.externalId}
            </Text>
            <Pressable onPress={() => void toggleFavorite()} style={styles.favoriteButton}>
              <Text style={styles.favoriteText}>
                {favorite ? "♥  Salvo nos favoritos" : "♡  Adicionar aos favoritos"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações disponíveis</Text>
            <InfoRow label="Nome" value={representative.name} />
            <InfoRow label="Nome civil" value={representative.civilName} />
            <InfoRow label="Cargo" value={roleLabel(representative.role)} />
            <InfoRow label="Esfera" value={sphereLabel(representative.sphere)} />
            <InfoRow label="Poder" value={branchLabel(representative.powerBranch)} />
            <InfoRow label="Partido" value={representative.party} />
            <InfoRow label="Estado" value={representative.state} />
            <InfoRow label="Município" value={representative.city} />
            <InfoRow
              label="Última consulta"
              value={formatDate(representative.lastSyncedAt)}
            />
          </View>

          <Notice
            title="Dados proporcionais ao que foi consultado"
            body="Este perfil mostra os campos disponíveis na lista oficial sincronizada. Informações não presentes nessa resposta não são completadas nem inferidas."
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atuação e despesas</Text>
            {representative.sourceNamespace === "camara" ? (
              <>
                <Text style={styles.body}>
                  Consulte recursos disponíveis na Câmara. Respostas vazias são
                  apresentadas como resultado dos filtros consultados, sem
                  presumir valores ou registros.
                </Text>
                <Pressable
                  onPress={() => router.push("/proposals" as Href)}
                  style={styles.sourceButton}
                >
                  <Text style={styles.sourceButtonText}>Pesquisar proposições da Câmara →</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/representatives/[id]/expenses",
                      params: { id: representative.externalId },
                    } as Href)
                  }
                  style={styles.sourceButton}
                >
                  <Text style={styles.sourceButtonText}>Consultar despesas na Câmara →</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.body}>
                O perfil e a fonte oficial foram integrados. Consultas de
                proposições, votações e despesas específicas deste órgão ainda
                não estão disponíveis no app.
              </Text>
            )}
            <Pressable onPress={() => void openOfficialSource()} style={styles.sourceButton}>
              <Text style={styles.sourceButtonText}>Abrir fonte oficial ↗</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ações documentadas</Text>
            {actionsError ? (
              <Text style={styles.body}>{actionsError}</Text>
            ) : actions.length === 0 ? (
              <Text style={styles.body}>
                Nenhuma ação documentada foi registrada para este perfil.
                Ausência de registros não significa ausência de ações.
              </Text>
            ) : (
              actions.map((action) => (
                <View key={action.id} style={styles.actionRecord}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.body}>{action.description}</Text>
                  <Text style={styles.sourceBody}>
                    {action.category} · {impactLabel(action.type)} · {formatDate(action.eventDate)}
                  </Text>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() =>
                      void Linking.openURL(action.evidenceUrl).catch(() =>
                        setActionsError("Não foi possível abrir a evidência oficial."),
                      )
                    }
                    style={styles.sourceButton}
                  >
                    <Text style={styles.sourceButtonText}>
                      Evidência: {action.sourceName} ↗
                    </Text>
                  </Pressable>
                  <Text style={styles.sourceBody}>
                    Consultado em {formatDate(action.source.consultedAt)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sourceCard}>
            <Text style={styles.sourceTitle}>Rastreabilidade</Text>
            <Text style={styles.sourceBody}>{representative.source.name}</Text>
            <Text style={styles.sourceUrl} selectable>
              {representative.sourceUrl ?? representative.source.url}
            </Text>
            <Text style={styles.sourceBody}>
              Consultado em {formatDate(representative.source.consultedAt)}
            </Text>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function roleLabel(role: Representative["role"]): string {
  const labels: Record<Representative["role"], string> = {
    PRESIDENT: "Presidente",
    GOVERNOR: "Governador(a)",
    MAYOR: "Prefeito(a)",
    SENATOR: "Senador(a)",
    FEDERAL_DEPUTY: "Deputado(a) federal",
    STATE_DEPUTY: "Deputado(a) estadual",
    CITY_COUNCILLOR: "Vereador(a)",
  };
  return labels[role];
}

function sphereLabel(sphere: Representative["sphere"]): string {
  const labels: Record<Representative["sphere"], string> = {
    FEDERAL: "Federal",
    STATE: "Estadual",
    MUNICIPAL: "Municipal",
  };
  return labels[sphere];
}

function branchLabel(branch: Representative["powerBranch"]): string {
  return branch === "EXECUTIVE" ? "Executivo" : "Legislativo";
}

function impactLabel(type: GovernmentActionRecord["type"]): string {
  const labels: Record<GovernmentActionRecord["type"], string> = {
    POSITIVE_DELIVERY: "Entrega documentada",
    CRITICAL_ALERT: "Alerta documentado",
    NEUTRAL_METRIC: "Indicador",
  };
  return labels[type];
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Não informado pela fonte consultada"}</Text>
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informado pela fonte consultada"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.forest, borderRadius: 22, padding: 21, alignItems: "center", gap: 7 },
  photo: { width: 96, height: 96, borderRadius: 30, backgroundColor: colors.mint, marginBottom: 4 },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  initial: { color: colors.forest, fontSize: 36, fontWeight: "800" },
  name: { color: colors.white, fontSize: 23, lineHeight: 28, textAlign: "center", fontWeight: "800" },
  meta: { color: "#DCEBE2", fontSize: 14 },
  officialId: { color: "#B9D7C8", fontSize: 11 },
  favoriteButton: { backgroundColor: "#D2E8DA", borderRadius: 12, marginTop: 7, paddingVertical: 11, paddingHorizontal: 15 },
  favoriteText: { color: colors.forest, fontWeight: "800", fontSize: 13 },
  section: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 17, padding: 16, gap: 12 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  infoRow: { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 10, gap: 3 },
  infoLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  infoValue: { color: colors.ink, fontSize: 14 },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  sourceButton: { backgroundColor: colors.mint, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  sourceButtonText: { color: colors.forest, fontWeight: "800", fontSize: 13 },
  sourceCard: { borderRadius: 17, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 5 },
  actionRecord: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 12, gap: 8 },
  actionTitle: { color: colors.ink, fontWeight: "800", fontSize: 14 },
  sourceTitle: { color: colors.ink, fontWeight: "800", fontSize: 14 },
  sourceBody: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  sourceUrl: { color: colors.green, fontSize: 11, lineHeight: 16 },
});
