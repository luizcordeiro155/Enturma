import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  View,
  type TextInputProps,
} from "react-native";
import { colors } from "@enturma/design-tokens";
export const styles = StyleSheet.create({
  screen: {
    padding: 24,
    paddingBottom: 60,
    gap: 20,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: colors.text,
  },
  text: { fontSize: 16, lineHeight: 24, color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.text,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  row: {
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  error: { color: colors.danger, fontSize: 15 },
  label: { fontWeight: "600", color: colors.text, marginBottom: 8 },
});
export function Screen({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </ScrollView>
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
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} style={styles.input} {...props} />
    </View>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  ) : null;
}
