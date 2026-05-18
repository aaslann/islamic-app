export function isFriday(): boolean {
  return new Date().getDay() === 5;
}

export function daysUntilFriday(): number {
  const day = new Date().getDay();
  if (day === 5) return 0;
  return (5 - day + 7) % 7;
}

export function nextFridayLabel(): string {
  const d = daysUntilFriday();
  if (d === 0) return 'Bugün Cuma';
  if (d === 1) return 'Yarın Cuma';
  return `${d} gün sonra Cuma`;
}

const SALAVAT_OPTIONS = [
  {
    short: 'Allahümme salli',
    full: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    latin: 'Allâhümme salli alâ Muhammedin ve alâ âli Muhammed',
    meaning: 'Allah\'ım, Muhammed\'e ve Muhammed\'in âline salât eyle.',
  },
  {
    short: 'Salât-ı Münciye',
    full: 'اللَّهُمَّ صَلِّ صَلَاةً كَامِلَةً وَسَلِّمْ سَلَامًا تَامًّا عَلَى سَيِّدِنَا مُحَمَّدٍ',
    latin: 'Allâhümme salli salâten kâmileten ve sellim selâmen tâmmen alâ seyyidinâ Muhammedin',
    meaning: 'Allah\'ım, Efendimiz Muhammed\'e en kâmil salâtı ve en tam selâmı eyle.',
  },
];

export function getDailySalavat(): typeof SALAVAT_OPTIONS[number] {
  const idx = new Date().getDay() % SALAVAT_OPTIONS.length;
  return SALAVAT_OPTIONS[idx];
}

export const SALAVATLAR = SALAVAT_OPTIONS;
