import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Dumbbell } from 'lucide-react-native';

const SpinRing = ({ size, color, reverse, duration, thickness }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim, duration]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: thickness,
        borderColor: 'transparent',
        borderTopColor: color,
        borderRightColor: reverse ? color : 'transparent',
        transform: [{ rotate: spin }],
      }}
    />
  );
};

const PulsingIcon = ({ color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ])
    ).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <Dumbbell size={32} color={color} strokeWidth={2.5} />
    </Animated.View>
  );
};

export default function GlobalLoader() {
  const { globalLoading, isDarkMode, colors } = useAppContext();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const prevLoading = useRef(false);
  const [isVisible, setIsVisible] = useState(globalLoading);

  useEffect(() => {
    if (globalLoading && !prevLoading.current) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!globalLoading && prevLoading.current) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
      });
    }
    prevLoading.current = globalLoading;
  }, [globalLoading, opacity, scale]);

  if (!isVisible && !globalLoading) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { 
          opacity,
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)'
        }
      ]}
      pointerEvents={globalLoading ? 'auto' : 'none'}
    >
      <Animated.View style={[styles.card, { backgroundColor: colors.surface, transform: [{ scale }] }]}>
        <SpinRing size={74} color={colors.primary} reverse={false} duration={1200} thickness={3} />
        <SpinRing size={60} color={colors.accent || colors.primary} reverse={true} duration={1800} thickness={3} />
        <PulsingIcon color={colors.primary} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9000,
    elevation: 9000,
  },
  card: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
});
