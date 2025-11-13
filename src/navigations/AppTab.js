// src/navigations/AppTab.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Menu from "../screens/Menu/Menu";
import BodegasStack from "./BodegasStack";
import ItemsStack from "./ItemsStack";

const Tab = createBottomTabNavigator();

export default function AppTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,   // 👈 OCULTA EL HEADER DE CADA TAB
      }}
    >
      <Tab.Screen name="Menu" component={Menu} />
      <Tab.Screen name="Bodegas" component={BodegasStack} />
      <Tab.Screen name="Items" component={ItemsStack} />
    </Tab.Navigator>
  );
}
