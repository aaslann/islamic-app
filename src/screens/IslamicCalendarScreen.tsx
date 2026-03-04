import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import religiousDays from '../data/religiousDays.json';

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
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.title}>İslami Takvim</Text>
        <Text style={styles.subtitle}>
          Bugünün hem miladî hem de hicrî tarihini ve yaklaşan özel günleri
          gör. Özel gün verileri her yıl Diyanet&apos;in yayımladığı dini
          günler sayfasından otomatik alınmaya çalışılır; erişilemediğinde
          uygulama içi JSON yedek verisi kullanılır.
        </Text>
        <View style={styles.todayBox}>
          <Text style={styles.todayLabel}>Bugün</Text>
          <Text style={styles.todayValue}>
            {today.toLocaleDateString('tr-TR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.todayHijri}>Hicri: {hijriString}</Text>
        </View>
      </View>

      {nextRamadan && ramadanCountdown != null && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ramazan Geri Sayım</Text>
          <Text style={styles.countdownText}>
            Ramazan başlangıcına{' '}
            <Text style={styles.countdownNumber}>{ramadanCountdown}</Text> gün
            kaldı.
          </Text>
          <Text style={styles.tipText}>
            Ramazan yaklaşırken oruca, Kur’an tilavetine ve sadakaya niyet
            tazelemek için güzel bir fırsat.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Özel Günler</Text>
        {events.length === 0 ? (
          <Text style={styles.tipText}>
            Bu yıl için özel gün verisi yüklenemedi. İnternet bağlantını
            kontrol edebilir veya daha sonra tekrar deneyebilirsin.
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
              <View key={e.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{e.title}</Text>
                  <Text style={styles.eventDate}>
                    {e.dateObj.toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                {e.description ? (
                  <Text style={styles.eventDescription}>{e.description}</Text>
                ) : null}
                {badgeText ? (
                  <Text style={styles.eventBadge}>{badgeText}</Text>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#0B1120',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#9CA3AF',
  },
  todayBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  todayLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  todayValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  todayHijri: {
    marginTop: 2,
    fontSize: 12,
    color: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  countdownText: {
    marginTop: 8,
    fontSize: 14,
    color: '#E5E7EB',
  },
  countdownNumber: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  tipText: {
    marginTop: 6,
    fontSize: 12,
    color: '#9CA3AF',
  },
  eventCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  eventDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  eventDescription: {
    marginTop: 2,
    fontSize: 12,
    color: '#E5E7EB',
  },
  eventBadge: {
    marginTop: 4,
    fontSize: 11,
    color: '#38BDF8',
  },
});

