import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NativeCallProvider } from "../src/native-call";
import { MobileThemeProvider, useResolvedDark, useStyles } from "../src/ui";
function Navigation() {
  const styles = useStyles();
  const dark = useResolvedDark();
  return (
    <NativeCallProvider>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTitle: "enturma.",
          headerTintColor: styles.text.color,
          headerStyle: { backgroundColor: styles.screen.backgroundColor },
          contentStyle: { backgroundColor: styles.screen.backgroundColor },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </NativeCallProvider>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <MobileThemeProvider>
        <Navigation />
      </MobileThemeProvider>
    </SafeAreaProvider>
  );
}
