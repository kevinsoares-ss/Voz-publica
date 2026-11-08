import { DynamicColorIOS, Platform } from "react-native";

const darkPalette: Record<string, string> = {
  navy: "#0D1420",
  "navy-surface": "#172233",
  primary: "#79A9F2",
  "primary-pressed": "#91B8F4",
  "on-primary": "#0D1420",
  "primary-light": "#22344D",
  teal: "#62C4B5",
  "teal-light": "#1D3939",
  gold: "#E3BD70",
  "gold-light": "#3A3327",
  ink: "#F4F7FB",
  paper: "#0D1420",
  white: "#FFFFFF",
  surface: "#172233",
  line: "#2B3B50",
  muted: "#AAB7C7",
  red: "#F08A83",
};

const variable = (name: string, fallback: string) => {
  if (Platform.OS === "web") return `var(--vp-${name}, ${fallback})`;
  if (Platform.OS === "ios") {
    return DynamicColorIOS({
      light: fallback,
      dark: darkPalette[name] ?? fallback,
    });
  }
  return fallback;
};

export const colors = {
  navy: variable("navy", "#101C2C"),
  navySurface: variable("navy-surface", "#17263A"),
  primary: variable("primary", "#2457A7"),
  primaryPressed: variable("primary-pressed", "#326BC2"),
  onPrimary: variable("on-primary", "#FFFFFF"),
  primaryLight: variable("primary-light", "#EAF1FB"),
  teal: variable("teal", "#167C78"),
  tealLight: variable("teal-light", "#E5F4F1"),
  gold: variable("gold", "#A87524"),
  goldLight: variable("gold-light", "#F8F0DF"),
  ink: variable("ink", "#17202B"),
  forest: variable("primary", "#2457A7"),
  green: variable("primary-pressed", "#326BC2"),
  mint: variable("primary-light", "#EAF1FB"),
  paper: variable("paper", "#F3F5F8"),
  white: "#FFFFFF",
  surface: variable("surface", "#FFFFFF"),
  line: variable("line", "#D8DEE7"),
  muted: variable("muted", "#4B5868"),
  amber: variable("gold", "#A87524"),
  amberBackground: variable("gold-light", "#F8F0DF"),
  red: variable("red", "#A63C37"),
  shadow: variable("navy", "#101C2C"),
};

export type ColorTokens = typeof colors;
