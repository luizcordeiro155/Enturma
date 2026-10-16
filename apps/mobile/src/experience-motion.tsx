import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useExperience, useResolvedDark, useStyles } from "./ui";

/** Native equivalents of the Remotion launch: no video decoder or webview required. */
export function NativeExperienceMotion() {
  const path = usePathname();
  const styles = useStyles();
  const dark = useResolvedDark();
  const { preference } = useExperience();
  const lastTheme = useRef(dark);
  const visitedRides = useRef(false);
  const theme = useRef(new Animated.Value(1)).current;
  const ride = useRef(new Animated.Value(0)).current;
  const [showRide, setShowRide] = useState(false);
  useEffect(() => {
    if (lastTheme.current === dark) return;
    lastTheme.current = dark;
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (
        !live ||
        reduced ||
        preference.reducedMotion ||
        AppState.currentState !== "active"
      )
        return;
      theme.setValue(0);
      Animated.timing(theme, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      live = false;
      theme.stopAnimation();
      theme.setValue(1);
    };
  }, [dark, preference.reducedMotion, theme]);
  useEffect(() => {
    if (path !== "/rides" || visitedRides.current) return;
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!live) return;
      visitedRides.current = true;
      if (reduced || preference.reducedMotion) return;
      ride.setValue(0);
      setShowRide(true);
      Animated.timing(ride, {
        toValue: 1,
        duration: 1550,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (live && finished) setShowRide(false);
      });
    });
    const visibility = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        ride.stopAnimation();
        setShowRide(false);
      }
    });
    return () => {
      live = false;
      ride.stopAnimation();
      setShowRide(false);
      visibility.remove();
    };
  }, [path, preference.reducedMotion, ride]);
  return (
    <>
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 9000,
          backgroundColor: styles.screen.backgroundColor,
          opacity: theme.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 0],
          }),
        }}
      />
      {showRide && (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9001,
            backgroundColor: styles.screen.backgroundColor,
            alignItems: "center",
            justifyContent: "center",
            opacity: ride.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0],
            }),
          }}
        >
          <View
            style={{
              width: 150,
              height: 130,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                transform: [
                  { perspective: 600 },
                  {
                    rotateY: ride.interpolate({
                      inputRange: [0, 0.35, 0.65, 1],
                      outputRange: ["-20deg", "0deg", "85deg", "85deg"],
                    }),
                  },
                ],
                opacity: ride.interpolate({
                  inputRange: [0, 0.4, 0.65, 1],
                  outputRange: [1, 1, 0, 0],
                }),
              }}
            >
              <Ionicons name="book-outline" size={94} color="#80d895" />
            </Animated.View>
            <Animated.View
              style={{
                position: "absolute",
                opacity: ride.interpolate({
                  inputRange: [0, 0.4, 0.65, 1],
                  outputRange: [0, 0, 1, 1],
                }),
                transform: [
                  {
                    translateX: ride.interpolate({
                      inputRange: [0, 0.5, 0.8, 1],
                      outputRange: [-30, -30, 0, 80],
                    }),
                  },
                  {
                    scale: ride.interpolate({
                      inputRange: [0, 0.5, 0.7, 1],
                      outputRange: [0.75, 0.75, 1, 1],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="car-sport-outline" size={102} color="#80d895" />
            </Animated.View>
          </View>
          <Text style={[styles.title, { fontSize: 24 }]}>
            Sua turma vai junto.
          </Text>
        </Animated.View>
      )}
    </>
  );
}
