import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const handleOpenPrayerTimes = () => {
    navigation.navigate('PrayerTimes');
  };

  const handleOpenPrayerGuide = () => {
    navigation.navigate('PrayerGuide');
  };

  const handleOpenQibla = () => {
    navigation.navigate('Qibla');
  };

  const handleOpenQuran = () => {
    navigation.navigate('QuranSurahList');
  };

  const handleOpenZikr = () => {
    navigation.navigate('ZikrCounter');
  };

  const handleOpenDuas = () => {
    navigation.navigate('Duas');
  };

  const handleOpenPrayerLog = () => {
    navigation.navigate('PrayerLog');
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const handleOpenRisaleNur = () => {
    navigation.navigate('RisaleNur');
  };

  const handleOpenElmalili = () => {
    navigation.navigate('ElmaliliTafsir');
  };

  const handleOpenAnalytics = () => {
    navigation.navigate('Analytics');
  };

  const handleOpenGoals = () => {
    navigation.navigate('Goals');
  };

  const handleOpenIslamicCalendar = () => {
    navigation.navigate('IslamicCalendar');
  };

  const handleOpenMosqueFinder = () => {
    navigation.navigate('MosqueFinder');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.appTitle}>İslami Asistan</Text>
        <Text style={styles.appSubtitle}>Günlük ibadetlerin için rehber</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İbadet Özeti</Text>
          <Text style={styles.sectionDescription}>
            Günlük ibadetlerinde en sık kullanacağın araçlar.
          </Text>

          <View style={styles.grid}>
            <FeatureCard
              title="Namaz Vakitleri"
              description="Bugünkü vakitler ve sıradaki ezan."
            >
              <Pressable
                onPress={handleOpenPrayerTimes}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Vakitleri Gör</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Namaz Kılavuzu"
              description="Adım adım namaz rehberi."
            >
              <Pressable
                onPress={handleOpenPrayerGuide}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Kılavuzu Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Namaz Hatıra Defteri"
              description="Kıldığın vakitleri gün gün işle."
            >
              <Pressable
                onPress={handleOpenPrayerLog}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Defteri Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Kıble Yönü"
              description="Pusula ile kıbleyi bul."
            >
              <Pressable
                onPress={handleOpenQibla}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Kıbleyi Bul</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Kur&apos;an-ı Kerim"
              description="Mushaf, meal ve tilavet (örnek)."
            >
              <Pressable
                onPress={handleOpenQuran}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Sureleri Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Risale-i Nur"
              description="Külliyatın ana eser başlıkları."
            >
              <Pressable
                onPress={handleOpenRisaleNur}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Külliyatı Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Elmalılı Tefsiri"
              description="Hak Dini Kur&apos;an Dili cilt yapısı."
            >
              <Pressable
                onPress={handleOpenElmalili}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Tefsiri Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Manevî Analiz"
              description="Haftalık ibadet istatistiklerin."
            >
              <Pressable
                onPress={handleOpenAnalytics}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Analizi Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Hedeflerim"
              description="Namaz, zikir ve Kur&apos;an hedeflerin."
            >
              <Pressable
                onPress={handleOpenGoals}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Hedefleri Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="İslami Takvim"
              description="Hicrî tarih ve özel günler."
            >
              <Pressable
                onPress={handleOpenIslamicCalendar}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Takvimi Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Cami Bulucu"
              description="Yakındaki camiler ve Cuma saati."
            >
              <Pressable
                onPress={handleOpenMosqueFinder}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Camileri Gör</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Zikir Sayacı"
              description="Hedef belirle, say ve kaydet."
            >
              <Pressable
                onPress={handleOpenZikr}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Sayacı Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Günlük Dualar"
              description="Sabah-akşam ve hayat duaları."
            >
              <Pressable
                onPress={handleOpenDuas}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Duaları Aç</Text>
              </Pressable>
            </FeatureCard>

            <FeatureCard
              title="Ayarlar"
              description="Tema ve yazı boyutu tercihlerin."
            >
              <Pressable
                onPress={handleOpenSettings}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Ayarları Aç</Text>
              </Pressable>
            </FeatureCard>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

function FeatureCard({ title, description, children }: FeatureCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      {children && <View style={styles.cardBody}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050816',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#050816',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  appSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#9CA3AF',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    columnGap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#0B1120',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  cardBody: {
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
    alignSelf: 'flex-start',
  },
  primaryButtonPressed: {
    backgroundColor: '#0EA5E9',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1120',
  },
  secondaryButton: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#38BDF8',
    alignSelf: 'flex-start',
  },
  secondaryButtonPressed: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#38BDF8',
  },
  placeholderBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#020617',
  },
  placeholderText: {
    fontSize: 13,
    color: '#E5E7EB',
  },
});

