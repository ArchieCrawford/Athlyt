import { View, Text, Pressable } from "react-native";

export default function Landing({ navigation }: any) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 14 }}>
      <Text style={{ fontSize: 34, fontWeight: "800" }}>Athlyt</Text>
      <Text style={{ fontSize: 16, opacity: 0.75 }}>
        Build your athlete profile. Get discovered. Message coaches.
      </Text>

      <Pressable
        onPress={() => navigation.navigate("auth", { mode: "login" })}
        style={{ padding: 14, borderRadius: 12, backgroundColor: "black" }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
          Sign in
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("auth", { mode: "signup" })}
        style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
      >
        <Text style={{ textAlign: "center", fontWeight: "700" }}>
          Create account
        </Text>
      </Pressable>
    </View>
  );
}
