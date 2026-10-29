import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text } from "react-native";
import { EmptyState, ErrorState, LoadingState, Notice } from "../../components/Feedback";
import { Screen } from "../../components/Screen";
import { getIndividualVotes, type OfficialList } from "../../services/api";
import { colors } from "../../theme/colors";

export default function IndividualVotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const voteId = Array.isArray(id) ? id[0] : id;
  const [result, setResult] = useState<OfficialList | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!voteId) {
      setError("Identificador da votação não informado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setResult(await getIndividualVotes(voteId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha inesperada.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [voteId]);

  return (
    <Screen>
      <Text style={styles.kicker}>VOTAÇÃO OFICIAL</Text>
      <Text style={styles.title}>Votos individuais</Text>
      <Text style={styles.subtitle}>ID da votação: {voteId ?? "Não informado"}</Text>
      <Notice
        title="Resultado conforme a fonte"
        body="Uma lista vazia significa que nenhum registro individual foi retornado para esta votação consultada. Não transforma a ausência em voto ou posição política."
      />
      {loading ? <LoadingState label="Consultando votos na Câmara..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && result?.data.length === 0 ? (
        <EmptyState
          title="Nenhum voto individual retornado"
          body="A API oficial respondeu, mas não trouxe registros individuais para esta votação. Isso não permite concluir como qualquer representante votou."
        />
      ) : null}
      {!loading && !error && result && result.data.length > 0 ? (
        <>
          <Text style={styles.count}>{result.data.length} registro(s) retornado(s)</Text>
          <Notice
            title="Campos ainda não normalizados"
            body="A fonte retornou registros, mas a estrutura de votos individuais ainda requer validação documentada antes de apresentar campos como posição do deputado."
          />
        </>
      ) : null}
      {result ? (
        <>
          <Text style={styles.source}>Consultado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.source.consultedAt))}</Text>
          <Pressable onPress={() => void Linking.openURL(result.source.url)} style={styles.sourceButton}>
            <Text style={styles.sourceButtonText}>Abrir resposta oficial ↗</Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: -8 },
  subtitle: { color: colors.muted, fontSize: 13 },
  count: { color: colors.ink, fontWeight: "700" },
  source: { color: colors.muted, fontSize: 11, textAlign: "center" },
  sourceButton: { backgroundColor: colors.mint, borderRadius: 12, padding: 12, alignItems: "center" },
  sourceButtonText: { color: colors.forest, fontSize: 13, fontWeight: "800" },
});
