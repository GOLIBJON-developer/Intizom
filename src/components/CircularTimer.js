import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE          = 220;
const STROKE        = 10;
const RADIUS        = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

// Font size based on character count — prevents overflow
const getFontSize = (seconds) => {
  const str = formatTime(seconds);
  if (str.length >= 8) return 28; // "9:00:00"
  if (str.length >= 7) return 32; // "1:00:00"
  return 42;                       // "59:59"
};

export const CircularTimer = ({ totalSeconds, remainingSeconds, color, isPaused, label }) => {
  const { theme } = useTheme();
  const progress  = useSharedValue(1);

  useEffect(() => {
    const pct = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
    progress.value = withTiming(pct, { duration: 600 });
  }, [remainingSeconds, totalSeconds]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const pct       = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const fontSize  = getFontSize(remainingSeconds);
  const ringColor = color || theme.accent;
  const timeStr   = formatTime(remainingSeconds);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={SIZE/2} cy={SIZE/2} r={RADIUS}
          stroke={theme.cardBorder} strokeWidth={STROKE} fill="none" />
        <AnimatedCircle cx={SIZE/2} cy={SIZE/2} r={RADIUS}
          stroke={ringColor} strokeWidth={STROKE} fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE/2}, ${SIZE/2}`}
        />
      </Svg>

      <View style={styles.center}>
        {label ? (
          <Text style={{ fontSize: 10, color: theme.textMuted, marginBottom: 6, letterSpacing: 1, fontFamily: 'DMSans_500Medium' }}>
            {label.toUpperCase()}
          </Text>
        ) : null}
        {/* adjustsFontSizeToFit prevents wrapping on Android */}
        <Text
          style={{ fontFamily: 'SpaceMono_700Bold', fontSize, color: isPaused ? theme.textSecondary : theme.text }}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {timeStr}
        </Text>
        {isPaused ? (
          <Text style={{ fontSize: 11, color: theme.warning, marginTop: 6, fontFamily: 'DMSans_600SemiBold' }}>⏸ PAUSED</Text>
        ) : (
          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{Math.round(pct * 100)}%</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center:    { position: 'absolute', width: SIZE * 0.6, alignItems: 'center', justifyContent: 'center' },
});
