import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useStyles } from "../../src/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#d8ef79",
        tabBarInactiveTintColor: styles.muted.color,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: "#0f1917",
          borderTopColor: "#2c433c",
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
            <Text style={{ color: "#9bc24b", fontSize: 21, fontWeight: "900" }}>
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
                  backgroundColor: focused ? "#233a33" : "transparent",
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
