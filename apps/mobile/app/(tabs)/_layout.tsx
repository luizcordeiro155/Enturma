import { Redirect, Tabs, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { api, session } from "../../src/api";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useExperience, useStyles } from "../../src/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const styles = useStyles();
  const { preference } = useExperience();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const [access, setAccess] = useState<"checking" | "allowed" | "login">("checking");

  useEffect(() => {
    let active = true;
    const verify = async () => {
      try {
        if (!(await session())) {
          if (active) setAccess("login");
          return;
        }
        await api("/users/me");
        if (active) setAccess("allowed");
      } catch (error) {
        if (active)
          setAccess(
            (error as { status?: number }).status === 401
              ? "login"
              : "checking",
          );
      }
    };
    void verify();
    return () => { active = false; };
  }, [path]);

  if (access === "login") return <Redirect href="/" />;
  if (access !== "allowed") return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: styles.accent.color,
        tabBarInactiveTintColor: styles.muted.color,
        tabBarLabelStyle: {
          fontSize: 11 * preference.fontScale,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: styles.surface.backgroundColor,
          borderTopColor: styles.border.borderColor,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarHideOnKeyboard: true,
        headerTitle: () => (
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Ionicons name="book-outline" size={24} color={styles.text.color} />
            <Text
              style={{
                marginLeft: 8,
                color: styles.text.color,
                fontSize: 21,
                fontWeight: "800",
                letterSpacing: -0.5,
              }}
            >
              enturma
            </Text>
            <Text
              style={{
                color: styles.accent.color,
                fontSize: 21,
                fontWeight: "900",
              }}
            >
              .
            </Text>
          </View>
        ),
        headerTintColor: styles.text.color,
        headerStyle: { backgroundColor: styles.screen.backgroundColor },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: styles.screen.backgroundColor },
      }}
    >
      {(
        [
          ["home", "Início", "home-outline"],
          ["rooms", "Salas", "people-outline"],
          ["community", "Comunidade", "chatbubbles-outline"],
          ["notebooks", "Cadernos", "book-outline"],
          ["profile", "Perfil", "person-outline"],
          ["more", "Mais", "menu-outline"],
        ] as const
      ).map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  minWidth: 36,
                  minHeight: 30,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: focused
                    ? styles.elevated.backgroundColor
                    : "transparent",
                }}
              >
                <Ionicons name={icon} color={color} size={size} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
