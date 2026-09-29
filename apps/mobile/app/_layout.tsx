import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTitle: "enturma.",
          headerTintColor: "#183f36",
          headerShadowVisible: false,
        }}
      />
    </>
  );
}
