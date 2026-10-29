import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export function LoadingState({ label = "Carregando informações..." }: { label?: string }) {
  return (
    <View style={styles.panel} accessibilityRole="progressbar">
      <Text style={styles.icon}>◌</Text>
      <Text style={styles.body}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.icon}>○</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={[styles.panel, styles.errorPanel]}>
      <Text style={styles.title}>Não foi possível carregar</Text>
      <Text style={styles.body}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.action}>
        <Text style={styles.actionText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

export function Notice({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    alignItems: "flex-start",
    gap: 8,
  },
  errorPanel: { borderColor: "#EBC9C6" },
  icon: { color: colors.green, fontSize: 24, fontWeight: "700" },
  title: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  action: {
    marginTop: 6,
    backgroundColor: colors.forest,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  actionText: { color: colors.white, fontWeight: "700" },
  notice: {
    backgroundColor: colors.amberBackground,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  noticeTitle: { color: colors.amber, fontWeight: "700", fontSize: 13 },
  noticeBody: { color: colors.ink, fontSize: 13, lineHeight: 19 },
});
