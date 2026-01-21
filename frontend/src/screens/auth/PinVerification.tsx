import { useMemo, useState } from "react";
import {
  Alert,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/main";
import { useTheme } from "../../theme/useTheme";
import AppText from "../../components/ui/AppText";

const PIN_LENGTH = 4;
const ACCENT = "#35D37A";

export default function PinVerificationScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pin, setPin] = useState("");

  const handleKeyPress = (value: string) => {
    if (value === "back") {
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) {
      return;
    }
    setPin((prev) => `${prev}${value}`);
  };

  const handleConfirm = () => {
    Alert.alert("PIN verified", "Continue.");
    navigation.goBack();
  };

  const keypad = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "",
    "0",
    "back",
  ];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: "#0A0C10",
        },
        topArea: {
          paddingTop: insets.top + theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          overflow: "hidden",
        },
        topTexture: {
          ...StyleSheet.absoluteFillObject,
          opacity: 0.6,
        },
        topOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(6, 7, 10, 0.6)",
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        headerTitle: {
          fontSize: 22,
          fontWeight: "700",
          color: "#E9EEF7",
          letterSpacing: 0.3,
        },
        headerSubtitle: {
          marginTop: theme.spacing.xs,
          color: "#8B94A7",
        },
        dotsRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: theme.spacing.md,
          marginTop: theme.spacing.xl,
        },
        dot: {
          width: 14,
          height: 14,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
        },
        dotFilled: {
          backgroundColor: ACCENT,
          borderColor: ACCENT,
        },
        keypad: {
          flex: 1,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        keypadRow: {
          flexDirection: "row",
          justifyContent: "space-between",
        },
        key: {
          flex: 1,
          height: 56,
          marginHorizontal: 6,
          borderRadius: 16,
          backgroundColor: "#11151C",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        },
        keyText: {
          color: "#E9EEF7",
          fontSize: 20,
          fontWeight: "600",
        },
        keyGhost: {
          backgroundColor: "transparent",
          borderColor: "transparent",
        },
        footer: {
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        },
        confirmButton: {
          backgroundColor: ACCENT,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing.md,
        },
        confirmText: {
          color: "#08130C",
          fontWeight: "700",
          fontSize: 16,
        },
        forgot: {
          textAlign: "center",
          color: "#8B94A7",
        },
      }),
    [insets.bottom, insets.top, theme],
  );

  return (
    <View style={styles.root}>
      <View style={styles.topArea}>
        <ImageBackground
          source={require("../../../assets/auth-texture.png")}
          resizeMode="cover"
          style={styles.topTexture}
        />
        <View style={styles.topOverlay} />
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="chevron-left" size={24} color="#E9EEF7" />
          </Pressable>
        </View>
        <AppText style={styles.headerTitle}>PIN Verification</AppText>
        <AppText style={styles.headerSubtitle}>Enter your PIN</AppText>
        <View style={styles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <View
              key={`pin-dot-${index}`}
              style={[styles.dot, pin.length > index && styles.dotFilled]}
            />
          ))}
        </View>
      </View>

      <View style={styles.keypad}>
        {[0, 1, 2, 3].map((rowIndex) => {
          const rowItems = keypad.slice(rowIndex * 3, rowIndex * 3 + 3);
          return (
            <View style={styles.keypadRow} key={`pin-row-${rowIndex}`}>
              {rowItems.map((item) => {
                if (!item) {
                  return (
                    <View
                      key={`key-empty-${rowIndex}`}
                      style={[styles.key, styles.keyGhost]}
                    />
                  );
                }
                if (item === "back") {
                  return (
                    <Pressable
                      key="key-back"
                      style={({ pressed }) => [
                        styles.key,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      onPress={() => handleKeyPress("back")}
                    >
                      <MaterialIcons name="backspace" size={22} color="#E9EEF7" />
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    key={`key-${item}`}
                    style={({ pressed }) => [
                      styles.key,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => handleKeyPress(item)}
                  >
                    <AppText style={styles.keyText}>{item}</AppText>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.confirmButton,
            { opacity: pin.length === PIN_LENGTH ? 1 : 0.5 },
          ]}
          onPress={handleConfirm}
          disabled={pin.length !== PIN_LENGTH}
        >
          <AppText style={styles.confirmText}>Confirm</AppText>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert("Forgot PIN", "PIN reset is coming soon.")
          }
        >
          <AppText style={styles.forgot}>Forgot PIN?</AppText>
        </Pressable>
      </View>
    </View>
  );
}
