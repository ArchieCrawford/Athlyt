import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsHomeScreen from "../../screens/profile/settings";
import SettingsAccountScreen from "../../screens/profile/settings/AccountScreen";
import SettingsPrivacyScreen from "../../screens/profile/settings/PrivacyScreen";
import SecurityPermissionsScreen from "../../screens/profile/settings/SecurityPermissionsScreen";
import NotificationsScreen from "../../screens/profile/settings/NotificationsScreen";
import SettingsLegalScreen from "../../screens/profile/settings/LegalScreen";
import ChangePasswordScreen from "../../screens/auth/ChangePassword";
import TermsScreen from "../../screens/legal/TermsScreen";
import PrivacyScreen from "../../screens/legal/PrivacyScreen";
import CommunityGuidelinesScreen from "../../screens/legal/CommunityGuidelinesScreen";
import AthleteContentLicenseScreen from "../../screens/legal/AthleteContentLicenseScreen";
import { Feather } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useTheme } from "../../theme/useTheme";

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Account: undefined;
  Privacy: undefined;
  SecurityPermissions: undefined;
  Notifications: undefined;
  Legal: undefined;
  ChangePassword: undefined;
  LegalTerms: undefined;
  LegalPrivacy: undefined;
  LegalCommunity: undefined;
  LegalLicense: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: "#ffffff" },
  headerTintColor: "#111111",
  contentStyle: { backgroundColor: "#ffffff" },
  headerBackTitleVisible: false,
};

export default function SettingsStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="SettingsHome"
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={({ navigation }) => ({
          title: "Settings",
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ padding: 8 }}
            >
              <Feather name="chevron-left" size={22} color={theme.colors.text} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="Account"
        component={SettingsAccountScreen}
        options={{ title: "Account" }}
      />
      <Stack.Screen
        name="Privacy"
        component={SettingsPrivacyScreen}
        options={{ title: "Privacy" }}
      />
      <Stack.Screen
        name="SecurityPermissions"
        component={SecurityPermissionsScreen}
        options={{ title: "Security & permissions" }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
      <Stack.Screen
        name="Legal"
        component={SettingsLegalScreen}
        options={{ title: "Legal" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Change password" }}
      />
      <Stack.Screen
        name="LegalTerms"
        component={TermsScreen}
        options={{ title: "Terms of Service" }}
      />
      <Stack.Screen
        name="LegalPrivacy"
        component={PrivacyScreen}
        options={{ title: "Privacy Policy" }}
      />
      <Stack.Screen
        name="LegalCommunity"
        component={CommunityGuidelinesScreen}
        options={{ title: "Community Guidelines" }}
      />
      <Stack.Screen
        name="LegalLicense"
        component={AthleteContentLicenseScreen}
        options={{ title: "Athlete Content License" }}
      />
    </Stack.Navigator>
  );
}
