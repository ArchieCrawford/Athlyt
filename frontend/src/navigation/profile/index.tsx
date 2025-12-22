import { createDrawerNavigator } from "@react-navigation/drawer";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import ProfileScreen from "../../screens/profile";
import ProfileSettingsScreen from "../../screens/profile/settings";
import Screen from "../../components/layout/Screen";
import AppText from "../../components/ui/AppText";
import { HomeStackParamList } from "../home";
import { RouteProp } from "@react-navigation/native";

export type ProfileDrawerParamList = {
  ProfileMain: { initialUserId: string };
  Settings: undefined;
  ProfileQr: undefined;
  ActivityCenter: undefined;
  OfflineVideos: undefined;
};

const Drawer = createDrawerNavigator<ProfileDrawerParamList>();

const MENU_ITEMS: Array<{
  label: string;
  route: keyof ProfileDrawerParamList;
}> = [
  { label: "Settings and privacy", route: "Settings" },
  { label: "Your QR code", route: "ProfileQr" },
  { label: "Activity center", route: "ActivityCenter" },
  { label: "Offline videos", route: "OfflineVideos" },
];

function MenuPlaceholder({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Screen>
      <AppText variant="title">{title}</AppText>
      <AppText variant="muted" style={{ marginTop: theme.spacing.sm }}>
        Coming soon.
      </AppText>
    </Screen>
  );
}

function ProfileDrawerContent({
  navigation,
}: {
  navigation: { navigate: (route: keyof ProfileDrawerParamList) => void };
}) {
  const theme = useTheme();
  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface2,
    },
    label: {
      flex: 1,
    },
  });

  return (
    <DrawerContentScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={styles.container}>
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            style={({ pressed }) => [
              styles.item,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <AppText variant="body" style={styles.label}>
              {item.label}
            </AppText>
            <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </DrawerContentScrollView>
  );
}

type ProfileDrawerRouteProp = RouteProp<HomeStackParamList, "Me">;

export default function ProfileNavigation({
  route,
}: {
  route: ProfileDrawerRouteProp;
}) {
  const theme = useTheme();
  const initialUserId = route.params?.initialUserId ?? "";

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerType: "front",
        overlayColor: "rgba(0, 0, 0, 0.4)",
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },
      }}
      drawerContent={({ navigation }) => (
        <ProfileDrawerContent navigation={navigation} />
      )}
    >
      <Drawer.Screen
        name="ProfileMain"
        component={ProfileScreen}
        initialParams={{ initialUserId }}
      />
      <Drawer.Screen name="Settings" component={ProfileSettingsScreen} />
      <Drawer.Screen name="ProfileQr">
        {() => <MenuPlaceholder title="Your QR code" />}
      </Drawer.Screen>
      <Drawer.Screen name="ActivityCenter">
        {() => <MenuPlaceholder title="Activity center" />}
      </Drawer.Screen>
      <Drawer.Screen name="OfflineVideos">
        {() => <MenuPlaceholder title="Offline videos" />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
