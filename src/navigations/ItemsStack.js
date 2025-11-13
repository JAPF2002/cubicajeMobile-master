// src/navigations/ItemsStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ItemsListScreen from "../screens/Item/ItemsListScreen";
import ItemFormScreen from "../screens/Item/ItemFormScreen";

const Stack = createNativeStackNavigator();

export default function ItemsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,   // 👈 IGUAL AQUÍ
      }}
    >
      <Stack.Screen
        name="ItemsList"
        component={ItemsListScreen}
      />
      <Stack.Screen
        name="ItemForm"
        component={ItemFormScreen}
      />
    </Stack.Navigator>
  );
}
