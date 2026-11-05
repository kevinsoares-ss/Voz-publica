import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { ErrorState, Notice } from "../components/Feedback";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

const issueUrl = "https://github.com/kevinsoares-ss/Voz-publica/issues";

export default function HelpScreen() {
  const [error, setError] = useState("");

  async function reportIssue() {
    try {
      await Linking.openURL(issueUrl);
      setError("");
    } catch {
      setError("Não foi possível abrir a página de reporte.");
    }
  }

  return (
    <Screen>
      <Text style={styles.kicker}>AJUDA E SUPORTE</Text>
      <Text style={styles.title}>Como podemos ajudar?</Text>
      <Text style={styles.subtitle}>
        Entenda os resultados, as fontes e os limites das consultas públicas.
      </Text>
      <HelpItem
        question="O que significa uma lista vazia?"
        answer="A fonte não retornou registros para os filtros usados. Isso não significa necessariamente que o valor seja zero ou que não exista atividade."
      />
      <HelpItem
        question="Uma despesa registrada indica irregularidade?"
        answer="Não. O aplicativo não presume finalidade ou irregularidade a partir de um registro. Consulte os documentos e o contexto na fonte oficial."
      />
      <HelpItem
        question="De onde vêm os dados?"
        answer="As fontes integradas são a Câmara dos Deputados, o Senado Federal (representantes e CEAPS) e o Portal da Transparência da CGU. A tela Fontes e metodologia descreve a cobertura."
      />
      <HelpItem
        question="O Voz Pública oferece dados do Senado sobre proposições?"
        answer="Não. Proposições e votações do Senado não fazem parte do escopo atual. A consulta legislativa disponível é da Câmara dos Deputados."
      />
      <HelpItem
        question="Como os favoritos são armazenados?"
        answer="Os favoritos ficam apenas no armazenamento local deste aparelho/navegador e não exigem cadastro."
      />
      <Notice
        title="Canal de reporte"
        body="Não há endereço de atendimento configurado no aplicativo. O reporte de falhas pode ser enviado pela página pública de issues do projeto."
      />
      {error ? <ErrorState message={error} onRetry={() => void reportIssue()} /> : null}
      <Pressable
        accessibilityRole="link"
        onPress={() => void reportIssue()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Reportar um problema ↗</Text>
      </Pressable>
    </Screen>
  );
}

function HelpItem({ question, answer }: { question: string; answer: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.answer}>{answer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 15,
    gap: 7,
  },
  question: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  answer: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  button: {
    minHeight: 46,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.white, fontWeight: "800" },
});
