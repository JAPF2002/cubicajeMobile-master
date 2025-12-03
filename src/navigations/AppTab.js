// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\navigations\AppTab.js

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Menu from "../screens/Menu/Menu";
import BodegasStack from "./BodegasStack";
import ItemsStack from "./ItemsStack";
import HistorialStack from "./HistorialStack"; // ✅ IMPORTANTE: tu stack real

const Tab = createBottomTabNavigator();

export default function AppTab() {
  return (
    <Tab.Navigator
      id="AppTabs" // ✅ CLAVE: este id lo usaremos con getParent("AppTabs")
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Menu" component={Menu} />
      <Tab.Screen name="Bodegas" component={BodegasStack} />
      <Tab.Screen name="Items" component={ItemsStack} />
      <Tab.Screen name="Historial" component={HistorialStack} />
    </Tab.Navigator>
  );
}
