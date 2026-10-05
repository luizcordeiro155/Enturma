import { Animated } from "react-native";
import { useEffect, useMemo, useRef } from "react";
import { useExperience } from "./ui";

export function useRideEntrance(index = 0) {
  const { preference } = useExperience();
  const value = useRef(new Animated.Value(preference.reducedMotion ? 1 : 0)).current;
  useEffect(() => {
    value.stopAnimation();
    if (preference.reducedMotion) {
      value.setValue(1);
      return;
    }
    value.setValue(0);
    const timer = setTimeout(
      () =>
        Animated.spring(value, {
          toValue: 1,
          damping: 18,
          stiffness: 170,
          mass: 0.8,
          useNativeDriver: true,
        }).start(),
      Math.min(index * 45, 220),
    );
    return () => clearTimeout(timer);
  }, [index, preference.reducedMotion, value]);
  return useMemo(
    () => ({
      opacity: value,
      transform: [
        {
          translateY: value.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 0],
          }),
        },
        {
          scale: value.interpolate({
            inputRange: [0, 1],
            outputRange: [0.985, 1],
          }),
        },
      ],
    }),
    [value],
  );
}

export function useRideActionMotion() {
  const { preference } = useExperience();
  const value = useRef(new Animated.Value(1)).current;
  const pulse = () => {
    value.stopAnimation();
    if (preference.reducedMotion) {
      value.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.timing(value, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(value, {
        toValue: 1.025,
        damping: 14,
        stiffness: 220,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.spring(value, {
        toValue: 1,
        damping: 18,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  };
  return { pulse, style: { transform: [{ scale: value }] } };
}
