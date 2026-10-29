import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "../../components/Feedback";
import { Screen } from "../../components/Screen";
import {
  getCommitments,
  type ApiPage,
  type CommitmentRecord,
} from "../../services/api";
import { colors } from "../../theme/colors";

export default function CommitmentsScreen() {
  const [records, setRecords] = useState<CommitmentRecord[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (requestedPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const result: ApiPage<CommitmentRecord> = await getCommitments(requestedPage);
      setRecords((current) =>
        append ? [...current, ...result.data] : result.data,
      );
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível carregar os compromissos.",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  return (
    <Screen>
      <Text style={styles.kicker}>ACOMPANHAMENTO DOCUMENTAL</Text>
      <Text style={styles.title}>Compromissos</Text>
      <Text style={styles.subtitle}>
        Registros com critérios explícitos, fonte identificada e evidências rastreáveis.
      </Text>
      <Notice
        title="Sem avaliações automáticas"
        body="Uma proposta ou notícia não comprova, por si só, o cumprimento de um compromisso. Cada avaliação exige fonte, contexto e revisão."
      />
      {loading ? <LoadingState label="Carregando compromissos..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={() => void loadPage(1, false)} />
      ) : null}
      {!loading && !error && records.length === 0 ? (
        <EmptyState
          title="Nenhum compromisso registrado"
          body="Não há compromissos documentados nesta base. Não exibimos compromissos inventados nem atribuímos status sem evidências."
        />
      ) : null}
      {records.map((record) => (
        <CommitmentCard key={record.id} record={record} />
      ))}
      {!loading && !error && page < totalPages ? (
        <Pressable
          accessibilityRole="button"
          disabled={loadingMore}
          onPress={() => void loadPage(page + 1, true)}
          style={styles.moreButton}
        >
          <Text style={styles.moreButtonText}>
            {loadingMore ? "Carregando..." : "Carregar mais"}
          </Text>
        </Pressable>
      ) : null}
      {!loading && error && records.length > 0 ? (
        <ErrorState
          message={error}
          onRetry={() => void loadPage(page + 1, true)}
        />
      ) : null}
      <View style={styles.info}>
        <Text style={styles.infoTitle}>Como uma avaliação deve funcionar</Text>
        <Text style={styles.infoBody}>
          Cada registro deve indicar a origem do compromisso, o método de
          avaliação, suas evidências e o histórico de alterações do status.
        </Text>
      </View>
    </Screen>
  );
}

function CommitmentCard({ record }: { record: CommitmentRecord }) {
  async function openSource() {
    try {
      await Linking.openURL(record.source.url);
    } catch {
      Alert.alert(
        "Fonte indisponível",
        "Não foi possível abrir o endereço oficial neste dispositivo.",
      );
    }
  }

  const latestReview = record.history[0];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{record.title}</Text>
        <Text style={styles.status}>{statusLabel(record.status)}</Text>
      </View>
      {record.politician ? (
        <Text style={styles.meta}>
          {record.politician.name}
          {record.politician.state ? ` · ${record.politician.state}` : ""}
        </Text>
      ) : null}
      <Text style={styles.body}>{record.description}</Text>
      <Text style={styles.meta}>
        Prazo: {record.deadline ? formatDate(record.deadline) : "Não informado pela fonte"}
      </Text>
      <Text style={styles.meta}>
        Evidências vinculadas: {record.evidenceCount}
      </Text>
      <Text style={styles.meta}>Método: {record.evaluationMethod}</Text>
      {latestReview ? (
        <View style={styles.review}>
          <Text style={styles.reviewTitle}>
            Revisão · {statusLabel(latestReview.newStatus)}
          </Text>
          <Text style={styles.body}>{latestReview.rationale}</Text>
          <Text style={styles.meta}>
            Atualizado em {formatDate(latestReview.changedAt)}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="link"
        onPress={() => void openSource()}
        style={styles.sourceButton}
      >
        <Text style={styles.sourceButtonText}>
          Fonte: {record.source.name} ↗
        </Text>
      </Pressable>
      <Text style={styles.meta}>
        Fonte consultada em {formatDate(record.source.consultedAt)}
      </Text>
    </View>
  );
}

function statusLabel(status: CommitmentRecord["status"]): string {
  const labels: Record<CommitmentRecord["status"], string> = {
    A_VERIFICAR: "A verificar",
    EM_ANDAMENTO: "Em andamento",
    CUMPRIDO: "Cumprido",
    PARCIALMENTE_CUMPRIDO: "Parcial",
    NAO_CUMPRIDO: "Não cumprido",
    SEM_INFORMACAO_SUFICIENTE: "Sem informação suficiente",
  };
  return labels[status];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informado pela fonte"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 30, fontWeight: "800", marginTop: -8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -9 },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 17,
    padding: 16,
    gap: 10,
  },
  cardHeader: { gap: 9 },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  status: {
    color: colors.forest,
    backgroundColor: colors.mint,
    borderRadius: 9,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "800",
  },
  body: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  review: {
    borderLeftColor: colors.green,
    borderLeftWidth: 3,
    paddingLeft: 11,
    gap: 5,
  },
  reviewTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  sourceButton: {
    backgroundColor: colors.mint,
    borderRadius: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  sourceButtonText: { color: colors.forest, fontSize: 12, fontWeight: "800" },
  moreButton: {
    backgroundColor: colors.forest,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
  },
  moreButtonText: { color: colors.white, fontWeight: "800" },
  info: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 17,
    padding: 17,
    gap: 7,
  },
  infoTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  infoBody: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
