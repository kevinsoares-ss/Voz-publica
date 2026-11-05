import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text } from "react-native";
import { Notice } from "../../components/Feedback";
import { Screen } from "../../components/Screen";
import { colors } from "../../theme/colors";

const sourceDetails: Record<
  string,
  { name: string; url: string; coverage: string; limits: string }
> = {
  camara: {
    name: "Câmara dos Deputados — Dados Abertos",
    url: "https://dadosabertos.camara.leg.br/",
    coverage:
      "Cadastro de deputados, proposições, tramitações, votações vinculadas a proposições e despesas parlamentares.",
    limits:
      "A busca de proposições usa tipo e ano conforme a API integrada. Não há consulta geral de votações independente da proposição.",
  },
  senado: {
    name: "Senado Federal — Dados Abertos",
    url: "https://adm.senado.gov.br/adm-dadosabertos/",
    coverage: "Lista pública de senadores e registros de despesas parlamentares CEAPS.",
    limits:
      "Proposições e votações do Senado estão fora do escopo atual do aplicativo.",
  },
  cgu: {
    name: "Portal da Transparência — CGU",
    url: "https://portaldatransparencia.gov.br/",
    coverage:
      "Catálogo SIAFI de órgãos e despesas agregadas anuais do Executivo Federal.",
    limits:
      "A consulta depende de acesso configurado no serviço. Os valores são exibidos conforme a fonte, sem inferir irregularidade.",
  },
};

export default function SourceDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const source = mounted && id ? sourceDetails[id] : undefined;

  async function openSource() {
    if (!source) return;
    try {
      await Linking.openURL(source.url);
    } catch {
      Alert.alert("Fonte indisponível", "Não foi possível abrir o site da fonte.");
    }
  }

  if (!source) {
    return (
      <Screen>
        <Notice
          title={mounted ? "Fonte não encontrada" : "Carregando fonte"}
          body={
            mounted
              ? "Esta fonte não está cadastrada entre as integrações públicas do aplicativo."
              : "Aguarde enquanto carregamos os dados da fonte."
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.kicker}>FONTE DE DADOS</Text>
      <Text style={styles.title}>{source.name}</Text>
      <Text style={styles.sectionTitle}>Dados cobertos</Text>
      <Text style={styles.body}>{source.coverage}</Text>
      <Text style={styles.sectionTitle}>Limitações conhecidas</Text>
      <Text style={styles.body}>{source.limits}</Text>
      <Notice
        title="Consulta e atualização"
        body="A data de consulta é mostrada junto a cada resposta quando a fonte ou o serviço a fornece. O aplicativo não declara uma frequência fixa de atualização."
      />
      <Pressable
        accessibilityRole="link"
        onPress={() => void openSource()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Abrir site oficial ↗</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 24, lineHeight: 31, fontWeight: "800" },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  button: {
    minHeight: 46,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.white, fontWeight: "800" },
});
