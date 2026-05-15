import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import religiousDays from '../../../data/religiousDays.json';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type SpecialDay = {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'kandil' | 'uc_aylar' | 'asure' | 'ramazan' | 'yilbasi';
};
type ReligiousDaysByYear = Record<string, SpecialDay[]>;
type SpecialDayWithDate = SpecialDay & { dateObj: Date };

const MONTH_MAP_TR: Record<string, number> = {
  OCAK:1,ŞUBAT:2,SUBAT:2,MART:3,'NİSAN':4,NISAN:4,MAYIS:5,'HAZİRAN':6,HAZIRAN:6,
  TEMMUZ:7,'AĞUSTOS':8,AGUSTOS:8,'EYLÜL':9,EYLUL:9,'EKİM':10,EKIM:10,KASIM:11,ARALIK:12,
};

const TYPE_CONFIG: Record<SpecialDay['type'], { emoji: string; label: string; color: string }> = {
  kandil:   { emoji: '🕯️',  label: 'Kandil',    color: '#F59E0B' },
  uc_aylar: { emoji: '🌙',  label: 'Üç Aylar',  color: '#8B5CF6' },
  asure:    { emoji: '🫙',  label: 'Aşure',     color: '#0EA5E9' },
  ramazan:  { emoji: '🌙',  label: 'Ramazan',   color: '#22C55E' },
  yilbasi:  { emoji: '📅',  label: 'Hicrî Yılbaşı', color: palette.gold500 },
};

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS   = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

function inferType(title: string): SpecialDay['type'] {
  const u = title.toUpperCase();
  if (u.includes('ÜÇ AYLAR')) return 'uc_aylar';
  if (u.includes('AŞURE')) return 'asure';
  if (u.includes('YILBAŞI')) return 'yilbasi';
  if (u.includes('RAMAZAN BAŞLANGICI')) return 'ramazan';
  return 'kandil';
}

async function fetchRemote(year: string): Promise<SpecialDayWithDate[]> {
  const url = `https://vakithesaplama.diyanet.gov.tr/dinigunler.php?yil=${year}`;
  const res = await fetch(url);
  const text = await res.text();
  const result: SpecialDayWithDate[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line.includes('|')) continue;
    const relevant = ['KANDİL','KANDİLİ','BAŞLANGICI','AŞURE GÜNÜ','HİCRİ YILBAŞI'].some((k) => line.includes(k));
    if (!relevant) continue;
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 8) continue;
    const monthYear = parts[5];
    const titleRaw = parts[7];
    const match = monthYear.match(/([A-ZÇĞİÖŞÜ]+)\s*-?(\d{4})/i);
    if (!match) continue;
    const monthNum = MONTH_MAP_TR[match[1].toUpperCase().replace('.', '')];
    const yearNum = parseInt(match[2], 10);
    const dayNum = parseInt(parts[4], 10);
    if (!monthNum || !dayNum || !yearNum) continue;
    const dateObj = new Date(yearNum, monthNum - 1, dayNum);
    result.push({
      id: `${titleRaw.replace(/\s+/g, '-').toLowerCase()}-${yearNum}`,
      date: dateObj.toISOString().slice(0, 10),
      title: titleRaw.trim(),
      description: '',
      type: inferType(titleRaw),
      dateObj,
    });
  }
  result.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  return result;
}

function buildCalendarCells(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = (firstDay.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(dayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function IslamicCalendarScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const today = useMemo(() => new Date(), []);
  const todayKey = today.toISOString().slice(0, 10);
  const currentYear = String(today.getFullYear());

  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [events, setEvents]     = useState<SpecialDayWithDate[]>([]);

  const hijriString = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('tr-TR-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
    } catch { return ''; }
  }, [today]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchRemote(currentYear);
        if (!cancelled && remote.length > 0) { setEvents(remote); return; }
      } catch {}
      const all = religiousDays as ReligiousDaysByYear;
      const list = (all[currentYear] ?? []).map((e) => ({ ...e, dateObj: new Date(e.date) }));
      list.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      if (!cancelled) setEvents(list);
    })();
    return () => { cancelled = true; };
  }, [currentYear]);

  // Event date keys set for O(1) lookup
  const eventDateKeys = useMemo(() => new Set(events.map((e) => e.date)), [events]);

  const calCells = useMemo(() => buildCalendarCells(calYear, calMonth), [calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const upcomingEvents = events.filter((e) => {
    const diff = e.dateObj.getTime() - today.getTime();
    return diff >= -86400000 * 3; // show from 3 days ago
  }).slice(0, 8);

  const nextRamadan = events.find((e) => e.type === 'ramazan' && e.dateObj >= today);
  const ramadanDays = nextRamadan ? Math.ceil((nextRamadan.dateObj.getTime() - today.getTime()) / 86400000) : null;

  return (
    <IslamicBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd]} style={styles.hero}>
          <Text style={styles.heroLabel}>İSLAMİ TAKVİM</Text>
          <Text style={styles.heroTitle}>
            {today.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          {hijriString !== '' && (
            <Text style={styles.heroHijri}>🌙  Hicrî: {hijriString}</Text>
          )}
        </LinearGradient>

        {/* Ramadan countdown */}
        {ramadanDays !== null && ramadanDays > 0 && (
          <View style={[styles.ramadanCard, { backgroundColor: c.surface, borderColor: `${palette.green500}30` }]}>
            <Text style={{ fontSize: 28 }}>🌙</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: palette.gold500, letterSpacing: 1 }}>RAMAZAN GERİ SAYIM</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.text, marginTop: 2 }}>
                {ramadanDays} gün kaldı
              </Text>
              <View style={[styles.ramadanBar, { backgroundColor: `${palette.green500}15` }]}>
                <View style={[styles.ramadanFill, {
                  width: `${Math.max(0, Math.min(100, 100 - ramadanDays))}%`,
                  backgroundColor: palette.green400,
                }]} />
              </View>
            </View>
          </View>
        )}

        {/* Calendar */}
        <View style={[styles.calCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          {/* Month nav */}
          <View style={styles.calHeader}>
            <Text onPress={prevMonth} style={[styles.calArrow, { color: c.text }]}>‹</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>
              {TR_MONTHS[calMonth]} {calYear}
            </Text>
            <Text onPress={nextMonth} style={[styles.calArrow, { color: c.text }]}>›</Text>
          </View>

          {/* Day labels */}
          <View style={styles.calRow}>
            {TR_DAYS.map((d) => (
              <View key={d} style={styles.calCell}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: d === 'Cum' ? palette.gold500 : c.textSecondary }}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar cells */}
          {Array.from({ length: calCells.length / 7 }, (_, row) => (
            <View key={row} style={styles.calRow}>
              {calCells.slice(row * 7, row * 7 + 7).map((date, col) => {
                if (!date) return <View key={col} style={styles.calCell} />;
                const dateKey = date.toISOString().slice(0, 10);
                const isToday = dateKey === todayKey;
                const hasEvent = eventDateKeys.has(dateKey);
                const isFriday = date.getDay() === 5;
                return (
                  <View key={col} style={styles.calCell}>
                    <View style={[
                      styles.calDayInner,
                      isToday && { backgroundColor: c.primary },
                      !isToday && hasEvent && { backgroundColor: `${palette.gold500}18`, borderWidth: 1, borderColor: `${palette.gold500}40` },
                    ]}>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: isToday ? '900' : '400',
                        color: isToday ? '#fff' : isFriday ? palette.gold500 : c.text,
                      }}>
                        {date.getDate()}
                      </Text>
                      {hasEvent && !isToday && (
                        <View style={[styles.eventDot, { backgroundColor: palette.gold500 }]} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          <Text style={{ fontSize: 11, color: c.textSecondary, textAlign: 'center', marginTop: spacing.sm }}>
            🟡 Altın nokta = mübarek gün &nbsp;|&nbsp; Altın renk = Cuma
          </Text>
        </View>

        {/* Upcoming events */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={[t.heading2, { color: c.text, marginBottom: spacing.sm }]}>
            {upcomingEvents.length > 0 ? 'Yaklaşan Mübarek Günler' : 'Bu Yıl Özel Günler'}
          </Text>

          {events.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={{ fontSize: 13, color: c.textSecondary, textAlign: 'center' }}>
                Veri yüklenemedi. İnternet bağlantınızı kontrol edin.
              </Text>
            </View>
          )}

          {(upcomingEvents.length > 0 ? upcomingEvents : events.slice(0, 6)).map((e) => {
            const cfg = TYPE_CONFIG[e.type];
            const diffMs = e.dateObj.getTime() - today.getTime();
            const diffDays = Math.round(diffMs / 86400000);
            let badge = '';
            if (diffDays === 0) badge = 'Bugün';
            else if (diffDays === 1) badge = 'Yarın';
            else if (diffDays > 0) badge = `${diffDays} gün kaldı`;
            else if (diffDays === -1) badge = 'Dün';
            else badge = `${Math.abs(diffDays)} gün önce`;

            return (
              <View key={e.id} style={[styles.eventCard, { backgroundColor: c.surface, borderColor: c.border, borderLeftColor: cfg.color, borderLeftWidth: 3 }]}>
                <Text style={{ fontSize: 22, marginRight: spacing.sm }}>{cfg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{e.title}</Text>
                  <View style={styles.eventMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: `${cfg.color}15` }]}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: c.textSecondary }}>
                      {e.dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  {e.description && (
                    <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>{e.description}</Text>
                  )}
                </View>
                {badge && (
                  <View style={[styles.badgePill, { backgroundColor: diffDays === 0 ? `${cfg.color}20` : 'transparent', borderColor: `${cfg.color}40` }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>{badge}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </IslamicBackground>
  );
}

const styles = StyleSheet.create({
  hero:         { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel:    { fontSize: 11, fontWeight: '800', color: palette.gold400, letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:    { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  heroHijri:    { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  ramadanCard:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.xl, borderWidth: 1, ...shadows.card },
  ramadanBar:   { height: 6, borderRadius: 3, marginTop: spacing.xs, overflow: 'hidden' },
  ramadanFill:  { height: '100%', borderRadius: 3 },
  calCard:      { margin: spacing.lg, borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, ...shadows.card },
  calHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  calArrow:     { fontSize: 24, fontWeight: '300', paddingHorizontal: spacing.sm },
  calRow:       { flexDirection: 'row' },
  calCell:      { flex: 1, alignItems: 'center', paddingVertical: 3 },
  calDayInner:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  eventDot:     { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  emptyCard:    { padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  eventCard:    { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radii.lg, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, ...shadows.card },
  eventMeta:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 },
  typeBadge:    { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  badgePill:    { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full, borderWidth: 1, alignSelf: 'flex-start', marginLeft: spacing.xs },
});
