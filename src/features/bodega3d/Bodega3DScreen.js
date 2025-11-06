import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";

export default function Bodega3DScreen() {
  return (
    <View style={styles.container}>
      <WebView
        // Cargamos el HTML local empaquetado por Metro
        source={require("../../assets/3D/bodega_3d_embedded.html")}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowingReadAccessToURL={"*"}
        // En Android ayuda para rutas file://
        mixedContentMode="always"
        // Evita borde blanco en iOS
        automaticallyAdjustContentInsets={false}
        setSupportMultipleWindows={false}
        startInLoadingState
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1, backgroundColor: "#000" },
});
