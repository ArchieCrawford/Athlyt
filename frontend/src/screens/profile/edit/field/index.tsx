import { RouteProp, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBarGeneral from "../../../../components/general/navbar";
import { saveUserField } from "../../../../services/user";
import { generalStyles } from "../../../../styles";
import styles from "./styles";
import { RootStackParamList } from "../../../../navigation/main";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type EditProfileFieldRoute = RouteProp<RootStackParamList, "editProfileField">;

export default function EditProfileFieldScreen({
  route,
}: {
  route: EditProfileFieldRoute;
}) {
  const { title, field, value, maxLength, multiline } = route.params;
  const [textInputValue, setTextInputValue] = useState(value);
  const navigation = useNavigation();

  const onSave = () => {
    saveUserField(field, textInputValue).then(() => navigation.goBack());
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavBarGeneral
        title={title}
        rightButton={{ display: true, name: "save", action: onSave }}
      />
      <Divider />
      <View style={styles.mainContainer}>
        <Text style={styles.title}>{title}</Text>
        <TextInput
          style={generalStyles.textInput}
          value={textInputValue}
          onChangeText={(txt) => {
            if (maxLength && txt.length > maxLength) {
              setTextInputValue(txt.slice(0, maxLength));
              return;
            }
            setTextInputValue(txt);
          }}
          maxLength={maxLength}
          multiline={multiline}
        />
        {maxLength ? (
          <Text style={{ marginTop: 8, color: "gray" }}>
            {textInputValue.length}/{maxLength}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
