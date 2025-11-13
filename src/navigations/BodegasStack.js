// src/navigations/BodegasStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BodegasListScreen from "../screens/Bodega/BodegasListScreen";
import BodegaFormScreen from "../screens/Bodega/BodegaFormScreen";

const Stack = createNativeStackNavigator();

export default function BodegasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,   // 👈 OCULTA EL HEADER DEL STACK
      }}
    >
      <Stack.Screen
        name="BodegasList"
        component={BodegasListScreen}
      />
      <Stack.Screen
        name="BodegaForm"
        component={BodegaFormScreen}
      />
    </Stack.Navigator>
  );
}
