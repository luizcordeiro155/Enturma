import { useEffect, useRef, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Image,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  profileColor,
  profileContrast,
  type ProfileVisualAppearance,
  type Profile,
} from "@enturma/contracts";
import { base } from "./api";
import { useExperience, useStyles } from "./ui";

export function NativeProfileEntrance({
  appearance,
  children,
}: {
  appearance?: ProfileVisualAppearance;
  children: ReactNode;
}) {
  const {preference}=useExperience();
  const progress = useRef(new Animated.Value(1)).current;
  // A single understated entrance is shared by all profiles.
  const mode = "RISE";
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (
        !live ||
        reduced || preference.reducedMotion ||
        AppState.currentState !== "active"
      )
        return;
      progress.setValue(0);
      Animated.spring(progress, {
        toValue: 1,
        damping: 19,
        stiffness: 160,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      live = false;
      progress.stopAnimation();progress.setValue(1);
    };
  }, [mode, progress, preference.reducedMotion]);
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          { perspective: 900 },
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [mode === "RISE" ? 20 : 0, 0],
            }),
          },
          {
            rotateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [mode === "BOOK" ? "-24deg" : "0deg", "0deg"],
            }),
          },
          {
            rotate: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [mode === "ORBIT" ? "-4deg" : "0deg", "0deg"],
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.96, 1],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function NativeProfileSurface({
  primary,
  appearance,
  mural = false,
  children,
}: {
  primary: string;
  appearance?: ProfileVisualAppearance;
  mural?: boolean;
  children: ReactNode;
}) {
  const styles = useStyles();
  const {preference}=useExperience();
  const motion = useRef(new Animated.Value(0)).current;
  const flow =
    !preference.reducedMotion && (appearance?.gradientFlow === "FLOW" || appearance?.effect === "AURORA");
  useEffect(() => {
    if (!flow) return;
    let reduced = true,
      active = AppState.currentState === "active",
      disposed = false;
    let loop: Animated.CompositeAnimation | undefined;
    const sync = () => {
      loop?.stop();
      if (disposed || reduced || !active) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(motion, {
            toValue: 1,
            duration: 9000,
            useNativeDriver: true,
          }),
          Animated.timing(motion, {
            toValue: 0,
            duration: 9000,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    };
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      reduced = value;
      sync();
    });
    const setting = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        reduced = value;
        sync();
      },
    );
    const state = AppState.addEventListener("change", (value) => {
      active = value === "active";
      sync();
    });
    return () => {
      disposed = true;
      loop?.stop();
      setting.remove();
      state.remove();
    };
  }, [flow, motion]);
  const plain = mural && appearance?.muralMode === "DEFAULT";
  const first = profileColor(
    mural && appearance?.muralMode === "CUSTOM"
      ? appearance.muralColor
      : primary,
  );
  const second = profileColor(
    mural && appearance?.muralMode === "CUSTOM"
      ? appearance.muralSecondaryColor
      : appearance?.theme === "GRADIENT"
        ? appearance.secondaryColor
        : first,
    first,
  );
  const radians = ((appearance?.gradientAngle ?? 155) * Math.PI) / 180;
  return (
    <View
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        backgroundColor: styles.card.backgroundColor,
        padding: 18,
      }}
    >
      {!plain ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -100,
            bottom: -100,
            left: -100,
            right: -100,
            transform: [
              {
                translateX: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-25, 25],
                }),
              },
              {
                rotate: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-6deg", "6deg"],
                }),
              },
            ],
          }}
        >
          <LinearGradient
            colors={[first, second]}
            start={{
              x: 0.5 - Math.sin(radians) / 2,
              y: 0.5 + Math.cos(radians) / 2,
            }}
            end={{
              x: 0.5 + Math.sin(radians) / 2,
              y: 0.5 - Math.cos(radians) / 2,
            }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}

export function NativeProfilePreview({
  profile,
  appearance,
  token,
  version,
}: {
  profile: Pick<
    Profile,
    | "id"
    | "name"
    | "username"
    | "bio"
    | "accentColor"
    | "hasAvatar"
    | "hasBanner"
    | "profileDetails"
  >;
  appearance?: ProfileVisualAppearance;
  token: string;
  version: number;
}) {
  const primary = profileColor(profile.accentColor);
  const contrast = profileContrast(
    primary,
    appearance?.theme === "GRADIENT"
      ? profileColor(appearance.secondaryColor, primary)
      : primary,
  );
  return (
    <NativeProfileEntrance appearance={appearance}>
      <View
        accessibilityLabel="Prévia ao vivo do perfil"
        style={{ borderRadius: 18, overflow: "hidden" }}
      >
        {profile.hasBanner ? (
          <Image
            source={{
              uri: `${base}/users/${profile.id}/banner?v=${version}`,
              headers: { Authorization: `Bearer ${token}` },
            }}
            style={{ height: 120, width: "100%" }}
          />
        ) : null}
        <NativeProfileSurface primary={primary} appearance={appearance}>
          {profile.hasAvatar ? (
            <Image
              source={{
                uri: `${base}/users/${profile.id}/avatar?v=${version}`,
                headers: { Authorization: `Bearer ${token}` },
              }}
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                marginBottom: 12,
                borderWidth: 3,
                borderColor: primary,
              }}
            />
          ) : null}
          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: contrast.panel,
              gap: 6,
            }}
          >
            <Text
              style={{ fontSize: 24, fontWeight: "800", color: contrast.ink }}
            >
              {profile.name}
            </Text>
            <Text style={{ color: contrast.ink }}>
              @{profile.username} {profile.profileDetails?.pronouns}
            </Text>
            <Text style={{ color: contrast.ink }}>
              {profile.bio || "Estudando em companhia."}
            </Text>
            {profile.profileDetails?.statusText ? (
              <Text style={{ color: contrast.ink }}>
                {profile.profileDetails.statusText}
              </Text>
            ) : null}
          </View>
        </NativeProfileSurface>
      </View>
    </NativeProfileEntrance>
  );
}
