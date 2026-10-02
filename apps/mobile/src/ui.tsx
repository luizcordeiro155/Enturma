import {
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  View,
  type TextInputProps,
} from "react-native";
import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ExperiencePreference } from "@enturma/contracts";
import { api, session } from "./api";
import { usePathname } from "expo-router";
import { colors } from "@enturma/design-tokens";
const createStyles = (
  dark: boolean,
  fontScale: number,
  highContrast: boolean,
) => {
  const palette = dark
    ? {
        ...colors,
        background: "#101819",
        text: "#f2f6f3",
        muted: "#b4c5be",
        border: highContrast ? "#edf7ef" : "#41534c",
        danger: "#ffb7b7",
      }
    : { ...colors, border: highContrast ? "#183f36" : colors.border };
  return StyleSheet.create({
    screen: {
      padding: 24,
      paddingBottom: 60,
      gap: 20,
      backgroundColor: palette.background,
      flexGrow: 1,
    },
    title: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: "700",
      color: palette.text,
    },
    text: { fontSize: 16 * fontScale, lineHeight: 24, color: palette.text },
    muted: { fontSize: 14 * fontScale, color: palette.muted },
    input: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 10,
      padding: 14,
      fontSize: 16 * fontScale,
      color: palette.text,
    },
    button: {
      backgroundColor: dark ? "#d8ef79" : "#183f36",
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
    },
    buttonText: {
      color: dark ? "#183f36" : "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
    row: {
      padding: 18,
      gap: 10,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 10,
    },
    error: { color: palette.danger, fontSize: 15 },
    label: { fontWeight: "600", color: palette.text, marginBottom: 8 },
  });
};
const defaults: ExperiencePreference = {
  theme: "SYSTEM",
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  enhancedFocus: true,
};
const ThemeContext = createContext({
  preference: defaults,
  save: async (_p: ExperiencePreference) => {},
});
export function MobileThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preference, setPreference] = useState(defaults);
  const pathname = usePathname();
  useEffect(() => {
    let live = true;
    void session()
      .then(async (credentials) => {
        if (!credentials) {
          if (live) setPreference(defaults);
          return;
        }
        const p = await api<ExperiencePreference>("/users/me/experience");
        if (live) {
          setPreference({ ...defaults, ...p });
          await SecureStore.setItemAsync(
            "enturma_experience",
            JSON.stringify(p),
          );
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [pathname]);
  useEffect(() => {
    SecureStore.getItemAsync("enturma_experience")
      .then((v) => {
        if (v) setPreference({ ...defaults, ...JSON.parse(v) });
      })
      .catch(() => {});
  }, []);
  async function save(p: ExperiencePreference) {
    await api("/users/me/experience", {
      method: "PUT",
      body: JSON.stringify(p),
    });
    await SecureStore.setItemAsync("enturma_experience", JSON.stringify(p));
    setPreference(p);
  }
  return (
    <ThemeContext.Provider value={{ preference, save }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useExperience() {
  return useContext(ThemeContext);
}
export function useStyles() {
  const { preference: p } = useExperience();
  const native = useColorScheme();
  return createStyles(
    p.theme === "DARK" || (p.theme === "SYSTEM" && native === "dark"),
    p.fontScale,
    p.highContrast,
  );
}
export function Screen({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: styles.screen.backgroundColor }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        contentContainerStyle={[
          styles.screen,
          { paddingBottom: Math.max(70, insets.bottom + 50) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled ? { opacity: 0.5 } : {}]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const styles = useStyles();
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={styles.input}
        placeholderTextColor={styles.muted.color}
        {...props}
      />
    </View>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  const styles = useStyles();
  return message ? (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  ) : null;
}
