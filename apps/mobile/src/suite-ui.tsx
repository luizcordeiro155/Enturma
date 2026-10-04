import { useEffect, useRef } from "react";
import { Animated, Text, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExperience, useStyles } from "./ui";

export function SuiteHero({
  icon,
  title,
  description,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const styles = useStyles();
  const { preference } = useExperience();
  const value = useRef(new Animated.Value(preference.reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (preference.reducedMotion) {
      value.setValue(1);
      return;
    }
    Animated.spring(value, {
      toValue: 1,
      useNativeDriver: true,
      tension: 58,
      friction: 9,
    }).start();
  }, [preference.reducedMotion, value]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          gap: 12,
          padding: 20,
          overflow: "hidden",
          backgroundColor: styles.elevated.backgroundColor,
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: styles.surface.backgroundColor,
            borderWidth: 1,
            borderColor: styles.border.borderColor,
          }}
        >
          <Ionicons name={icon} size={23} color={styles.text.color} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.title, { fontSize: 24, lineHeight: 29 }]}>
            {title}
          </Text>
          <Text style={styles.muted}>{description}</Text>
        </View>
      </View>
      {children}
    </Animated.View>
  );
}

export function SuiteSection({
  icon,
  title,
  description,
  children,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.card, { gap: 12 }, style]}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        {icon ? (
          <Ionicons name={icon} size={21} color={styles.text.color} />
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.label, { marginBottom: 0, fontSize: 16 }]}>
            {title}
          </Text>
          {description ? <Text style={styles.muted}>{description}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export function SuiteStats({
  items,
}: {
  items: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }[];
}) {
  const styles = useStyles();
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[
            styles.row,
            {
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 13,
              paddingHorizontal: 14,
            },
          ]}
        >
          <Ionicons name={item.icon} size={20} color={styles.text.color} />
          <View style={{ flex: 1 }}>
            <Text style={styles.muted}>{item.label}</Text>
            <Text style={[styles.label, { marginBottom: 0, fontSize: 17 }]}>
              {item.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
