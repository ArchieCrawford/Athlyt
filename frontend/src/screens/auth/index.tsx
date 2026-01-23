import React, { useState } from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthMenu from "../../components/auth/menu";
import AuthDetails from "../../components/auth/details";
import { useTheme } from "../../theme/useTheme";

export default function AuthScreen() {
  const theme = useTheme();
  const [authPage, setAuthPage] = useState<0 | 1>(0);
  const [detailsPage, setDetailsPage] = useState(false);
  const [menuMessage, setMenuMessage] = useState("");

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
        {detailsPage ? (
          <AuthDetails
            authPage={authPage}
            menuMessage={menuMessage}
            setAuthPage={setAuthPage}
            setMenuMessage={setMenuMessage}
            setDetailsPage={setDetailsPage}
          />
        ) : (
          <AuthMenu
            authPage={authPage}
            menuMessage={menuMessage}
            setAuthPage={setAuthPage}
            setDetailsPage={setDetailsPage}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
