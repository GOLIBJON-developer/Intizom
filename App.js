import React, { useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  DMSans_400Regular, DMSans_500Medium,
  DMSans_600SemiBold, DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';
import { useTheme } from './src/hooks/useTheme';
import { setupNotifications } from './src/utils/notifications';

SplashScreen.preventAutoHideAsync();

// Global navigation ref for notification taps
export const navigationRef = React.createRef();

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator navRef={navigationRef} />
    </>
  );
}

export default function App() {
  const loadData = useStore(s => s.loadData);
  const isLoaded = useStore(s => s.isLoaded);

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular, DMSans_500Medium,
    DMSans_600SemiBold, DMSans_700Bold,
    SpaceMono_400Regular, SpaceMono_700Bold,
  });

  useEffect(() => {
    loadData().catch(console.warn);
    setupNotifications().catch(console.warn);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Handle notification TAP — navigate to Alert screen
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (!data) return;
      // Wait for navigation to be ready
      setTimeout(() => {
        try {
          if (data.type === 'task_start' || data.type === 'task_done') {
            navigationRef.current?.navigate('Alert', { taskId: data.taskId });
          } else if (data.type === 'summary') {
            navigationRef.current?.navigate('Main', { screen: 'Stats' });
          }
        } catch {}
      }, 500);
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
