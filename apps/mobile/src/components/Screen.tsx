import type { PropsWithChildren } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

type Props = PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
}>;

export function Screen({ children, scroll = true, contentContainerStyle }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  content: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 28,
    gap: 16,
  },
  fill: { flex: 1 },
});
