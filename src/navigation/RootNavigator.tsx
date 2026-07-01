import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../core/theme/ThemeContext';
import type { RootStackParamList } from './types';

import BottomTabNavigator from './BottomTabNavigator';
import PrayerGuideScreen from '../features/prayer/screens/PrayerGuideScreen';
import PrayerLogScreen from '../features/prayer/screens/PrayerLogScreen';
import QiblaScreen from '../features/qibla/screens/QiblaScreen';
import QuranSurahDetailScreen from '../features/quran/screens/QuranSurahDetailScreen';
import FavoriteAyahsScreen from '../features/quran/screens/FavoriteAyahsScreen';
import ElmaliliTafsirScreen from '../features/quran/screens/ElmaliliTafsirScreen';
import DuasScreen from '../features/dua/screens/DuasScreen';
import IslamicCalendarScreen from '../features/calendar/screens/IslamicCalendarScreen';
import MosqueFinderScreen from '../features/mosque/screens/MosqueFinderScreen';
import AnalyticsScreen from '../features/analytics/screens/AnalyticsScreen';
import GoalsScreen from '../features/goals/screens/GoalsScreen';
import RisaleNurScreen from '../features/risale/screens/RisaleNurScreen';
import RamadanTrackerScreen from '../features/ramadan/screens/RamadanTrackerScreen';
import PrayerProgressScreen from '../features/progress/screens/PrayerProgressScreen';
import EsmaulHusnaListScreen from '../features/esmaulhusna/screens/EsmaulHusnaListScreen';
import EsmaulHusnaDetailScreen from '../features/esmaulhusna/screens/EsmaulHusnaDetailScreen';
import HadithListScreen from '../features/hadith/screens/HadithListScreen';
import HadithDetailScreen from '../features/hadith/screens/HadithDetailScreen';
import GoodDeedsScreen from '../features/gooddeeds/screens/GoodDeedsScreen';
import HatimTrackerScreen from '../features/hatim/screens/HatimTrackerScreen';
import KesfetScreen from '../features/kesfet/screens/KesfetScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: c.navBar },
          headerTintColor: c.white,
          headerTitleStyle: { fontWeight: '600', color: c.white },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="MainTabs"        component={BottomTabNavigator}    options={{ headerShown: false }} />
        <Stack.Screen name="PrayerGuide"     component={PrayerGuideScreen}     options={{ title: 'Namaz Kılavuzu' }} />
        <Stack.Screen name="PrayerLog"       component={PrayerLogScreen}       options={{ title: 'Namaz Hatıra Defteri' }} />
        <Stack.Screen name="Qibla"           component={QiblaScreen}           options={{ title: 'Kıble Yönü' }} />
        <Stack.Screen name="QuranSurahDetail" component={QuranSurahDetailScreen} options={({ route }) => ({ title: route.params.surahName })} />
        <Stack.Screen name="FavoriteAyahs"   component={FavoriteAyahsScreen}   options={{ title: 'Favori Ayetlerim' }} />
        <Stack.Screen name="ElmaliliTafsir"  component={ElmaliliTafsirScreen}  options={{ title: 'Elmalılı Tefsiri' }} />
        <Stack.Screen name="Duas"            component={DuasScreen}            options={{ title: 'Günlük Dualar' }} />
        <Stack.Screen name="IslamicCalendar" component={IslamicCalendarScreen} options={{ title: 'İslami Takvim' }} />
        <Stack.Screen name="MosqueFinder"    component={MosqueFinderScreen}    options={{ title: 'Cami Bulucu' }} />
        <Stack.Screen name="Analytics"       component={AnalyticsScreen}       options={{ title: 'Manevî Analiz' }} />
        <Stack.Screen name="Goals"           component={GoalsScreen}           options={{ title: 'Hedeflerim' }} />
        <Stack.Screen name="RisaleNur"       component={RisaleNurScreen}       options={{ title: 'Risale-i Nur' }} />
        <Stack.Screen name="RamadanTracker"  component={RamadanTrackerScreen}  options={{ title: 'Ramazan Takibi' }} />
        <Stack.Screen name="PrayerProgress"  component={PrayerProgressScreen}  options={{ title: 'Namaz İlerlemesi' }} />
        <Stack.Screen name="EsmaulHusnaList" component={EsmaulHusnaListScreen} options={{ title: 'Esmâül Hüsnâ' }} />
        <Stack.Screen name="EsmaulHusnaDetail" component={EsmaulHusnaDetailScreen} options={{ title: 'Esmâ' }} />
        <Stack.Screen name="HadithList"      component={HadithListScreen}      options={{ title: '40 Hadis' }} />
        <Stack.Screen name="HadithDetail"    component={HadithDetailScreen}    options={{ title: 'Hadis' }} />
        <Stack.Screen name="GoodDeeds"       component={GoodDeedsScreen}       options={{ title: 'İyilik Defteri' }} />
        <Stack.Screen name="HatimTracker"    component={HatimTrackerScreen}    options={{ title: 'Hatim Takibi' }} />
        <Stack.Screen name="Kesfet"          component={KesfetScreen}          options={{ title: 'Tüm Özellikler' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
