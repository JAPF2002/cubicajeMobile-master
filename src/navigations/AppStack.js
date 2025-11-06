// src/navigations/AppStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppTab from "./AppTab";
import AuthScreen from "../screens/AuthScreen";
import AdminUsers from "../screens/AdminUsers";
import UsersListScreen from "../screens/UsersListScreen";
import { useApp } from "../store";

const Stack = createNativeStackNavigator();

export default function AppStack() {
  const { currentUser } = useApp();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Main"               // <- SIEMPRE arranca en el Menú
    >
      <Stack.Screen name="Main" component={AppTab} />
      {/* Dejamos Auth disponible, pero no bloquea el inicio */}
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsers} />
      <Stack.Screen name="UsersList" component={UsersListScreen} />
    </Stack.Navigator>
  );
}
