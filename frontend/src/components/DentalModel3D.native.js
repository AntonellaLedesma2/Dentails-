import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import DENTAL_MODEL_HTML from './dentalModelHtml';

export default function DentalModel3D({ states = {}, onToothPress }) {
  const webView = useRef(null);

  const syncStates = useCallback(() => {
    const serialized = JSON.stringify(states || {});
    webView.current?.injectJavaScript(`window.setDentalStates && window.setDentalStates(${serialized}); true;`);
  }, [states]);

  useEffect(() => {
    syncStates();
  }, [syncStates]);

  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'toothSelect' && Number.isInteger(message.tooth)) {
        onToothPress?.(message.tooth);
      }
    } catch {
      // Ignorar mensajes ajenos al puente del modelo.
    }
  }, [onToothPress]);

  return (
    <View style={styles.frame}>
      <WebView
        ref={webView}
        originWhitelist={['*']}
        source={{ html: DENTAL_MODEL_HTML, baseUrl: 'https://dentalis.local/' }}
        javaScriptEnabled
        scrollEnabled={false}
        onLoadEnd={syncStates}
        onMessage={handleMessage}
        style={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 460, width: '100%', overflow: 'hidden', borderRadius: 12, backgroundColor: '#050507' },
  webView: { flex: 1, backgroundColor: '#050507' },
});
