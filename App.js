// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppStack from "./src/navigations/AppStack";
import { AppProvider } from "./src/store";

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <AppStack />
      </NavigationContainer>
    </AppProvider>
  );
}
