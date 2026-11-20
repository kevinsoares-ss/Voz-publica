import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../../theme/colors";

export type InitialLoaderProps = {
  isReady: boolean;
  onFinish?: () => void;
};

const LOADING_STEPS = [
  "Iniciando portal de transparência...",
  "Conectando aos dados da Câmara e Senado...",
  "Consultando despesas públicas da CGU...",
  "Sincronizando indicadores do painel...",
];

export function InitialLoader({ isReady, onFinish }: InitialLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0.15)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  // Pulse & glow loop
  useEffect(() => {
    const isWeb = Platform.OS === "web";
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 1100,
            useNativeDriver: !isWeb,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.98,
            duration: 1100,
            useNativeDriver: !isWeb,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: !isWeb,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: !isWeb,
          }),
        ]),
      ]),
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, glowAnim]);

  // Step cycling while loading
  useEffect(() => {
    if (isReady) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isReady]);

  // Progress animation based on loading state
  useEffect(() => {
    const isWeb = Platform.OS === "web";
    if (!isReady) {
      Animated.timing(progressAnim, {
        toValue: 0.75,
        duration: 2500,
        useNativeDriver: false,
      }).start();
    } else {
      // Data ready -> complete to 100% and fade out
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeOutAnim, {
            toValue: 0,
            duration: 450,
            useNativeDriver: !isWeb,
          }).start(() => {
            setHasCompleted(true);
            onFinish?.();
          });
        }, 200);
      });
    }
  }, [isReady, onFinish, progressAnim, fadeOutAnim]);

  if (hasCompleted) return null;

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0],
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeOutAnim,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando dados do Voz Pública"
    >
      <View style={styles.centerContainer}>
        {/* Animated Brand Mark Container with Pulse & Glow */}
        <View style={styles.logoWrapper}>
          <Animated.View
            style={[
              styles.glowRing,
              {
                transform: [{ scale: glowScale }],
                opacity: glowOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.brandMark,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.brandGlyph}>V</Text>
          </Animated.View>
        </View>

        {/* Brand Name & Tagline */}
        <View style={styles.textGroup}>
          <View style={styles.kickerPill}>
            <Text style={styles.kickerText}>TRANSPARÊNCIA PÚBLICA</Text>
          </View>
          <Text style={styles.brandTitle}>Voz Pública</Text>
          <Text style={styles.brandSubtitle}>
            Informação pública, com fonte oficial e auditável.
          </Text>
        </View>

        {/* Smooth Animated Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressBarWidth,
                },
              ]}
            />
          </View>

          {/* Dynamic loading text */}
          <Text style={styles.loadingMessage}>
            {isReady ? "Painel pronto!" : LOADING_STEPS[stepIndex]}
          </Text>
        </View>
      </View>

      {/* Footer provenance notice */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerSeal}>⚖ · 🏛 · 🏢</Text>
        <Text style={styles.footerText}>
          Câmara dos Deputados · Senado Federal · CGU
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: "#0B1320",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 400,
    width: "100%",
    gap: 22,
  },
  logoWrapper: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  glowRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
  brandMark: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#16253B",
    borderWidth: 1.5,
    borderColor: "rgba(121, 169, 242, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  brandGlyph: {
    color: colors.white,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1,
  },
  textGroup: {
    alignItems: "center",
    gap: 8,
  },
  kickerPill: {
    backgroundColor: "rgba(121, 169, 242, 0.14)",
    borderColor: "rgba(121, 169, 242, 0.28)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  kickerText: {
    color: "#8CB5F4",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    color: "#A2B6CF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  progressTrack: {
    width: "70%",
    maxWidth: 240,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.teal,
    borderRadius: 3,
  },
  loadingMessage: {
    color: "#CAD8E8",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    minHeight: 18,
  },
  footerContainer: {
    position: "absolute",
    bottom: 28,
    alignItems: "center",
    gap: 4,
  },
  footerSeal: {
    fontSize: 14,
    opacity: 0.7,
  },
  footerText: {
    color: "#6D839E",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
