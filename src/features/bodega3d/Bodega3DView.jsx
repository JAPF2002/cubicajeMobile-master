import React, { useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Bodega3DView({ style, data, onReady, onClick, onLog }) {
  const webRef = useRef(null);

  const source = useMemo(() => {
    // Ruta al HTML que ya pusiste en src/assets/3D/
    return require('../../assets/3D/bodega_3d_embedded.html');
  }, []);

  const sendToWeb = useCallback((payload) => {
    if (!webRef.current) return;
    const js = `window.receiveFromReactNative(${JSON.stringify(payload)}); true;`;
    webRef.current.injectJavaScript(js);
  }, []);

  const handleMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg?.type === 'READY') {
        onReady?.();
        if (data) sendToWeb({ type: 'SET_DATA', data });
        return;
      }
      if (msg?.type === 'CLICK') {
        onClick?.(msg.id);
        return;
      }
      onLog?.(msg);
    } catch (e) {
      onLog?.({ type: 'ERROR', error: String(e) });
    }
  }, [data, onClick, onLog, sendToWeb]);

  return (
    <View style={[{ flex: 1, backgroundColor: '#000' }, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={source}                 // HTML local (no navegador)
        allowFileAccess
        allowUniversalAccessFromFileURLs
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        onShouldStartLoadWithRequest={(req) => req.url.startsWith('file://')} // bloquea navegación externa
        injectedJavaScriptBeforeContentLoaded={`window.__APP_CONFIG__ = { build: 'mobile', version: '0.0.1' }; true;`}
      />
    </View>
  );
}
