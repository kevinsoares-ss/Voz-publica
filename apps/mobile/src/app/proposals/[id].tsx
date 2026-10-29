import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import { Screen } from "../../components/Screen";
import {
  getProposal,
  getProposalProgress,
  getProposalVotes,
  officialProposalUrl,
  type OfficialRecord,
} from "../../services/api";
import { colors } from "../../theme/colors";

function textField(record: OfficialRecord, key: string): string | null {
  const value = record[key];
  if (typeof value === "string" || typeof value === "number") return String(value);
  return null;
}

function isRecord(value: unknown): value is OfficialRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function EventList({
  title,
  records,
  emptyTitle,
  error,
  onVote,
}: {
  title: string;
  records: OfficialRecord[] | null;
  emptyTitle: string;
  error?: string;
  onVote?: (id: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : records === null ? (
        <LoadingState label={`Carregando ${title.toLowerCase()}...`} />
      ) : records.length === 0 ? (
        <Text style={styles.muted}>{emptyTitle}</Text>
      ) : (
        records.map((record, index) => {
          const id = textField(record, "id");
          const description =
            textField(record, "descricaoTramitacao") ??
            textField(record, "descricao") ??
            textField(record, "situacao") ??
            "Descrição não informada pela fonte";
          return (
            <View key={id ?? `${title}-${index}`} style={styles.eventCard}>
              <Text style={styles.eventDate}>
                {textField(record, "dataHora") ??
                  textField(record, "data") ??
                  "Data não informada pela fonte"}
              </Text>
              <Text style={styles.eventDescription}>{description}</Text>
              {textField(record, "descricaoSituacao") ? (
                <Text style={styles.muted}>
                  Situação informada: {textField(record, "descricaoSituacao")}
                </Text>
              ) : null}
              {textField(record, "aprovacao") ? (
                <Text style={styles.muted}>
                  Indicador de aprovação informado pela fonte: {textField(record, "aprovacao")}
                </Text>
              ) : null}
              {textField(record, "siglaOrgao") ? (
                <Text style={styles.muted}>Órgão: {textField(record, "siglaOrgao")}</Text>
              ) : null}
              {onVote && id ? (
                <Pressable onPress={() => onVote(id)} style={styles.inlineLink}>
                  <Text style={styles.inlineLinkText}>Consultar votos individuais →</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

export default function ProposalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const proposalId = Array.isArray(id) ? id[0] : id;
  const [proposal, setProposal] = useState<OfficialRecord | null>(null);
  const [progress, setProgress] = useState<OfficialRecord[] | null>(null);
  const [votes, setVotes] = useState<OfficialRecord[] | null>(null);
  const [error, setError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [votesError, setVotesError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!proposalId) {
      setError("Identificador de proposição ausente.");
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    void Promise.allSettled([
      getProposal(proposalId),
      getProposalProgress(proposalId),
      getProposalVotes(proposalId),
    ]).then(([detailResult, progressResult, voteResult]) => {
      if (!active) return;
      if (detailResult.status === "fulfilled") {
        setProposal(detailResult.value.data);
      } else {
        setError(
          detailResult.reason instanceof Error
            ? detailResult.reason.message
            : "Não foi possível carregar a proposição.",
        );
      }
      if (progressResult.status === "fulfilled") {
        setProgress(progressResult.value.data);
      } else {
        setProgress([]);
        setProgressError(
          progressResult.reason instanceof Error
            ? progressResult.reason.message
            : "Falha inesperada ao consultar tramitações.",
        );
      }
      if (voteResult.status === "fulfilled") {
        setVotes(voteResult.value.data);
      } else {
        setVotes([]);
        setVotesError(
          voteResult.reason instanceof Error
            ? voteResult.reason.message
            : "Falha inesperada ao consultar votações.",
        );
      }
    })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [proposalId, retryCount]);

  if (loading) {
    return <Screen><LoadingState label="Carregando proposição oficial..." /></Screen>;
  }
  if (error && !proposal) {
    return <Screen><ErrorState message={error} onRetry={() => setRetryCount((count) => count + 1)} /></Screen>;
  }
  if (!proposal) {
    return <Screen><EmptyState title="Proposição indisponível" body="A fonte não retornou detalhes para este identificador." /></Screen>;
  }

  const type = textField(proposal, "siglaTipo") ?? "Proposição";
  const number = textField(proposal, "numero");
  const year = textField(proposal, "ano");
  const officialUrl = officialProposalUrl(proposalId ?? "");
  const status = isRecord(proposal.statusProposicao)
    ? proposal.statusProposicao
    : null;

  return (
    <Screen>
      <Text style={styles.kicker}>FONTE OFICIAL · ID {proposalId}</Text>
      <Text style={styles.title}>{[type, number && `nº ${number}`, year].filter(Boolean).join(" · ")}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ementa</Text>
        <Text style={styles.ementa}>
          {textField(proposal, "ementa") ?? "Ementa não informada pela fonte consultada."}
        </Text>
        <Text style={styles.muted}>
          Apresentação: {textField(proposal, "dataApresentacao") ?? "Não informada pela fonte"}
        </Text>
        {status ? (
          <View style={styles.statusBlock}>
            <Text style={styles.statusLabel}>Situação oficial informada</Text>
            <Text style={styles.eventDescription}>
              {textField(status, "descricaoSituacao") ??
                textField(status, "descricaoTramitacao") ??
                "Situação não informada pela fonte"}
            </Text>
            {textField(status, "dataHora") ? (
              <Text style={styles.muted}>Atualizada em {textField(status, "dataHora")}</Text>
            ) : null}
            {textField(status, "siglaOrgao") ? (
              <Text style={styles.muted}>Órgão: {textField(status, "siglaOrgao")}</Text>
            ) : null}
          </View>
        ) : null}
        <Pressable onPress={() => void Linking.openURL(officialUrl)} style={styles.sourceButton}>
          <Text style={styles.sourceButtonText}>Abrir proposição na Câmara ↗</Text>
        </Pressable>
      </View>
      <EventList
        title="Tramitações"
        records={progress}
        emptyTitle="A fonte não retornou tramitações nesta consulta."
        error={progressError}
      />
      <EventList
        title="Votações relacionadas"
        records={votes}
        emptyTitle="A fonte não retornou votações relacionadas nesta consulta."
        error={votesError}
        onVote={(voteId) => router.push(`/votes/${encodeURIComponent(voteId)}`)}
      />
      <Text style={styles.source}>Fonte: Câmara dos Deputados — Dados Abertos. Consulte o link oficial para a resposta atual.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  title: { color: colors.ink, fontSize: 24, lineHeight: 30, fontWeight: "800" },
  section: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 17, padding: 16, gap: 11 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  ementa: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  errorText: { color: colors.red, fontSize: 12, lineHeight: 18 },
  sourceButton: { backgroundColor: colors.mint, borderRadius: 12, padding: 12, alignItems: "center" },
  sourceButtonText: { color: colors.forest, fontSize: 13, fontWeight: "800" },
  eventCard: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 10, gap: 5 },
  statusBlock: { backgroundColor: colors.mint, borderRadius: 12, padding: 12, gap: 5 },
  statusLabel: { color: colors.forest, fontSize: 11, fontWeight: "800" },
  eventDate: { color: colors.green, fontSize: 11, fontWeight: "700" },
  eventDescription: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  inlineLink: { alignSelf: "flex-start", paddingVertical: 5 },
  inlineLinkText: { color: colors.forest, fontSize: 12, fontWeight: "800" },
  source: { color: colors.muted, textAlign: "center", fontSize: 11, lineHeight: 17 },
});
