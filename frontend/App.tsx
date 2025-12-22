import "react-native-reanimated";
import { store } from "./src/redux/store";
import { Provider } from "react-redux";
import Route from "./src/navigation/main";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AuthProvider from "./src/providers/AuthProvider";
import ThemeProvider from "./src/theme/ThemeProvider";
import { StatusBar } from "expo-status-bar";
import { MD3DarkTheme, Provider as PaperProvider } from "react-native-paper";
import { tokens } from "./src/theme/tokens";
import { useEffect } from "react";
import * as Updates from "expo-updates";
import { AppState, AppStateStatus } from "react-native";
import { logEvent, startSession } from "./src/services/telemetry";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      staleTime: Infinity,
    },
  },
});

const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: tokens.colors.accent,
    secondary: tokens.colors.accent,
    tertiary: tokens.colors.accent,
    background: tokens.colors.bg,
    surface: tokens.colors.surface,
    surfaceVariant: tokens.colors.surface2,
    onSurface: tokens.colors.text,
    onSurfaceVariant: tokens.colors.textMuted,
    onBackground: tokens.colors.text,
    outline: tokens.colors.borderSubtle,
    outlineVariant: tokens.colors.borderSubtle,
    error: tokens.colors.danger,
  },
};

function ThemedRoute() {
  useEffect(() => {
    startSession().then(() => {
      logEvent("app_open");
    });
    const sub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "background") {
          logEvent("app_background");
        }
      },
    );
    return () => sub.remove();
  }, []);


  useEffect(() => {
    try {
      console.log("UPDATES STATE", {
        enabled: Updates.isEnabled,
        updateId: Updates.updateId,
        channel: (Updates as any).channel ?? undefined,
        url: (Updates as any).manifest?.extra?.expoClient?.updates?.url,
      });
    } catch (error) {
      console.log("UPDATES LOG ERROR", error);
    }
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      <Route />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <PaperProvider theme={paperTheme}>
              <AuthProvider>
                <ThemedRoute />
              </AuthProvider>
            </PaperProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
