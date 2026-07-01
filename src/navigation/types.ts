import type { NavigatorScreenParams } from '@react-navigation/native';

// Bottom tab navigator's screens. Lives here so both the tab navigator and the
// root stack (for nested navigation into a tab) can share one definition.
export type TabParamList = {
  Home: undefined;
  PrayerTimes: undefined;
  QuranSurahList: undefined;
  ZikrCounter: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  // MainTabs hosts the bottom tab navigator. To open a specific tab from a root
  // stack screen, navigate with: navigation.navigate('MainTabs', { screen: '...' }).
  MainTabs: NavigatorScreenParams<TabParamList>;
  // Tab screens are ALSO listed flat so screens already inside the tab navigator
  // can navigate to siblings by bare name. From a root stack screen use the
  // nested form above instead — a bare name won't resolve into the child navigator.
  Home: undefined;
  PrayerTimes: undefined;
  QuranSurahList: undefined;
  ZikrCounter: undefined;
  Settings: undefined;
  // Detail screens in the root stack
  Kesfet: undefined;
  PrayerGuide: undefined;
  PrayerLog: undefined;
  Qibla: undefined;
  QuranSurahDetail: { surahId: number; surahName: string };
  FavoriteAyahs: undefined;
  ElmaliliTafsir: undefined;
  Duas: undefined;
  IslamicCalendar: undefined;
  MosqueFinder: undefined;
  Analytics: undefined;
  Goals: undefined;
  RisaleNur: undefined;
  RamadanTracker: undefined;
  PrayerProgress: undefined;
  EsmaulHusnaList: undefined;
  EsmaulHusnaDetail: { no: number };
  HadithList: undefined;
  HadithDetail: { id: number };
  GoodDeeds: undefined;
  HatimTracker: undefined;
};
