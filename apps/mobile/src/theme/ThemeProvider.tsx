import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { Appearance, Platform, useColorScheme } from "react-native";

export type ThemePreference = "system" | "light" | "dark";

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  isDark: boolean;
};

const STORAGE_KEY = "@voz-publica/theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const lightVariables: Record<string, string> = {
  navy: "#101C2C",
  "navy-surface": "#17263A",
  primary: "#2457A7",
  "primary-pressed": "#326BC2",
  "primary-light": "#EAF1FB",
  teal: "#167C78",
  "teal-light": "#E5F4F1",
  gold: "#A87524",
  "gold-light": "#F8F0DF",
  ink: "#17202B",
  paper: "#F3F5F8",
  white: "#FFFFFF",
  line: "#D8DEE7",
  muted: "#4B5868",
  red: "#A63C37",
};

const darkVariables: Record<string, string> = {
  navy: "#0D1420",
  "navy-surface": "#172233",
  primary: "#79A9F2",
  "primary-pressed": "#91B8F4",
  "primary-light": "#22344D",
  teal: "#62C4B5",
  "teal-light": "#1D3939",
  gold: "#E3BD70",
  "gold-light": "#3A3327",
  ink: "#F4F7FB",
  paper: "#0D1420",
  white: "#172233",
  line: "#2B3B50",
  muted: "#AAB7C7",
  red: "#F08A83",
};

function applyWebTheme(isDark: boolean) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const variables = isDark ? darkVariables : lightVariables;
  for (const [name, value] of Object.entries(variables)) {
    document.documentElement.style.setProperty(`--vp-${name}`, value);
  }
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const isDark =
    preference === "dark" || (preference === "system" && systemScheme === "dark");

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (
        active &&
        (value === "system" || value === "light" || value === "dark")
      ) {
        setPreferenceState(value);
      }
    }).catch((error: unknown) => {
      console.error("Could not load appearance preference", error);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    applyWebTheme(isDark);
    if (Platform.OS !== "web") {
      Appearance.setColorScheme(
        preference === "system" ? "unspecified" : preference,
      );
    }
  }, [isDark, preference]);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    await AsyncStorage.setItem(STORAGE_KEY, nextPreference);
    if (Platform.OS !== "web") {
      Appearance.setColorScheme(
        nextPreference === "system" ? "unspecified" : nextPreference,
      );
    }
    setPreferenceState(nextPreference);
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference, isDark }),
    [preference, setPreference, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return value;
}
