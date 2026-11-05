import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Notice } from "../../components/Feedback";
import { Screen } from "../../components/Screen";
import { colors } from "../../theme/colors";

export default function ActivityScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Text style={styles.kicker}>DADOS OFICIAIS</Text>
      <Text style={styles.title}>Atuação legislativa</Text>
      <Text style={styles.subtitle}>
        Consulte proposições da Câmara dos Deputados e acompanhe seus registros
        oficiais.
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/proposals" as Href)}
        style={({ pressed }) => [styles.primaryCard, pressed && styles.pressed]}
      >
        <View style={styles.iconBox}>
          <Text style={styles.icon}>▤</Text>
        </View>
        <Text style={styles.cardTitle}>Pesquisar proposições</Text>
        <Text style={styles.cardBody}>
          Busque por tipo e ano na API oficial da Câmara.
        </Text>
        <Text style={styles.cardAction}>Abrir consulta →</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Votações</Text>
        <Text style={styles.body}>
          Os votos individuais aparecem nos detalhes das proposições quando
          retornados pela fonte. Não há uma consulta geral de votações nesta
          versão.
        </Text>
      </View>

      <Notice
        title="Escopo da integração"
        body="Esta área cobre somente dados legislativos da Câmara dos Deputados. O app não oferece proposições nem votações do Senado."
      />

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/sources" as Href)}
        style={styles.sourceLink}
      >
        <Text style={styles.sourceLinkText}>Fonte e limites dos dados</Text>
        <Text style={styles.arrow} accessible={false}>›</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  primaryCard: {
    backgroundColor: colors.navy,
    borderRadius: 18,
    padding: 18,
    gap: 9,
  },
  pressed: { opacity: 0.84 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#263B55",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  icon: { color: "#C8DAF1", fontSize: 20 },
  cardTitle: { color: colors.white, fontSize: 18, fontWeight: "800" },
  cardBody: { color: "#D4DFEC", fontSize: 13, lineHeight: 20 },
  cardAction: { color: "#B7D0F1", fontSize: 13, fontWeight: "800", marginTop: 2 },
  section: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  sourceLink: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
  },
  sourceLinkText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  arrow: { color: colors.primary, fontSize: 24 },
});
