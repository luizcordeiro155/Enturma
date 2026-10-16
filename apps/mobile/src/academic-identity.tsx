import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRootNavigationState, useRouter } from "expo-router";
import { api, session } from "./api";
import { Button, useStyles } from "./ui";
export type AcademicIdentity = {
  userId: string;
  status: string;
  accessAllowed: boolean;
  institutionId: string | null;
  institutionName: string | null;
  campusId: string | null;
  campusName: string | null;
  academicEmail: string | null;
  tokenExpiresAt: string | null;
  reviewReason: string | null;
  delivery: string | null;
};

export function NativeBookMotion({ approved = false }: { approved?: boolean }) {
  const styles = useStyles();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let active = true;
    let reduced = true;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    const apply = () => {
      loop.stop();
      progress.setValue(0);
      if (active && !reduced && AppState.currentState === "active" && !approved)
        loop.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      reduced = value;
      apply();
    });
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        reduced = value;
        apply();
      },
    );
    const visibility = AppState.addEventListener("change", apply);
    return () => {
      active = false;
      loop.stop();
      motion.remove();
      visibility.remove();
    };
  }, [progress, approved]);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: 170, alignItems: "center", justifyContent: "center" }}
    >
      <View
        style={{
          width: 144,
          height: 144,
          borderRadius: 72,
          borderWidth: 1,
          borderColor: styles.muted.color,
          opacity: 0.15,
          position: "absolute",
        }}
      />
      <Animated.View
        style={{
          backgroundColor: "#d8ef79",
          borderRadius: 24,
          padding: 23,
          transform: [
            { perspective: 600 },
            {
              rotateY: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ["-12deg", "0deg", "12deg"],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.04],
              }),
            },
          ],
        }}
      >
        <Ionicons
          name={approved ? "checkmark" : "book-outline"}
          size={52}
          color="#183f36"
        />
      </Animated.View>
    </View>
  );
}

export function NativeAcademicGate() {
  const path = usePathname();
  const router = useRouter();
  const navigation = useRootNavigationState();
  const styles = useStyles();
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const publicPage = [
    "/",
    "/academic-verification",
    "/verify-academic",
  ].includes(path);
  useEffect(() => {
    if (publicPage) {
      setAllowed(false);
      return;
    }
    if (!navigation?.key) return;
    let active = true;
    const check = async () => {
      try {
        if (!(await session())) {
          if (active) {
            setAllowed(false);
            router.replace("/");
          }
          return;
        }
        const identity = await api<AcademicIdentity>("/auth/academic/status");
        if (active) {
          setAllowed(identity.accessAllowed);
          setError("");
          if (!identity.accessAllowed) router.replace("/academic-verification");
        }
      } catch (e) {
        if (active) {
          setError((e as Error).message);
          if ((e as { status?: number }).status === 401) {
            setAllowed(false);
            router.replace("/");
          }
        }
      }
    };
    void check();
    const visibility = AppState.addEventListener("change", (state) => {
      if (state === "active") void check();
    });
    return () => {
      active = false;
      visibility.remove();
    };
  }, [publicPage, path, navigation?.key, router, revision]);
  if (publicPage || allowed) return null;
  return (
    <View
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 9999,
        backgroundColor: styles.screen.backgroundColor,
        justifyContent: "center",
        padding: 28,
      }}
      accessibilityViewIsModal
    >
      <NativeBookMotion />
      <Text style={[styles.title, { textAlign: "center" }]}>enturma.</Text>
      <Text style={[styles.muted, { textAlign: "center", marginTop: 16 }]}>
        {error || "Conectando à sua comunidade…"}
      </Text>
      {error && (
        <Button
          title="Tentar novamente"
          onPress={() => setRevision((v) => v + 1)}
        />
      )}
    </View>
  );
}
