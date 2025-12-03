// src/navigations/BodegasStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BodegasListScreen from "../screens/Bodega/BodegasListScreen";
import BodegaFormScreen from "../screens/Bodega/BodegaFormScreen";

// 👇 NUEVO Paso 2
import BodegaMapScreen from "../screens/Bodega/BodegaMapScreen";

// 3D
import Bodega3DScreen from "../features/bodega3d/Bodega3DScreen";

const Stack = createNativeStackNavigator();

export default function BodegasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="BodegasList" component={BodegasListScreen} />
      <Stack.Screen name="BodegaForm" component={BodegaFormScreen} />

      {/* ✅ Paso 2 */}
      <Stack.Screen name="BodegaMap" component={BodegaMapScreen} />

      <Stack.Screen name="Bodega3D" component={Bodega3DScreen} />
    </Stack.Navigator>
  );
}
