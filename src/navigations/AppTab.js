// src/navigations/AppTab.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Menu from "../screens/Menu";
import BodegasScreen from "../screens/BodegasScreen";
import ItemsScreen from "../screens/ItemsScreen";

const Tab = createBottomTabNavigator();

export default function AppTab(){
  return (
    <Tab.Navigator screenOptions={{ headerShown:false }}>
      <Tab.Screen name="Menu" component={Menu} options={{ title:"Menú" }} />
      <Tab.Screen name="Bodegas" component={BodegasScreen} />
      <Tab.Screen name="Items" component={ItemsScreen} />
    </Tab.Navigator>
  );
}
