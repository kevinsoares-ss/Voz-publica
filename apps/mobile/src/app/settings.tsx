import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ErrorState, Notice } from "../components/Feedback";
import { Screen } from "../components/Screen";
import { clearFavorites } from "../services/favorites";
import { colors } from "../theme/colors";
import { useTheme, type ThemePreference } from "../theme/ThemeProvider";

export default function SettingsScreen() {
  const { preference, setPreference, isDark } = useTheme();
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  async function changePreference(next: ThemePreference) {
    try {
      await setPreference(next);
      setError("");
    } catch {
      setError("Não foi possível salvar a preferência de aparência.");
    }
  }

  async function clearLocalData() {
    try {
      await clearFavorites();
      await setPreference("system");
      setConfirmClear(false);
      setError("");
    } catch {
      setError("Não foi possível limpar as preferências locais.");
    }
  }

  return (
    <Screen>
      <Text style={styles.kicker}>APLICATIVO</Text>
      <Text style={styles.title}>Acessibilidade e preferências</Text>
      <Text style={styles.subtitle}>
        Preferências básicas para consultar informações públicas.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aparência</Text>
        <Text style={styles.body}>
          Escolha o tema claro, escuro ou acompanhe a preferência do sistema.
        </Text>
        {([
          ["system", "Seguir o sistema"],
          ["light", "Claro"],
          ["dark", "Escuro"],
        ] as const).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: preference === value }}
            onPress={() => void changePreference(value)}
            style={styles.option}
          >
            <View style={[styles.radio, preference === value && styles.radioSelected]} />
            <Text style={styles.optionLabel}>{label}</Text>
            <Text style={styles.optionState}>
              {preference === value ? "Selecionado" : ""}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Texto e recursos assistivos</Text>
        <Text style={styles.body}>
          O app respeita a ampliação e as preferências de texto configuradas
          no dispositivo ou navegador. Os controles têm rótulos para leitores
          de tela e foco visível na Web.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacidade e dados locais</Text>
        <Text style={styles.body}>
          As consultas públicas não exigem conta. Favoritos e aparência são
          armazenados localmente neste aparelho ou navegador.
        </Text>
        {confirmClear ? (
          <View style={styles.confirmBox}>
            <Text style={styles.body}>
              Isso removerá favoritos salvos neste aparelho e redefinirá a
              aparência para seguir o sistema. Deseja continuar?
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmClear(false)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void clearLocalData()}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Limpar dados locais</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmClear(true)}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Limpar dados locais</Text>
          </Pressable>
        )}
      </View>
      <Notice
        title="Movimento e contraste"
        body="Não há animações essenciais à navegação. O contraste é reforçado por texto e rótulos, não apenas por cor; ampliação adicional pode ser feita pelas opções do sistema."
      />
      {error ? <ErrorState message={error} onRetry={() => void changePreference(preference)} /> : null}
      <Text style={styles.version}>
        Voz Pública · tema {isDark ? "escuro" : "claro"} · versão 1.0.0
      </Text>
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
    gap: 7,
  },
  option: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderColor: colors.muted,
    borderWidth: 1.5,
  },
  radioSelected: { borderWidth: 5, borderColor: colors.primary },
  optionLabel: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: "700" },
  optionState: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  confirmBox: { gap: 10, paddingTop: 8 },
  confirmActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderColor: colors.line,
    borderWidth: 1,
  },
  secondaryButtonText: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.onPrimary, fontSize: 12, fontWeight: "800" },
  clearButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  clearButtonText: { color: colors.red, fontSize: 12, fontWeight: "800" },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  version: { color: colors.muted, fontSize: 12, textAlign: "center", paddingVertical: 8 },
});
