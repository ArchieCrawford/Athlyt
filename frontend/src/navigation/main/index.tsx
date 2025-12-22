import React from "react";
import { useSelector } from "react-redux";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import AuthScreen from "../../screens/auth";
import Landing from "../../screens/auth/Landing";
import { RootState } from "../../redux/store";
import HomeScreen from "../home";
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SavePostScreen from "../../screens/savePost";
import EditProfileScreen from "../../screens/profile/edit";
import EditProfileFieldScreen from "../../screens/profile/edit/field";
import ChangePasswordScreen from "../../screens/auth/ChangePassword";
import Modal from "../../components/modal";
import FeedScreen from "../../features/feed/FeedScreen";
import ProfileScreen from "../../screens/profile";
import ChatSingleScreen from "../../screens/chat/single";
import SettingsAndPrivacyScreen from "../../screens/profile/settings";
import SavedScreen from "../../screens/profile/menu/SavedScreen";
import ProfileQrScreen from "../../screens/profile/menu/ProfileQrScreen";
import ActivityCenterScreen from "../../screens/profile/menu/ActivityCenterScreen";
import TermsScreen from "../../screens/legal/TermsScreen";
import PrivacyScreen from "../../screens/legal/PrivacyScreen";
import CommunityGuidelinesScreen from "../../screens/legal/CommunityGuidelinesScreen";
import HashtagResultsScreen from "../../screens/search/HashtagResults";
import useAuth from "../../hooks/useAuth";
import { tokens } from "../../theme/tokens";

export type RootStackParamList = {
  landing: undefined;
  home: undefined;
  auth: undefined;
  userPosts: { creator: string; profile: boolean };
  profileOther: { initialUserId: string };
  savePost: {
    source: string;
    sourceThumb?: string;
    mediaType?: "video" | "image";
  };
  editProfile: undefined;
  editProfileField: { title: string; field: string; value: string };
  chatSingle: { chatId?: string; contactId?: string };
  changePassword: undefined;
  SettingsAndPrivacy: undefined;
  Saved: undefined;
  ProfileQr: undefined;
  ActivityCenter: undefined;
  LegalTerms: undefined;
  LegalPrivacy: undefined;
  LegalCommunity: undefined;
  HashtagResults: { tag: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: tokens.colors.accent,
    background: tokens.colors.bg,
    card: tokens.colors.surface,
    text: tokens.colors.text,
    border: tokens.colors.borderSubtle,
    notification: tokens.colors.accent,
  },
};
const screenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: tokens.colors.bg },
  headerTintColor: tokens.colors.text,
  contentStyle: { backgroundColor: tokens.colors.bg },
};
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: tokens.colors.bg,
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    padding: tokens.spacing.lg,
  },
  loadingText: {
    marginTop: tokens.spacing.md,
    color: tokens.colors.textMuted,
  },
});

function UnauthedStack({
  screenOptions,
}: {
  screenOptions: NativeStackNavigationOptions;
}) {
  return (
    <Stack.Navigator initialRouteName="landing" screenOptions={screenOptions}>
      <Stack.Screen
        name="landing"
        component={Landing}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AuthedStack({
  screenOptions,
}: {
  screenOptions: NativeStackNavigationOptions;
}) {
  return (
    <Stack.Navigator initialRouteName="home" screenOptions={screenOptions}>
      <Stack.Screen
        name="home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="savePost"
        component={SavePostScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="userPosts"
        component={FeedScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: "Posts",
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="profileOther"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="editProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="editProfileField"
        component={EditProfileFieldScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="chatSingle"
        component={ChatSingleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="changePassword"
        component={ChangePasswordScreen}
        options={{ title: "Update Password" }}
      />
      <Stack.Screen
        name="SettingsAndPrivacy"
        component={SettingsAndPrivacyScreen}
        options={{ title: "Settings and privacy" }}
      />
      <Stack.Screen
        name="Saved"
        component={SavedScreen}
        options={{ title: "Saved" }}
      />
      <Stack.Screen
        name="ProfileQr"
        component={ProfileQrScreen}
        options={{ title: "QR code" }}
      />
      <Stack.Screen
        name="ActivityCenter"
        component={ActivityCenterScreen}
        options={{ title: "Activity center" }}
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
        name="HashtagResults"
        component={HashtagResultsScreen}
        options={{ title: "Hashtag" }}
      />
    </Stack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <ImageBackground
      source={require("../../../assets/loadscreen.png")}
      resizeMode="cover"
      style={styles.loadingContainer}
    >
      <View style={styles.loadingOverlay}>
        <ActivityIndicator color={tokens.colors.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </ImageBackground>
  );
}

export default function Route() {
  const { loading } = useAuth();
  const currentUserObj = useSelector((state: RootState) => state.auth);
  const isAuthed = !!currentUserObj.currentUser;

  console.log("AUTH STATE", {
    user: currentUserObj.currentUser,
    loading,
    loaded: currentUserObj.loaded,
  });

  if (loading || !currentUserObj.loaded) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthed ? (
        <AuthedStack screenOptions={screenOptions} />
      ) : (
        <UnauthedStack screenOptions={screenOptions} />
      )}
      <Modal />
    </NavigationContainer>
  );
}
