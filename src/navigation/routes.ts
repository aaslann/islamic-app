export const Routes = {
  Home:              'Home',
  PrayerTimes:       'PrayerTimes',
  PrayerGuide:       'PrayerGuide',
  Qibla:             'Qibla',
  QuranSurahList:    'QuranSurahList',
  QuranSurahDetail:  'QuranSurahDetail',
  Duas:              'Duas',
  ZikrCounter:       'ZikrCounter',
  PrayerLog:         'PrayerLog',
  FavoriteAyahs:     'FavoriteAyahs',
  Settings:          'Settings',
  RisaleNur:         'RisaleNur',
  ElmaliliTafsir:    'ElmaliliTafsir',
  Analytics:         'Analytics',
  Goals:             'Goals',
  IslamicCalendar:   'IslamicCalendar',
  MosqueFinder:      'MosqueFinder',
  RamadanTracker:    'RamadanTracker',
  PrayerProgress:    'PrayerProgress',
} as const;

export type RouteName = (typeof Routes)[keyof typeof Routes];
