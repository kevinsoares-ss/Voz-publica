import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

export type EmptyStateCardProps = {
  title: string;
  description: string;
  sourceName?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
};

export function EmptyStateCard({
  title,
  description,
  sourceName,
  actionLabel,
  onAction,
  icon = "ℹ",
}: EmptyStateCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {sourceName ? (
          <Text style={styles.source}>Fonte oficial consultada: {sourceName}</Text>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  source: {
    color: colors.muted,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  actionText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});
