import { useState } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { RouteProp } from "@react-navigation/native";
import FeedScreen from "../../features/feed/FeedScreen";
import ProfileScreen from "../../screens/profile";
import { FeedStackParamList } from "./types";
import { HomeStackParamList } from "../home";
import { CurrentUserProfileItemInViewContext } from "./context";

const { Screen, Navigator } =
  createMaterialTopTabNavigator<FeedStackParamList>();

interface FeedNavigationProps {
  route: RouteProp<HomeStackParamList, "feed">;
}

const FeedNavigation = ({ route }: FeedNavigationProps) => {
  const [currentUserProfileItemInView, setCurrentUserProfileItemInView] =
    useState<string | null>(null);
  
  const tabBarHeight = route?.params?.tabBarHeight ?? 0;

  return (
    <CurrentUserProfileItemInViewContext.Provider
      value={{
        currentUserProfileItemInView,
        setCurrentUserProfileItemInView,
      }}
    >
      <Navigator initialRouteName="feedList" tabBar={() => <></>}>
        <Screen
          name="feedList"
          component={FeedScreen}
          initialParams={{ profile: false, tabBarHeight }}
        />
        <Screen
          name="feedProfile"
          component={ProfileScreen}
          initialParams={{ initialUserId: "" }}
        />
      </Navigator>
    </CurrentUserProfileItemInViewContext.Provider>
  );
};

export default FeedNavigation;
