import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';

import HomeScreen        from '../screens/HomeScreen';
import ScheduleScreen    from '../screens/ScheduleScreen';
import NotesScreen       from '../screens/NotesScreen';
import StatsScreen       from '../screens/StatsScreen';
import SettingsScreen    from '../screens/SettingsScreen';
import AddEditTaskScreen from '../screens/AddEditTaskScreen';
import FocusTimerScreen  from '../screens/FocusTimerScreen';
import AlertScreen       from '../screens/AlertScreen';
import OnboardingScreen  from '../screens/OnboardingScreen';
import { useStore }      from '../store/useStore';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_CONFIG = [
  { name: 'Home',     icon: 'home',           iconOff: 'home-outline',          labelKey: 'today'    },
  { name: 'Schedule', icon: 'list',            iconOff: 'list-outline',          labelKey: 'schedule' },
  { name: 'Notes',    icon: 'document-text',  iconOff: 'document-text-outline', labelKey: 'notes'    },
  { name: 'Stats',    icon: 'bar-chart',       iconOff: 'bar-chart-outline',     labelKey: 'stats'    },
  { name: 'Settings', icon: 'settings',        iconOff: 'settings-outline',      labelKey: 'settings' },
];
const SCREENS = {
  Home: HomeScreen, Schedule: ScheduleScreen,
  Notes: NotesScreen, Stats: StatsScreen, Settings: SettingsScreen,
};

const MainTabs = () => {
  const { theme } = useTheme();
  const { t }     = useI18n();
  const insets    = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG.find(c => c.name === route.name);
        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor:  theme.cardBorder,
            borderTopWidth:  1,
            height:          56 + insets.bottom,
            paddingBottom:   insets.bottom,
            paddingTop:      6,
            position:        'absolute',
            bottom: 0, left: 0, right: 0,
            elevation: 8,
          },
          tabBarActiveTintColor:   theme.accentLight,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name={focused ? cfg.icon : cfg.iconOff} size={22} color={color} />
              <Text style={{ fontSize: 10, color, marginTop: 2 }}>{t[cfg.labelKey]}</Text>
            </View>
          ),
        };
      }}
    >
      {TAB_CONFIG.map(cfg => (
        <Tab.Screen key={cfg.name} name={cfg.name} component={SCREENS[cfg.name]} />
      ))}
    </Tab.Navigator>
  );
};

export default function AppNavigator({ navRef }) {
  const { theme, isDark } = useTheme();
  const isLoaded   = useStore(s => s.isLoaded);
  const settings   = useStore(s => s.settings);

  const hasOnboarded = isLoaded && settings?.hasOnboarded;

  return (
    <NavigationContainer
      ref={navRef}
      theme={{
        dark: isDark,
        colors: {
          primary:      theme.accent,
          background:   theme.bg,
          card:         theme.card,
          text:         theme.text,
          border:       theme.cardBorder,
          notification: theme.accent,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen}
            options={{ animationTypeForReplace: 'push' }} />
        ) : null}
        <Stack.Screen name="Main"        component={MainTabs} />
        <Stack.Screen name="AddEditTask" component={AddEditTaskScreen}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="FocusTimer"  component={FocusTimerScreen}
          options={{ gestureEnabled: false }} />
        <Stack.Screen name="Alert"       component={AlertScreen}
          options={{ gestureEnabled: false, presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
