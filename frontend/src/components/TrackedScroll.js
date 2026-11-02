import React, { forwardRef, useCallback, useRef } from 'react';
import { FlatList, ScrollView } from 'react-native';
import { useAppUi } from '../context/AppUiContext';

export const TrackedScrollView = forwardRef(function TrackedScrollView({ onScroll, horizontal, ...props }, forwardedRef) {
  const ref = useRef(null);
  const { reportScroll } = useAppUi();
  const setRef = useCallback((node) => { ref.current = node; if (typeof forwardedRef === 'function') forwardedRef(node); else if (forwardedRef) forwardedRef.current = node; }, [forwardedRef]);
  const handleScroll = useCallback((event) => {
    onScroll?.(event);
    if (!horizontal) reportScroll(event.nativeEvent.contentOffset.y, () => ref.current?.scrollTo({ y: 0, animated: true }));
  }, [horizontal, onScroll, reportScroll]);
  return <ScrollView ref={setRef} onScroll={handleScroll} scrollEventThrottle={16} horizontal={horizontal} {...props} />;
});

export const TrackedFlatList = forwardRef(function TrackedFlatList({ onScroll, ...props }, forwardedRef) {
  const ref = useRef(null);
  const { reportScroll } = useAppUi();
  const setRef = useCallback((node) => { ref.current = node; if (typeof forwardedRef === 'function') forwardedRef(node); else if (forwardedRef) forwardedRef.current = node; }, [forwardedRef]);
  const handleScroll = useCallback((event) => {
    onScroll?.(event);
    reportScroll(event.nativeEvent.contentOffset.y, () => ref.current?.scrollToOffset({ offset: 0, animated: true }));
  }, [onScroll, reportScroll]);
  return <FlatList ref={setRef} onScroll={handleScroll} scrollEventThrottle={16} {...props} />;
});
