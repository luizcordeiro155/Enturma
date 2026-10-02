import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStyles } from "../../src/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function TabLayout() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: styles.text.color,
        tabBarInactiveTintColor: styles.muted.color,
        tabBarStyle: {
          backgroundColor: styles.screen.backgroundColor,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarHideOnKeyboard: true,
        headerTitle: "enturma.",
        headerTintColor: styles.text.color,
        headerStyle: { backgroundColor: styles.screen.backgroundColor },
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
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
