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

export type HomeStackParamList = {
  feed: undefined;
  Discover: { query?: string } | undefined;
  Add: undefined;
  Inbox: undefined;
  Me: { initialUserId: string };
};

const Tab = createMaterialBottomTabNavigator<HomeStackParamList>();

export default function HomeScreen() {
  useChats();
  const theme = useTheme();
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );

  return (
    <Tab.Navigator
      shifting={false}
      activeColor={theme.colors.text}
      inactiveColor={theme.colors.textMuted}
      barStyle={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSubtle,
        height: theme.tabBar.height,
        paddingBottom: theme.tabBar.paddingBottom,
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
      />
    </Tab.Navigator>
  );
}
