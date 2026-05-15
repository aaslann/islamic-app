import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import religiousDays from '../../../data/religiousDays.json';
import { useTheme } from '../../../core/theme/ThemeContext';
import { spacing } from '../../../core/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type SpecialDay = {
  id: string;
  date: string; // YYYY-MM-DD (gregorian)
  title: string;
  description: string;
  type: 'kandil' | 'uc_aylar' | 'asure' | 'ramazan' | 'yilbasi';
};

type ReligiousDaysByYear = {
  [year: string]: SpecialDay[];
};

type SpecialDayWithDate = SpecialDay & { dateObj: Date };

const MONTH_MAP_TR: Record<string, number> = {
  OCAK: 1,
  ŞUBAT: 2,
  SUBAT: 2,
  MART: 3,
  NİSAN: 4,
  NISAN: 4,
  MAYIS: 5,
  HAZİRAN: 6,
  HAZIRAN: 6,
  TEMMUZ: 7,
  AĞUSTOS: 8,
  AGUSTOS: 8,
  EYLÜL: 9,
  EYLUL: 9,
  EKİM: 10,
  EKIM: 10,
  KASIM: 11,
  ARALIK: 12,
};

function inferTypeFromTitle(title: string): SpecialDay['type'] {
  const upper = title.toUpperCase();
  if (upper.includes('ÜÇ AYLAR')) return 'uc_aylar';
  if (upper.includes('AŞURE')) return 'asure';
  if (upper.includes('YILBAŞI')) return 'yilbasi';
  if (upper.includes('RAMAZAN BAŞLANGICI')) return 'ramazan';
  // Diğerleri genelde kandil olarak sınıflanabilir
  return 'kandil';
}

async function fetchRemoteReligiousDays(
  year: string,
): Promise<SpecialDayWithDate[]> {
  const url = `https://vakithesaplama.diyanet.gov.tr/dinigunler.php?yil=${year}`;
  const res = await fetch(url);
  const text = await res.text();

  const lines = text.split('\n');
  const result: SpecialDayWithDate[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.includes('KANDİL') && !line.includes('KANDİLİ') && !line.includes('BAŞLANGICI') && !line.includes('AŞURE GÜNÜ') && !line.includes('HİCRİ YILBAŞI')) {
      continue;
    }

    if (!line.includes('|')) continue;
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 8) continue;

    // Beklenen yapı (örnek):
    // | 26 | RECEB | 1447 | 15 | OCAK -2026 | PERŞEMBE | MİRAC KANDİLİ |
    const gregorianDay = parts[4];
    const monthYear = parts[5];
    const title = parts[7];

    const match = monthYear.match(/([A-ZÇĞİÖŞÜ]+)\s*-?(\d{4})/i);
    if (!match) continue;
    const monthName = match[1].toUpperCase().replace('.', '');
    const yearNum = parseInt(match[2], 10);
    const monthNum = MONTH_MAP_TR[monthName];
    const dayNum = parseInt(gregorianDay, 10);
    if (!monthNum || !dayNum || !yearNum) continue;

    const date = new Date(yearNum, monthNum - 1, dayNum);
    const id = `${title.replace(/\s+/g, '-').toLowerCase()}-${yearNum}`;

    result.push({
      id,
      date: date.toISOString().slice(0, 10),
      title: title.trim(),
      description: '',
      type: inferTypeFromTitle(title),
      dateObj: date,
    });
  }

  // Tarihe göre sırala
  result.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  return result;
}

export default function IslamicCalendarScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const currentYear = String(today.getFullYear());
  const [events, setEvents] = useState<SpecialDayWithDate[]>([]);

  const hijriString = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat('tr-TR-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return formatter.format(today);
    } catch {
      return 'Hicri tarih hesaplanamadı';
    }
  }, [today]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const remote = await fetchRemoteReligiousDays(currentYear);
        if (!cancelled && remote.length > 0) {
          setEvents(remote);
          return;
        }
      } catch {
        // remote okunamazsa JSON'a düş
      }

      const allByYear = religiousDays as ReligiousDaysByYear;
      const list = allByYear[currentYear] ?? [];
      const parsed: SpecialDayWithDate[] = list.map((e) => ({
        ...e,
        dateObj: new Date(e.date),
      }));
      parsed.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      if (!cancelled) {
        setEvents(parsed);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [currentYear]);

  const nextRamadan = events.find((e) => e.type === 'ramazan');

  const ramadanCountdown = useMemo(() => {
    if (!nextRamadan) return null;
    const diffMs = nextRamadan.dateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [nextRamadan, today]);

  return (
    <IslamicBackground>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={[styles.card, styles.headerCard]}>
          <Text style={[t.heading1, { color: c.text }]}>İslami Takvim</Text>
          <Text style={[t.caption, { marginTop: spacing.xs, color: c.textSecondary }]}>
            Bugünün hem miladî hem de hicrî tarihini ve yaklaşan mübarek günleri
            tek bakışta gör.
          </Text>
          <View
            style={[
              styles.todayBox,
              { backgroundColor: c.surface, borderColor: c.primarySoft },
            ]}
          >
            <Text style={{ fontSize: 12, color: c.textSecondary }}>Bugün</Text>
            <Text style={[t.body, { marginTop: spacing.xs, fontWeight: '600', color: c.text }]}>
              {today.toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Text style={{ marginTop: spacing.xs, fontSize: 12, color: c.textSecondary }}>
              Hicri: {hijriString}
            </Text>
          </View>
        </Card>

        {nextRamadan && ramadanCountdown != null && (
          <Card style={[styles.card, styles.ramadanCard]}>
            <Text style={[t.heading2, { color: c.text }]}>Ramazan Geri Sayım</Text>
            <Text style={[t.body, { marginTop: spacing.sm, color: c.text }]}>
              Ramazan başlangıcına{' '}
              <Text style={{ color: c.primary, fontWeight: '700' }}>{ramadanCountdown}</Text> gün
              kaldı.
            </Text>
            <View style={[styles.ramadanProgressTrack, { backgroundColor: c.primarySoft }]}>
              <View
                style={[
                  styles.ramadanProgressFill,
                  {
                    backgroundColor: c.primary,
                    width: `${Math.min(
                      100,
                      Math.max(0, 100 - ramadanCountdown),
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={[t.caption, { marginTop: spacing.xs, color: c.textSecondary }]}>
              Ramazan yaklaşırken oruca, Kur'an tilavetine ve sadakaya niyet
              tazelemek için güzel bir fırsat.
            </Text>
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={[t.heading2, { color: c.text }]}>Özel Günler</Text>
          {events.length === 0 ? (
            <Text style={[t.caption, { color: c.textSecondary }]}>
              Bu yıl için özel gün verisi yüklenemedi. İnternet bağlantını kontrol
              edebilir veya daha sonra tekrar deneyebilirsin.
            </Text>
          ) : (
            events.map((e) => {
              const isToday = e.date === todayKey;
              const diffMs = e.dateObj.getTime() - today.getTime();
              const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
              let badgeText = '';
              if (isToday) badgeText = 'Bugün';
              else if (diffDays > 0) badgeText = `${diffDays} gün kaldı`;
              else if (diffDays < 0)
                badgeText = `${Math.abs(diffDays)} gün önceydi`;

              return (
                <View
                  key={e.id}
                  style={[
                    styles.eventCard,
                    { backgroundColor: c.surface, borderColor: c.primarySoft },
                  ]}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventTitleBlock}>
                      <Text style={[t.body, { fontWeight: '600', color: c.text }]}>{e.title}</Text>
                      <Text style={{ marginTop: 2, fontSize: 11, color: c.textSecondary }}>
                        {e.type === 'kandil'
                          ? 'Kandil'
                          : e.type === 'ramazan'
                          ? 'Ramazan'
                          : e.type === 'uc_aylar'
                          ? 'Üç Aylar'
                          : e.type === 'asure'
                          ? 'Aşure'
                          : 'Özel Gün'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: c.textSecondary }}>
                      {e.dateObj.toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  {e.description ? (
                    <Text style={{ marginTop: spacing.xs, fontSize: 12, color: c.textSecondary }}>{e.description}</Text>
                  ) : null}
                  {badgeText ? (
                    <Text style={{ marginTop: spacing.xs, fontSize: 11, color: c.primary }}>{badgeText}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  todayBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ramadanCard: {
    borderRadius: 20,
  },
  ramadanProgressTrack: {
    marginTop: spacing.sm,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  ramadanProgressFill: {
    height: '100%',
  },
  eventCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  eventTitleBlock: {
    flex: 1,
    paddingRight: spacing.sm,
  },
});
