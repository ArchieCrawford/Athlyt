import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import { Feather } from "@expo/vector-icons";
import CameraScreen from "../../screens/camera";
import ProfileScreen from "../../screens/profile";
import SearchScreen from "../../screens/search";
import FeedNavigation from "../feed";
import ChatScreen from "../../screens/chat/list";
import { useChats } from "../../hooks/useChats";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTheme } from "../../theme/useTheme";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type HomeStackParamList = {
  feed: { tabBarHeight?: number };
  Discover: { query?: string } | undefined;
  Add: undefined;
  Inbox: undefined;
  Me: { initialUserId: string };
};

const Tab = createMaterialBottomTabNavigator<HomeStackParamList>();

export default function HomeScreen() {
  useChats();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );
  const tabBarHeight = theme.tabBar.height + insets.bottom;

  return (
    <Tab.Navigator
      shifting={false}
      activeColor={theme.colors.text}
      inactiveColor={theme.colors.textMuted}
      safeAreaInsets={{ bottom: 0 }}
      barStyle={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 0,
        height: tabBarHeight,
        paddingBottom: insets.bottom + theme.tabBar.paddingBottom,
        paddingTop: theme.tabBar.paddingTop,
        elevation: 0,
        shadowColor: "transparent",
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
      }}
      initialRouteName="feed"
    >
      <Tab.Screen
        name="feed"
        component={FeedNavigation}
        initialParams={{ tabBarHeight }}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={CameraScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="plus-square" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="message-square" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Me"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
        initialParams={{ initialUserId: currentUserId ?? "" }}
        key={currentUserId ?? "guest"}
      />
    </Tab.Navigator>
  );
}
