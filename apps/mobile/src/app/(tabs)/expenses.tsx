import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { colors } from "../../theme/colors";

export default function ExpensesHubScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Text style={styles.kicker}>TRANSPARÊNCIA FINANCEIRA</Text>
      <Text style={styles.title}>Despesas públicas</Text>
      <Text style={styles.subtitle}>
        Escolha uma consulta. Os escopos e períodos permanecem separados para
        não misturar fontes diferentes.
      </Text>

      <ExpenseLink
        title="Despesas do Executivo Federal"
        description="Consulte despesas anuais por órgão nos dados da CGU."
        source="Controladoria-Geral da União · catálogo SIAFI"
        onPress={() => router.push("/cgu/expenses" as Href)}
      />
      <ExpenseLink
        title="Diretório de órgãos"
        description="Pesquise órgãos pelo nome no catálogo oficial SIAFI."
        source="Portal da Transparência · CGU"
        onPress={() => router.push("/agencies" as Href)}
      />
      <ExpenseLink
        title="Despesas parlamentares"
        description="Abra um perfil para consultar despesas disponíveis para aquele representante."
        source="Câmara · deputados federais"
        onPress={() => router.push({
          pathname: "/(tabs)/representatives",
          params: { role: "FEDERAL_DEPUTY" },
        } as Href)}
      />
      <ExpenseLink
        title="Despesas CEAPS do Senado"
        description="Consulte reembolsos por senador e ano, conforme os registros sincronizados."
        source="Senado Federal · CEAPS"
        onPress={() => router.push({
          pathname: "/(tabs)/representatives",
          params: { role: "SENATOR" },
        } as Href)}
      />

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Como interpretar</Text>
        <Text style={styles.noticeBody}>
          Uma despesa registrada não determina, por si só, irregularidade ou
          finalidade. Cada resultado identifica fonte e período consultados.
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/sources" as Href)}
        style={styles.textLink}
      >
        <Text style={styles.textLinkLabel}>Conheça as fontes e limitações</Text>
      </Pressable>
    </Screen>
  );
}

function ExpenseLink({
  title,
  description,
  source,
  onPress,
}: {
  title: string;
  description: string;
  source: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>R$</Text>
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{description}</Text>
        <Text style={styles.source}>{source}</Text>
      </View>
      <Text style={styles.arrow} accessible={false}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  card: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
  },
  pressed: { opacity: 0.82 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  cardCopy: { flex: 1, gap: 4 },
  cardTitle: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: "800" },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  source: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  arrow: { color: colors.primary, fontSize: 24 },
  notice: { backgroundColor: colors.goldLight, borderRadius: 14, padding: 15, gap: 5 },
  noticeTitle: { color: colors.gold, fontSize: 13, fontWeight: "800" },
  noticeBody: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  textLink: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  textLinkLabel: { color: colors.primary, fontSize: 13, fontWeight: "700" },
});
