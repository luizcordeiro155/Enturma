import {
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  FlatList,
  View,
  type TextInputProps,
} from "react-native";
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ExperiencePreference } from "@enturma/contracts";
import { api, session } from "./api";
import { usePathname } from "expo-router";

const darkPalette = {
  background: "#0f1917",
  surface: "#14211e",
  elevated: "#182925",
  text: "#f5f8f6",
  muted: "#aebdb7",
  border: "#2c433c",
  accent: "#d8ef79",
  accentInk: "#173f36",
  danger: "#ffb7b7",
};

const lightPalette = {
  background: "#f4f7f5",
  surface: "#ffffff",
  elevated: "#eef3ef",
  text: "#183f36",
  muted: "#6d7f78",
  border: "#d4ded9",
  accent: "#183f36",
  accentInk: "#ffffff",
  danger: "#b42318",
};

const createStyles = (
  dark: boolean,
  fontScale: number,
  highContrast: boolean,
) => {
  const palette = dark ? darkPalette : lightPalette;
  const border = highContrast ? palette.text : palette.border;
  const muted = highContrast ? palette.text : palette.muted;
  return StyleSheet.create({
    screen: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 72,
      gap: 16,
      backgroundColor: palette.background,
      flexGrow: 1,
    },
    title: {
      fontSize: 30 * fontScale,
      lineHeight: 36 * fontScale,
      fontWeight: "800",
      letterSpacing: -0.8,
      color: palette.text,
    },
    text: {
      fontSize: 16 * fontScale,
      lineHeight: 24 * fontScale,
      color: palette.text,
    },
    muted: {
      fontSize: 14 * fontScale,
      lineHeight: 20 * fontScale,
      color: muted,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16 * fontScale,
      color: palette.text,
      backgroundColor: palette.surface,
    },
    button: {
      minHeight: 48,
      backgroundColor: palette.accent,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: palette.accentInk,
      fontWeight: "800",
      fontSize: 15 * fontScale,
      lineHeight: 20 * fontScale,
    },
    row: {
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 14,
      backgroundColor: palette.surface,
    },
    error: {
      color: palette.danger,
      fontSize: 14 * fontScale,
      lineHeight: 20 * fontScale,
    },
    success: {
      color: dark ? "#b8f5c8" : "#176b35",
      fontSize: 14 * fontScale,
      lineHeight: 20 * fontScale,
    },
    warning: {
      color: dark ? "#ffe08a" : "#8a5a00",
      fontSize: 14 * fontScale,
      lineHeight: 20 * fontScale,
    },
    label: {
      fontWeight: "700",
      color: palette.text,
      marginBottom: 8,
      fontSize: 14 * fontScale,
      lineHeight: 20 * fontScale,
    },
    card: {
      padding: 16,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 14,
      backgroundColor: palette.surface,
    },
    surface: { backgroundColor: palette.surface },
    elevated: { backgroundColor: palette.elevated },
    accent: { color: palette.accent },
    border: { borderColor: border },
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
  const syncGeneration = useRef(0);

  useEffect(() => {
    let live = true;
    const request = ++syncGeneration.current;
    void (async () => {
      try {
        const cached = await SecureStore.getItemAsync("enturma_experience");
        if (live && request === syncGeneration.current && cached) {
          try {
            setPreference({ ...defaults, ...JSON.parse(cached) });
          } catch {
            await SecureStore.deleteItemAsync("enturma_experience").catch(
              () => {},
            );
          }
        }
        const credentials = await session();
        if (!credentials) {
          if (live && request === syncGeneration.current) setPreference(defaults);
          return;
        }
        const remote = await api<ExperiencePreference>("/users/me/experience");
        if (!live || request !== syncGeneration.current) return;
        const resolved = { ...defaults, ...remote };
        setPreference(resolved);
        await SecureStore.setItemAsync(
          "enturma_experience",
          JSON.stringify(resolved),
        );
      } catch {}
    })();
    return () => {
      live = false;
    };
  }, [pathname]);

  async function save(p: ExperiencePreference) {
    syncGeneration.current++;
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

export function useResolvedDark() {
  const { preference: p } = useExperience();
  const native = useColorScheme();
  return p.theme === "DARK" || (p.theme === "SYSTEM" && native === "dark");
}

export function useStyles() {
  const { preference: p } = useExperience();
  const dark = useResolvedDark();
  return useMemo(
    () => createStyles(dark, p.fontScale, p.highContrast),
    [dark, p.fontScale, p.highContrast],
  );
}

function flattenScreenChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (isValidElement(child) && child.type === Fragment) {
      return flattenScreenChildren(
        (child.props as { children?: ReactNode }).children,
      );
    }
    return [child];
  });
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
      <FlatList
        data={flattenScreenChildren(children)}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item }) => item as React.ReactElement}
        contentContainerStyle={[
          styles.screen,
          { paddingBottom: Math.max(92, insets.bottom + 74) },
        ]}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        ListHeaderComponent={
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        }
      />
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
  const { preference } = useExperience();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? { opacity: 0.5 } : {},
        pressed && !disabled
          ? {
              opacity: 0.86,
              ...(preference.reducedMotion
                ? {}
                : { transform: [{ scale: 0.99 }] }),
            }
          : {},
      ]}
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

export function FeedbackMessage({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "success" | "warning";
}) {
  const styles = useStyles();
  if (!message) return null;
  const textStyle =
    tone === "success"
      ? styles.success
      : tone === "warning"
        ? styles.warning
        : styles.error;
  return (
    <View style={[styles.card, { borderColor: textStyle.color }]}>
      <Text
        accessibilityRole={tone === "error" ? "alert" : "text"}
        accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
        style={textStyle}
      >
        {message}
      </Text>
    </View>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return <FeedbackMessage message={message} tone="error" />;
}
