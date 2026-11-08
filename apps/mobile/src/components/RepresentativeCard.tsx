import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { getApiAssetUrl, type Representative } from "../services/api";

export function RepresentativeCard({
  representative,
  favorite,
  onPress,
  onToggleFavorite,
}: {
  representative: Representative;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const [photoUnavailable, setPhotoUnavailable] = useState(false);
  const photoUri = representative.photoUrl
    ? getApiAssetUrl(representative.photoUrl)
    : null;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir perfil de ${representative.name}`}
        onPress={onPress}
        style={styles.main}
      >
        {photoUri && !photoUnavailable ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            onError={() => setPhotoUnavailable(true)}
          />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Text style={styles.initial}>
              {representative.name.trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.copy}>
          <Text style={styles.name}>{representative.name}</Text>
          <Text style={styles.meta}>
            {[
              roleLabel(representative.role),
              representative.party,
              representative.city,
              representative.state,
            ].filter(Boolean).join(" · ")}
          </Text>
          <Text style={styles.source}>{representative.source.name}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        onPress={onToggleFavorite}
        style={styles.favorite}
      >
        <Text style={[styles.favoriteIcon, favorite && styles.favoriteActive]}>
          {favorite ? "♥" : "♡"}
        </Text>
      </Pressable>
    </View>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  photo: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.mint },
  placeholder: { alignItems: "center", justifyContent: "center" },
  initial: { color: colors.forest, fontSize: 23, fontWeight: "700" },
  copy: { flex: 1, gap: 3 },
  name: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: 13 },
  source: { color: colors.green, fontSize: 11, fontWeight: "600" },
  favorite: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteIcon: { color: colors.muted, fontSize: 24 },
  favoriteActive: { color: colors.red },
});
