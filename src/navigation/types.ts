export type RootStackParamList = {
  MainTabs: undefined;
  // Tab screens — navigated via nested navigator lookup
  Home: undefined;
  PrayerTimes: undefined;
  QuranSurahList: undefined;
  ZikrCounter: undefined;
  Settings: undefined;
  // Detail screens in the root stack
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
};
