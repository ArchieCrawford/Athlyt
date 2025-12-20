import React from "react";
import { useSelector } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import AuthScreen from "../../screens/auth";
import Landing from "../../screens/auth/Landing";
import { RootState } from "../../redux/store";
import HomeScreen from "../home";
import { View } from "react-native";
import SavePostScreen from "../../screens/savePost";
import EditProfileScreen from "../../screens/profile/edit";
import EditProfileFieldScreen from "../../screens/profile/edit/field";
import Modal from "../../components/modal";
import FeedScreen from "../../features/feed/FeedScreen";
import ProfileScreen from "../../screens/profile";
import ChatSingleScreen from "../../screens/chat/single";
import useAuth from "../../hooks/useAuth";
import { tokens } from "../../theme/tokens";

export type RootStackParamList = {
  landing: undefined;
  home: undefined;
  auth: undefined;
  userPosts: { creator: string; profile: boolean };
  profileOther: { initialUserId: string };
  savePost: { source: string; sourceThumb: string };
  editProfile: undefined;
  editProfileField: { title: string; field: string; value: string };
  chatSingle: { chatId?: string; contactId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navTheme = {
  dark: true,
  colors: {
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
        options={{ headerShown: false }}
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
    </Stack.Navigator>
  );
}

export default function Route() {
  const { loading } = useAuth();
  const currentUserObj = useSelector((state: RootState) => state.auth);
  const isAuthed = !!currentUserObj.currentUser;

  if (loading || !currentUserObj.loaded) {
    return <View></View>;
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
