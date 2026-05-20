import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../core/theme/ThemeContext';

import HomeScreen from '../features/home/screens/HomeScreen';
import PrayerTimesScreen from '../features/prayer/screens/PrayerTimesScreen';
import QuranSurahListScreen from '../features/quran/screens/QuranSurahListScreen';
import ZikrCounterScreen from '../features/zikr/screens/ZikrCounterScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';

type TabParamList = {
  Home: undefined;
  PrayerTimes: undefined;
  QuranSurahList: undefined;
  ZikrCounter: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconName;
  activeName: IoniconName;
  focused: boolean;
  color: string;
  size: number;
}

function TabIcon({ name, activeName, focused, color, size }: TabIconProps) {
  return (
    <View style={focused ? styles.activeIconWrap : undefined}>
      <Ionicons name={focused ? activeName : name} size={size} color={color} />
    </View>
  );
}

export default function BottomTabNavigator() {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  const tabBarBg = theme.dark ? '#0F1E17' : '#FFFFFF';
  const activeColor = c.primary;
  const inactiveColor = theme.dark ? '#4A6B62' : '#9CA3AF';
  const borderColor = theme.dark ? '#1E3329' : '#E5E7EB';

  // System navigation/gesture bar takes a variable amount of space.
  // Use safe-area insets so buttons never sit under the system back button.
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 12);
  const baseHeight = Platform.OS === 'ios' ? 60 : 56;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: borderColor,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: baseHeight + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="home-outline" activeName="home" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PrayerTimes"
        component={PrayerTimesScreen}
        options={{
          title: 'Namaz',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="time-outline" activeName="time" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="QuranSurahList"
        component={QuranSurahListScreen}
        options={{
          title: "Kur'an",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="book-outline" activeName="book" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ZikrCounter"
        component={ZikrCounterScreen}
        options={{
          title: 'Zikir',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="infinite-outline" activeName="infinite" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="settings-outline" activeName="settings" focused={focused} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
