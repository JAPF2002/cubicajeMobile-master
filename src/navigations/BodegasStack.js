// src/navigations/BodegasStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BodegasListScreen from "../screens/Bodega/BodegasListScreen";
import BodegaFormScreen from "../screens/Bodega/BodegaFormScreen";

// 👈 IMPORTA la pantalla 3D
import Bodega3DScreen from "../features/bodega3d/Bodega3DScreen";

const Stack = createNativeStackNavigator();

export default function BodegasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // usamos los headers propios de cada pantalla
      }}
    >
      {/* Lista de bodegas */}
      <Stack.Screen
        name="BodegasList"
        component={BodegasListScreen}
      />

      {/* Crear / editar bodega */}
      <Stack.Screen
        name="BodegaForm"
        component={BodegaFormScreen}
      />

      {/* Vista 3D */}
      <Stack.Screen
        name="Bodega3D"
        component={Bodega3DScreen}
      />
    </Stack.Navigator>
  );
}
