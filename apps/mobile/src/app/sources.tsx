import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Notice } from "../components/Feedback";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

const sources = [
  {
    id: "camara",
    name: "Câmara dos Deputados",
    coverage: "Representantes, proposições, tramitações, votações vinculadas e despesas de deputados.",
    url: "https://dadosabertos.camara.leg.br/",
    label: "Abrir Dados Abertos da Câmara",
  },
  {
    id: "senado",
    name: "Senado Federal",
    coverage: "Lista de senadores em exercício e despesas parlamentares CEAPS.",
    url: "https://adm.senado.gov.br/adm-dadosabertos/",
    label: "Abrir Dados Abertos do Senado",
  },
  {
    id: "cgu",
    name: "Controladoria-Geral da União",
    coverage: "Catálogo SIAFI e consulta de despesas anuais do Executivo Federal.",
    url: "https://portaldatransparencia.gov.br/",
    label: "Abrir Portal da Transparência",
  },
] as const;

export default function SourcesScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Text style={styles.kicker}>TRANSPARÊNCIA</Text>
      <Text style={styles.title}>Fontes e metodologia</Text>
      <Text style={styles.subtitle}>
        O aplicativo organiza consultas a dados públicos sem substituir nem
        reinterpretar a fonte original.
      </Text>

      {sources.map((source) => (
        <View key={source.name} style={styles.card}>
          <Text style={styles.cardTitle}>{source.name}</Text>
          <Text style={styles.body}>{source.coverage}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push(`/sources/${source.id}` as Href)
            }
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Ver cobertura e limitações →</Text>
          </Pressable>
        </View>
      ))}

      <Notice
        title="Limites do escopo atual"
        body="O Senado está integrado para a lista pública de senadores e despesas CEAPS. Proposições e votações do Senado não fazem parte do aplicativo. A consulta legislativa disponível é da Câmara dos Deputados."
      />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Como os dados são apresentados</Text>
        <Text style={styles.body}>
          Cada consulta identifica a fonte e, quando a resposta fornece essa
          informação, a data de consulta. Ausência de registros não significa
          ausência de atividade. Valores de despesas não são usados para
          presumir irregularidade.
        </Text>
        <Text style={styles.body}>
          Compromissos e ações são registros editoriais documentados e não são
          criados automaticamente a partir de notícias ou proposições.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 9,
  },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  linkButton: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
});
