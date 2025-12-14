// src/navigations/AppStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AppTab from "./AppTab";

// Auth
import LoginScreen from "../screens/Login/LoginScreen";
import RegisterScreen from "../screens/Registro/RegisterScreen";

// Usuario / administración
import ProfileScreen from "../screens/Perfil/ProfileScreen";
import SolicitudesScreen from "../screens/Solicitudes/SolicitudesScreen";
import UserFormScreen from "../screens/UserList/UserFormScreen";
import UsersListScreen from "../screens/UserList/UsersListScreen";
import MovimientosScreen from "../screens/Movimientos/MovimientosScreen";
import InformeScreen from "../screens/Movimientos/InformeScreen";
import EditUserCredsScreenUI from "../screens/UserList/EditUserCredsScreenUI";


// Bodega 3D
import Bodega3DScreen from "../features/bodega3d/Bodega3DScreen";

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Login"   // siempre parte en Login por ahora
    >
      {/* Autenticación */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Tabs principales */}
      <Stack.Screen name="Main" component={AppTab} />

      {/* Pantallas de usuario / administración */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Solicitudes" component={SolicitudesScreen} />
      <Stack.Screen name="Movimientos" component={MovimientosScreen} />
      <Stack.Screen name="Informe" component={InformeScreen} />
      <Stack.Screen name="AdminUsers" component={UsersListScreen} />
      <Stack.Screen name="UsersList" component={UsersListScreen} />
      <Stack.Screen name="UserForm" component={UserFormScreen} />
      <Stack.Screen name="EditUserCreds" component={EditUserCredsScreenUI} />

      

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
