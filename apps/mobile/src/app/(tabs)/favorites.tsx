import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import { RepresentativeCard } from "../../components/RepresentativeCard";
import { Screen } from "../../components/Screen";
import {
  getRepresentative,
  type Representative,
} from "../../services/api";
import { getFavoriteIds, setFavorite } from "../../services/favorites";
import { colors } from "../../theme/colors";

export default function FavoritesScreen() {
  const router = useRouter();
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [missingCount, setMissingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError("");
      void getFavoriteIds()
        .then(async (ids) => {
          const records = await Promise.allSettled(ids.map((id) => getRepresentative(id)));
          if (!active) return;
          setRepresentatives(
            records.flatMap((result) =>
              result.status === "fulfilled" ? [result.value.data] : [],
            ),
          );
          setMissingCount(records.filter((result) => result.status === "rejected").length);
        })
        .catch((caught: unknown) => {
          if (!active) return;
          setError(caught instanceof Error ? caught.message : "Não foi possível ler favoritos.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [refresh]),
  );

  async function removeFavorite(id: string) {
    try {
      await setFavorite(id, false);
      setRepresentatives((current) => current.filter((entry) => entry.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar favoritos.");
    }
  }

  return (
    <Screen>
      <Text style={styles.kicker}>SALVOS NESTE APARELHO</Text>
      <Text style={styles.title}>Favoritos</Text>
      <Text style={styles.subtitle}>Seus agentes públicos salvos, sem precisar de conta.</Text>
      {loading ? <LoadingState label="Carregando favoritos..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={() => setRefresh((value) => value + 1)} />
      ) : null}
      {!loading && !error && representatives.length === 0 ? (
        <EmptyState
          title="Ainda sem favoritos"
          body="Toque no coração ao lado de um perfil para salvá-lo neste aparelho."
        />
      ) : null}
      {missingCount > 0 ? (
        <Text style={styles.missing}>
          {missingCount} favorito(s) não puderam ser carregados da API. O ID continua salvo localmente.
        </Text>
      ) : null}
      {representatives.map((representative) => (
        <RepresentativeCard
          key={representative.id}
          representative={representative}
          favorite
          onPress={() =>
            router.push({
              pathname: "/representatives/[id]",
              params: { id: representative.id },
            } as Href)
          }
          onToggleFavorite={() => void removeFavorite(representative.id)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 30, fontWeight: "800", marginTop: -8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: -9 },
  missing: { color: colors.amber, backgroundColor: "#FFF4DD", padding: 12, borderRadius: 12, fontSize: 12, lineHeight: 18 },
});
