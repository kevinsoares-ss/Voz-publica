import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

export type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
  badge?: string;
  badgeVariant?: "primary" | "teal" | "gold" | "muted";
  onPress?: () => void;
  onHide?: () => void;
  accessibilityLabel?: string;
};

export function StatCard({
  label,
  value,
  description,
  icon,
  badge,
  badgeVariant = "primary",
  onPress,
  onHide,
  accessibilityLabel,
}: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.labelContainer}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <View style={styles.topRightActions}>
          {icon ? (
            <View style={styles.iconCircle}>
              <Text style={styles.iconText} accessible={false}>
                {icon}
              </Text>
            </View>
          ) : null}
          {onHide ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ocultar card ${label}`}
              onPress={onHide}
              hitSlop={8}
              style={({ pressed }) => [styles.hideBtn, pressed && styles.pressed]}
            >
              <Text style={styles.hideBtnText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityRole={onPress ? "button" : "text"}
        accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.clickableArea, pressed && onPress && styles.pressed]}
      >
        <View style={styles.valueRow}>
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
        </View>

        {description || badge ? (
          <View style={styles.bottomRow}>
            {badge ? (
              <View
                style={[
                  styles.badge,
                  badgeVariant === "teal"
                    ? styles.badgeTeal
                    : badgeVariant === "gold"
                      ? styles.badgeGold
                      : badgeVariant === "muted"
                        ? styles.badgeMuted
                        : styles.badgePrimary,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    badgeVariant === "teal"
                      ? styles.badgeTextTeal
                      : badgeVariant === "gold"
                        ? styles.badgeTextGold
                        : badgeVariant === "muted"
                          ? styles.badgeTextMuted
                          : styles.badgeTextPrimary,
                  ]}
                >
                  {badge}
                </Text>
              </View>
            ) : null}
            {description ? (
              <Text style={styles.description} numberOfLines={2}>
                {description}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    minHeight: 120,
    justifyContent: "space-between",
  },
  clickableArea: {
    gap: 8,
    flex: 1,
    justifyContent: "space-between",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hideBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  hideBtnText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 13,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  valueRow: {
    marginVertical: 2,
  },
  value: {
    color: colors.ink,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePrimary: {
    backgroundColor: colors.primaryLight,
  },
  badgeTeal: {
    backgroundColor: colors.tealLight,
  },
  badgeGold: {
    backgroundColor: colors.goldLight,
  },
  badgeMuted: {
    backgroundColor: colors.paper,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeTextPrimary: {
    color: colors.primary,
  },
  badgeTextTeal: {
    color: colors.teal,
  },
  badgeTextGold: {
    color: colors.gold,
  },
  badgeTextMuted: {
    color: colors.muted,
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
