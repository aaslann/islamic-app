import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import religiousDays from '../../../data/religiousDays.json';
import { useTheme } from '../../../core/theme/ThemeContext';
import { palette, radii, shadows, spacing } from '../../../core/theme/tokens';
import { IslamicBackground } from '../../../shared/components/IslamicBackground';

type SpecialDayType = 'kandil' | 'uc_aylar' | 'asure' | 'ramazan' | 'yilbasi' | 'bayram';

type SpecialDay = {
  id: string;
  date: string;          // YYYY-MM-DD, local-calendar date (no timezone)
  title: string;
  description: string;
  type: SpecialDayType;
};
type ReligiousDaysByYear = Record<string, SpecialDay[]>;
type SpecialDayWithDate = SpecialDay & { dateObj: Date };

const TYPE_CONFIG: Record<SpecialDayType, { emoji: string; label: string; color: string }> = {
  kandil:   { emoji: '🕯️',  label: 'Kandil',     color: '#F59E0B' },
  uc_aylar: { emoji: '🌙',  label: 'Üç Aylar',   color: '#8B5CF6' },
  asure:    { emoji: '🫙',  label: 'Aşure',      color: '#0EA5E9' },
  ramazan:  { emoji: '🌙',  label: 'Ramazan',    color: '#22C55E' },
  yilbasi:  { emoji: '📅',  label: 'Hicrî Yılbaşı', color: palette.gold500 },
  bayram:   { emoji: '🎉',  label: 'Bayram',     color: '#EF4444' },
};

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS   = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

// Timezone-safe: parse 'YYYY-MM-DD' as a local calendar date (not UTC).
function parseLocalISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

// Timezone-safe: format a local Date as 'YYYY-MM-DD'.
function formatLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
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

// Load events from a window of years (previous, current, next) so the
// "upcoming" list is never empty and the calendar can highlight events
// that span year boundaries.
function loadEventsForWindow(centerYear: number): SpecialDayWithDate[] {
  const all = religiousDays as ReligiousDaysByYear;
  const years = [centerYear - 1, centerYear, centerYear + 1];
  const out: SpecialDayWithDate[] = [];
  for (const y of years) {
    const list = all[String(y)] ?? [];
    for (const e of list) {
      out.push({ ...e, dateObj: parseLocalISO(e.date) });
    }
  }
  // Dedupe by id (year boundaries can list same event twice across files)
  const seen = new Set<string>();
  const deduped = out.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  deduped.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  return deduped;
}

export default function IslamicCalendarScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.text;

  const today = useMemo(() => new Date(), []);
  const todayKey = formatLocalISO(today);

  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [events, setEvents]     = useState<SpecialDayWithDate[]>([]);

  // Hijri date via Intl (works on iOS/Android via Hermes intl polyfill / native)
  const hijriString = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('tr-TR-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(today);
    } catch { return ''; }
  }, [today]);

  // Load a 3-year window centered on the visible calendar year.
  useEffect(() => {
    setEvents(loadEventsForWindow(calYear));
  }, [calYear]);

  const eventByDateKey = useMemo(() => {
    const map = new Map<string, SpecialDayWithDate>();
    for (const e of events) map.set(e.date, e);
    return map;
  }, [events]);

  const calCells = useMemo(() => buildCalendarCells(calYear, calMonth), [calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };
  const jumpToToday = () => {
    setCalMonth(today.getMonth());
    setCalYear(today.getFullYear());
  };

  // Upcoming events: from today forward, take up to 8.
  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => daysBetween(today, e.dateObj) >= 0)
      .slice(0, 8);
  }, [events, today]);

  // Hero countdown: nearest upcoming event of any type.
  const nextEvent = upcomingEvents[0] ?? null;
  const nextEventDays = nextEvent ? daysBetween(today, nextEvent.dateObj) : null;

  // Ramadan-specific countdown (only when not currently in Ramadan).
  const nextRamadan = useMemo(() => {
    return events.find((e) => e.type === 'ramazan' && daysBetween(today, e.dateObj) >= 0);
  }, [events, today]);
  const ramadanDays = nextRamadan ? daysBetween(today, nextRamadan.dateObj) : null;

  return (
    <IslamicBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[c.heroGradientStart, c.heroGradientEnd]} style={styles.hero}>
          <Text style={styles.heroLabel}>İSLAMİ TAKVİM</Text>
          <Text style={styles.heroTitle}>
            {today.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          {!!hijriString && (
            <Text style={styles.heroHijri}>🌙  Hicrî: {hijriString}</Text>
          )}
          {nextEvent && nextEventDays !== null && (
            <Text style={styles.heroNext}>
              {nextEventDays === 0
                ? `${TYPE_CONFIG[nextEvent.type].emoji} Bugün: ${nextEvent.title}`
                : nextEventDays === 1
                  ? `${TYPE_CONFIG[nextEvent.type].emoji} Yarın: ${nextEvent.title}`
                  : `${TYPE_CONFIG[nextEvent.type].emoji} ${nextEvent.title}'a ${nextEventDays} gün`}
            </Text>
          )}
        </LinearGradient>

        {/* Ramadan countdown — only show if not the same as nextEvent */}
        {ramadanDays !== null && ramadanDays > 0 && nextRamadan?.id !== nextEvent?.id && (
          <View style={[styles.ramadanCard, { backgroundColor: c.surface, borderColor: `${palette.green500}30` }]}>
            <Text style={{ fontSize: 28 }}>🌙</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: palette.gold500, letterSpacing: 1 }}>RAMAZAN GERİ SAYIM</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.text, marginTop: 2 }}>
                {ramadanDays} gün kaldı
              </Text>
              <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
                {nextRamadan?.dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <View style={[styles.ramadanBar, { backgroundColor: `${palette.green500}15` }]}>
                <View style={[styles.ramadanFill, {
                  width: `${Math.max(0, Math.min(100, 100 - Math.min(ramadanDays, 100)))}%`,
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
            <Text onPress={prevMonth} style={[styles.calArrow, { color: c.text }]} suppressHighlighting>‹</Text>
            <Text
              onPress={jumpToToday}
              style={{ fontSize: 16, fontWeight: '700', color: c.text }}
              suppressHighlighting
            >
              {TR_MONTHS[calMonth]} {calYear}
            </Text>
            <Text onPress={nextMonth} style={[styles.calArrow, { color: c.text }]} suppressHighlighting>›</Text>
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
                const dateKey = formatLocalISO(date);
                const isToday = dateKey === todayKey;
                const event = eventByDateKey.get(dateKey);
                const isFriday = date.getDay() === 5;
                const dotColor = event ? TYPE_CONFIG[event.type].color : null;
                return (
                  <View key={col} style={styles.calCell}>
                    <View style={[
                      styles.calDayInner,
                      isToday && { backgroundColor: c.primary },
                      !isToday && event && { backgroundColor: `${dotColor}18`, borderWidth: 1, borderColor: `${dotColor}40` },
                    ]}>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: isToday ? '900' : event ? '700' : '400',
                        color: isToday ? '#fff' : isFriday ? palette.gold500 : c.text,
                      }}>
                        {date.getDate()}
                      </Text>
                      {event && !isToday && dotColor && (
                        <View style={[styles.eventDot, { backgroundColor: dotColor }]} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          <Text style={{ fontSize: 11, color: c.textSecondary, textAlign: 'center', marginTop: spacing.sm }}>
            Renkli nokta = mübarek gün · Altın = Cuma · Ay başlığına dokun = bugüne dön
          </Text>
        </View>

        {/* Upcoming events */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={[t.heading2, { color: c.text, marginBottom: spacing.sm }]}>
            Yaklaşan Mübarek Günler
          </Text>

          {events.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={{ fontSize: 13, color: c.textSecondary, textAlign: 'center' }}>
                Bu yıl için kayıtlı özel gün bulunamadı.
              </Text>
            </View>
          )}

          {upcomingEvents.length === 0 && events.length > 0 && (
            <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={{ fontSize: 13, color: c.textSecondary, textAlign: 'center' }}>
                Yaklaşan özel gün yok. Gelecek yıl için takvim güncellenecek.
              </Text>
            </View>
          )}

          {upcomingEvents.map((e) => {
            const cfg = TYPE_CONFIG[e.type];
            const diffDays = daysBetween(today, e.dateObj);
            let badge = '';
            let badgeAccent = false;
            if (diffDays === 0)      { badge = 'Bugün'; badgeAccent = true; }
            else if (diffDays === 1) { badge = 'Yarın'; badgeAccent = true; }
            else if (diffDays <= 7)  { badge = `${diffDays} gün kaldı`; badgeAccent = true; }
            else                     { badge = `${diffDays} gün`; }

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
                      {e.dateObj.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  {!!e.description && (
                    <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 4 }} numberOfLines={2}>
                      {e.description}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.badgePill,
                  { borderColor: `${cfg.color}40` },
                  badgeAccent && { backgroundColor: `${cfg.color}20` },
                ]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>{badge}</Text>
                </View>
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
  heroNext:     { fontSize: 13, color: palette.gold400, marginTop: 6, fontWeight: '600' },
  ramadanCard:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.xl, borderWidth: 1, ...shadows.card },
  ramadanBar:   { height: 6, borderRadius: 3, marginTop: spacing.xs, overflow: 'hidden' },
  ramadanFill:  { height: '100%', borderRadius: 3 },
  calCard:      { margin: spacing.lg, borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, ...shadows.card },
  calHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  calArrow:     { fontSize: 28, fontWeight: '300', paddingHorizontal: spacing.md, paddingVertical: 4 },
  calRow:       { flexDirection: 'row' },
  calCell:      { flex: 1, alignItems: 'center', paddingVertical: 3 },
  calDayInner:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  eventDot:     { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  emptyCard:    { padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  eventCard:    { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radii.lg, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, ...shadows.card },
  eventMeta:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3, flexWrap: 'wrap' },
  typeBadge:    { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  badgePill:    { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full, borderWidth: 1, alignSelf: 'flex-start', marginLeft: spacing.xs },
});
