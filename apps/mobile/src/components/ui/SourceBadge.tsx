import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

export type SourceBadgeProps = {
  sourceName: string;
  sourceType?: string;
  consultedAt?: string | null;
  year?: number | null;
  size?: "sm" | "md";
  onPress?: () => void;
};

export function SourceBadge({
  sourceName,
  sourceType,
  consultedAt,
  year,
  size = "md",
  onPress,
}: SourceBadgeProps) {
  const content = (
    <View
      style={[
        styles.badge,
        size === "sm" ? styles.badgeSm : styles.badgeMd,
        onPress ? styles.clickable : null,
      ]}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`Fonte oficial: ${sourceName}${year ? ` Ano ${year}` : ""}`}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.sealIcon} accessible={false}>
          {sourceType === "CGU_API" ? "🏛" : sourceType === "SENADO_API" ? "⚖" : "◎"}
        </Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.name, size === "sm" ? styles.nameSm : styles.nameMd]} numberOfLines={1}>
          {sourceName}
        </Text>
        {year || consultedAt ? (
          <Text style={[styles.meta, size === "sm" ? styles.metaSm : styles.metaMd]} numberOfLines={1}>
            {[
              year ? `Exercício ${year}` : null,
              consultedAt ? formatConsulted(consultedAt) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        ) : null}
      </View>
      {onPress ? <Text style={styles.arrow} accessible={false}>›</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

function formatConsulted(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return `Consultado em ${d.toLocaleDateString("pt-BR")}`;
  } catch {
    return isoString;
  }
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  badgeSm: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeMd: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  clickable: {
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sealIcon: {
    fontSize: 11,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    color: colors.ink,
    fontWeight: "700",
  },
  nameSm: {
    fontSize: 11,
  },
  nameMd: {
    fontSize: 12,
  },
  meta: {
    color: colors.muted,
  },
  metaSm: {
    fontSize: 9,
  },
  metaMd: {
    fontSize: 10,
  },
  arrow: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
