// src/navigations/AppStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppTab from "./AppTab";
import AuthScreen from "../screens/AuthScreen";
import AdminUsers from "../screens/AdminUsers";
import UsersListScreen from "../screens/UsersListScreen";
import Bodega3DScreen from "../features/bodega3d/Bodega3DScreen"; // 👈 importar
import { useApp } from "../store";

const Stack = createNativeStackNavigator();

export default function AppStack() {
  const { currentUser } = useApp();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Main"
    >
      {/* Tabs principales */}
      <Stack.Screen name="Main" component={AppTab} />

      {/* Auth / Admin */}
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsers} />
      <Stack.Screen name="UsersList" component={UsersListScreen} />

      {/* Vista 3D de Bodega */}
      <Stack.Screen
        name="Bodega3D"
        component={Bodega3DScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route?.params?.nombre
            ? `Bodega 3D · ${route.params.nombre}`
            : "Bodega 3D",
        })}
      />
    </Stack.Navigator>
  );
}
