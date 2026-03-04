import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import PrayerGuideScreen from '../screens/PrayerGuideScreen';
import QiblaScreen from '../screens/QiblaScreen';
import QuranSurahListScreen from '../screens/QuranSurahListScreen';
import QuranSurahDetailScreen from '../screens/QuranSurahDetailScreen';
import DuasScreen from '../screens/DuasScreen';
import ZikrCounterScreen from '../screens/ZikrCounterScreen';
import PrayerLogScreen from '../screens/PrayerLogScreen';
import FavoriteAyahsScreen from '../screens/FavoriteAyahsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RisaleNurScreen from '../screens/RisaleNurScreen';
import ElmaliliTafsirScreen from '../screens/ElmaliliTafsirScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import IslamicCalendarScreen from '../screens/IslamicCalendarScreen';
import MosqueFinderScreen from '../screens/MosqueFinderScreen';

export type RootStackParamList = {
  Home: undefined;
  PrayerTimes: undefined;
  PrayerGuide: undefined;
  Qibla: undefined;
  QuranSurahList: undefined;
  QuranSurahDetail: { surahId: number; surahName: string };
  Duas: undefined;
  ZikrCounter: undefined;
  PrayerLog: undefined;
  FavoriteAyahs: undefined;
  Settings: undefined;
  RisaleNur: undefined;
  ElmaliliTafsir: undefined;
  Analytics: undefined;
  Goals: undefined;
  IslamicCalendar: undefined;
  MosqueFinder: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#020617' },
          headerTintColor: '#F9FAFB',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#020617' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'İslami Asistan' }}
        />
        <Stack.Screen
          name="PrayerTimes"
          component={PrayerTimesScreen}
          options={{ title: 'Namaz Vakitleri' }}
        />
        <Stack.Screen
          name="PrayerGuide"
          component={PrayerGuideScreen}
          options={{ title: 'Namaz Kılavuzu' }}
        />
        <Stack.Screen
          name="Qibla"
          component={QiblaScreen}
          options={{ title: 'Kıble Yönü' }}
        />
        <Stack.Screen
          name="QuranSurahList"
          component={QuranSurahListScreen}
          options={{ title: 'Kur\'an-ı Kerim' }}
        />
        <Stack.Screen
          name="QuranSurahDetail"
          component={QuranSurahDetailScreen}
          options={({ route }) => ({ title: route.params.surahName })}
        />
        <Stack.Screen
          name="Duas"
          component={DuasScreen}
          options={{ title: 'Günlük Dualar' }}
        />
        <Stack.Screen
          name="ZikrCounter"
          component={ZikrCounterScreen}
          options={{ title: 'Zikir Sayacı' }}
        />
        <Stack.Screen
          name="PrayerLog"
          component={PrayerLogScreen}
          options={{ title: 'Namaz Hatıra Defteri' }}
        />
        <Stack.Screen
          name="FavoriteAyahs"
          component={FavoriteAyahsScreen}
          options={{ title: 'Favori Ayetlerim' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Ayarlar' }}
        />
        <Stack.Screen
          name="RisaleNur"
          component={RisaleNurScreen}
          options={{ title: 'Risale-i Nur' }}
        />
        <Stack.Screen
          name="ElmaliliTafsir"
          component={ElmaliliTafsirScreen}
          options={{ title: 'Elmalılı Tefsiri' }}
        />
        <Stack.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{ title: 'Manevî Analiz' }}
        />
        <Stack.Screen
          name="Goals"
          component={GoalsScreen}
          options={{ title: 'Hedeflerim' }}
        />
        <Stack.Screen
          name="IslamicCalendar"
          component={IslamicCalendarScreen}
          options={{ title: 'İslami Takvim' }}
        />
        <Stack.Screen
          name="MosqueFinder"
          component={MosqueFinderScreen}
          options={{ title: 'Cami Bulucu' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

