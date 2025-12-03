// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\navigations\HistorialStack.js

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MovimientosScreen from "../screens/Movimientos/MovimientosScreen";
import InformeScreen from "../screens/Movimientos/InformeScreen";

const Stack = createNativeStackNavigator();

export default function HistorialStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MovimientosList" component={MovimientosScreen} />
      <Stack.Screen name="Informe" component={InformeScreen} />
    </Stack.Navigator>
  );
}
