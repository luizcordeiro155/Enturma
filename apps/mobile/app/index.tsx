import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

const ENTURMA_ORIGIN = "https://enturma-flax.vercel.app";
const APP_VERSION = "0.3.4";

export default function EnturmaApp() {
  const web = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const [canGoBack, setCanGoBack] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      web.current?.goBack();
      return true;
    });
    return () => listener.remove();
  }, [canGoBack]);

  const allow = useCallback((request: WebViewNavigation) => {
    try {
      const url = new URL(request.url);
      if (
        url.protocol === "about:" ||
        (url.protocol === "https:" && url.origin === ENTURMA_ORIGIN)
      )
        return true;

      if (url.protocol === "http:" || url.protocol === "https:") {
        void Linking.openURL(request.url);
        return false;
      }

      if (["mailto:", "tel:", "enturma:"].includes(url.protocol)) {
        void Linking.openURL(request.url);
        return false;
      }
    } catch {}
    return false;
  }, []);

  if (failed) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0f1917",
          justifyContent: "center",
          padding: 28,
          gap: 16,
        }}
      >
        <Text style={{ color: "#f5f8f6", fontSize: 28, fontWeight: "800" }}>
          enturma<Text style={{ color: "#9bc24b" }}>.</Text>
        </Text>
        <Text style={{ color: "#aebdb7", fontSize: 16, lineHeight: 24 }}>
          Não foi possível carregar o Enturma agora. Confira sua conexão e tente
          novamente.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setFailed(false)}
          style={{
            minHeight: 50,
            borderRadius: 12,
            backgroundColor: "#d8ef79",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#173f36", fontWeight: "800" }}>
            Tentar novamente
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0f1917",
        paddingTop: insets.top,
      }}
    >
      <WebView
        ref={web}
        source={{ uri: `${ENTURMA_ORIGIN}/home` }}
        applicationNameForUserAgent={`EnturmaMobile/${APP_VERSION}`}
        originWhitelist={["https://*", "about:blank"]}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        pullToRefreshEnabled
        onShouldStartLoadWithRequest={allow}
        onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
        onError={() => setFailed(true)}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 500) setFailed(true);
        }}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#0f1917",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <ActivityIndicator size="large" color="#d8ef79" />
            <Text style={{ color: "#f5f8f6", fontWeight: "700" }}>
              Abrindo Enturma…
            </Text>
          </View>
        )}
        style={{ flex: 1, backgroundColor: "#0f1917" }}
      />
    </View>
  );
}
