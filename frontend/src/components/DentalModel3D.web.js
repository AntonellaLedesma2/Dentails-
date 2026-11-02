import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import DENTAL_MODEL_HTML from './dentalModelHtml';

export default function DentalModel3D({ states = {}, onToothPress }) {
  const frame = useRef(null);

  const sendStates = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: 'setDentalStates', states: states || {} }, '*');
  }, [states]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== frame.current?.contentWindow || event.data?.source !== 'dental-model') return;
      if (event.data.type === 'toothSelect' && Number.isInteger(event.data.tooth)) {
        onToothPress?.(event.data.tooth);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onToothPress]);

  return (
    <View style={styles.frame}>
      <iframe
        ref={frame}
        title="Modelo dental 3D del paciente"
        srcDoc={DENTAL_MODEL_HTML}
        onLoad={sendStates}
        style={styles.iframe}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 460, width: '100%', overflow: 'hidden', borderRadius: 12, backgroundColor: '#050507' },
  iframe: { display: 'block', width: '100%', height: '100%', border: '0' },
});
