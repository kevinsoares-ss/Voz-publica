import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

export function SkeletonBox({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: {
  width?: number | `${number}%` | "auto";
  height?: number | `${number}%` | "auto";
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.rowBetween}>
        <SkeletonBox width="45%" height={14} />
        <SkeletonBox width={28} height={28} borderRadius={8} />
      </View>
      <SkeletonBox width="70%" height={26} borderRadius={6} />
      <SkeletonBox width="90%" height={12} />
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.grid}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
      <View style={styles.largeCard}>
        <View style={styles.rowBetween}>
          <SkeletonBox width="50%" height={20} />
          <SkeletonBox width={60} height={20} />
        </View>
        <SkeletonBox width="100%" height={60} borderRadius={12} />
        <SkeletonBox width="100%" height={60} borderRadius={12} />
        <SkeletonBox width="100%" height={60} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.line,
  },
  card: {
    flex: 1,
    minWidth: 155,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  largeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    marginTop: 8,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dashboardContainer: {
    gap: 16,
    width: "100%",
  },
});
