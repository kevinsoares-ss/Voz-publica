import { StyleSheet, Text, View } from "react-native";
import { Notice } from "../components/Feedback";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

export default function AboutScreen() {
  return (
    <Screen>
      <Text style={styles.kicker}>SOBRE O PROJETO</Text>
      <Text style={styles.title}>Voz Pública</Text>
      <Text style={styles.subtitle}>
        Transparência para acompanhar. Informação para participar.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nossa proposta</Text>
        <Text style={styles.body}>
          Facilitar o acesso a informações públicas sobre representantes,
          atuação legislativa e despesas, identificando as fontes e os limites
          de cada consulta.
        </Text>
      </View>
      <Notice
        title="Neutralidade e contexto"
        body="O app não atribui notas de desempenho político, não classifica representantes e não trata a ausência de dados como evidência de ausência de atividade."
      />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Escopo</Text>
        <Text style={styles.body}>
          Câmara: representantes, proposições, tramitações e dados relacionados.
          Senado: representantes e despesas CEAPS. CGU: consultas de despesas do
          Executivo Federal.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
