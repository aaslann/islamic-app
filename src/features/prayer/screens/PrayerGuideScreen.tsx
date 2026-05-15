import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, spacing, textStyles } from '../../../theme/designSystem';
import { Card } from '../../../shared/components/Card';

type PrayerKey = 'sabah' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi' | 'vitir';

type PrayerPart = {
  id: string;
  title: string;
  rakaat: number;
  color: string;
  summary: string;
  steps: string[];
};

type PrayerGuide = {
  key: PrayerKey;
  label: string;
  totalRakaat: number;
  info: string;
  parts: PrayerPart[];
};

const PRAYER_GUIDES: PrayerGuide[] = [
  {
    key: 'sabah',
    label: 'Sabah Namazı',
    totalRakaat: 4,
    info: 'Sabah namazı 2 rekât sünnet + 2 rekât farz olmak üzere toplam 4 rekâttır.',
    parts: [
      {
        id: 'sabah-sunnet',
        title: '2 Rekât Sünnet',
        rakaat: 2,
        color: '#38BDF8',
        summary:
          'Sabah namazının sünneti sessiz okunur ve mümkünse evde sakin bir ortamda kılınır.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün sabah namazının sünnetini kılmaya.”',
          'İftitah tekbiri ile namaza başla; Subhâneke, eûzü-besmele, Fâtiha ve kısa bir sûre oku.',
          'Birinci rekâtta rükû ve iki secdeyi tam yap; ikinci rekâta kalkıp aynı şekilde kıraat ve rükûnları tamamla.',
          'Son oturuşta Ettehiyyâtü, salli-barik ve Rabbena dualarını okuyup sağa ve sola selam ver.',
        ],
      },
      {
        id: 'sabah-farz',
        title: '2 Rekât Farz',
        rakaat: 2,
        color: '#22C55E',
        summary:
          'Farz, cemaatle kılınıyorsa imama uyularak; yalnız kılınıyorsa sünnetle aynı tertipte eda edilir.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün sabah namazının farzını kılmaya.”',
          'İlk rekâtta Subhâneke, Fâtiha ve kısa bir sûre okuyup rükû ve secdeleri yerine getir.',
          'İkinci rekâtta yine Fâtiha ve sûre oku, rükû ve secdeden sonra tahiyyat oturuşuna geç.',
          'Ettehiyyâtü, salli-barik ve duaları okuduktan sonra sağa ve sola selam vererek namazı bitir.',
        ],
      },
    ],
  },
  {
    key: 'ogle',
    label: 'Öğle Namazı',
    totalRakaat: 10,
    info:
      'Öğle namazı 4 rekât ilk sünnet + 4 rekât farz + 2 rekât son sünnet olmak üzere toplam 10 rekâttır.',
    parts: [
      {
        id: 'ogle-sunnet',
        title: '4 Rekât İlk Sünnet',
        rakaat: 4,
        color: '#F97316',
        summary:
          'İlk iki rekâtta Fâtiha ile birlikte sûre okunur; üçüncü ve dördüncü rekâtlarda sadece Fâtiha okunur.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün öğle namazının ilk sünnetini kılmaya.”',
          'Her rekâtta Fâtiha; ilk iki rekâtta ayrıca kısa bir sûre oku; rükû ve secdeleri tam yap.',
          'İkinci rekât sonunda ilk oturuş; Ettehiyyâtü okunur, sonra üçüncü rekâta kalkılır.',
          'Dördüncü rekâttan sonra son oturuşta Ettehiyyâtü, salli-barik ve dualar okunup selam verilir.',
        ],
      },
      {
        id: 'ogle-farz',
        title: '4 Rekât Farz',
        rakaat: 4,
        color: '#A855F7',
        summary:
          'Farz, erkekler için mümkünse cemaatle; kadınlar için evde sakin bir ortamda kılınması tavsiye edilir.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün öğle namazının farzını kılmaya.”',
          'İlk iki rekâtta Fâtiha ve sûre, son iki rekâtta ise sadece Fâtiha okunur.',
          'İkinci rekât sonunda ilk oturuş yapılır, Ettehiyyâtü okunur ve üçüncü rekâta kalkılır.',
          'Dördüncü rekât sonrası son oturuşta Ettehiyyâtü, salli-barik, Rabbena ve diğer dualar okunup selam verilir.',
        ],
      },
      {
        id: 'ogle-son-sunnet',
        title: '2 Rekât Son Sünnet',
        rakaat: 2,
        color: '#FACC15',
        summary:
          'Öğlen farzından sonra kılınan bu sünnet, sabah sünnetine benzer şekilde kılınır.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün öğle namazının son sünnetini kılmaya.”',
          'İki rekât sabah sünneti tertibinde kılınır: Fâtiha ve sûre, rükû, secdeler ve son oturuş.',
          'Son oturuşta Ettehiyyâtü, salli-barik ve dualar okunur; sağa ve sola selam verilir.',
        ],
      },
    ],
  },
  {
    key: 'ikindi',
    label: 'İkindi Namazı',
    totalRakaat: 8,
    info:
      'İkindi namazı 4 rekât sünnet + 4 rekât farz olmak üzere toplam 8 rekâttır.',
    parts: [
      {
        id: 'ikindi-sunnet',
        title: '4 Rekât Sünnet',
        rakaat: 4,
        color: '#0EA5E9',
        summary:
          'İkindi sünneti, öğlen ilk sünnetine benzer şekilde 4 rekât olarak kılınır.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün ikindi namazının sünnetini kılmaya.”',
          'İlk iki rekâtta Fâtiha ve sûre; son iki rekâtta sadece Fâtiha okunur.',
          'İkinci rekât sonrası ilk oturuş, dördüncü rekât sonrası son oturuş yapılır.',
          'Son oturuşta gerekli dualar okunup selam verilir.',
        ],
      },
      {
        id: 'ikindi-farz',
        title: '4 Rekât Farz',
        rakaat: 4,
        color: '#22C55E',
        summary:
          'Farzı, öğle farzında olduğu gibi ilk iki rekâtta sûre ile, son iki rekâtta sadece Fâtiha ile kılınır.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün ikindi namazının farzını kılmaya.”',
          'İlk iki rekâtta Fâtiha ve sûre, son iki rekâtta Fâtiha ile namazı tamamla.',
          'İkinci rekâttan sonra ilk oturuş, dördüncü rekâttan sonra son oturuş yapılır.',
          'Son oturuşta dualar okunur ve selam verilerek namaz bitirilir.',
        ],
      },
    ],
  },
  {
    key: 'aksam',
    label: 'Akşam Namazı',
    totalRakaat: 5,
    info: 'Akşam namazı 3 rekât farz + 2 rekât sünnet olmak üzere toplam 5 rekâttır.',
    parts: [
      {
        id: 'aksam-farz',
        title: '3 Rekât Farz',
        rakaat: 3,
        color: '#F97316',
        summary:
          'Akşam farzı sesli okunur; ilk iki rekâtta Fâtiha ve sûre, üçüncü rekâtta sadece Fâtiha okunur.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün akşam namazının farzını kılmaya.”',
          'İlk iki rekâtta Fâtiha ve sûre okuyup rükû ve secdeleri tamamla.',
          'İkinci rekât sonunda otur, Ettehiyyâtü oku; üçüncü rekâta kalk.',
          'Üçüncü rekâtta sadece Fâtiha okunur; rükû ve secdeden sonra son oturuşta dualar okunup selam verilir.',
        ],
      },
      {
        id: 'aksam-sunnet',
        title: '2 Rekât Sünnet',
        rakaat: 2,
        color: '#38BDF8',
        summary:
          'Akşam farzından sonra kılınan 2 rekât sünnet, sabah sünnetine benzer bir tertiple kılınır.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün akşam namazının sünnetini kılmaya.”',
          'İki rekât boyunca Fâtiha ve sûre okuyarak rükû ve secdeleri yap.',
          'Son oturuşta Ettehiyyâtü, salli-barik ve duaları okuyup selam ver.',
        ],
      },
    ],
  },
  {
    key: 'yatsi',
    label: 'Yatsı Namazı',
    totalRakaat: 9,
    info:
      'Yatsı namazı 4 rekât ilk sünnet + 4 rekât farz + 2 rekât son sünnet (bazı kaynaklarda 11 rekât vitirle birlikte) olarak kılınır.',
    parts: [
      {
        id: 'yatsi-sunnet',
        title: '4 Rekât İlk Sünnet',
        rakaat: 4,
        color: '#6366F1',
        summary:
          'Tertip olarak öğle ve ikindi sünnetleri gibidir; ilk iki rekâtta sûre ile tilavet yapılır.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün yatsı namazının ilk sünnetini kılmaya.”',
          'İlk iki rekâtta Fâtiha ve sûre, son iki rekâtta yalnız Fâtiha okunur.',
          'İkinci rekât sonunda ilk oturuş, dördüncü rekât sonunda son oturuş yapılır.',
        ],
      },
      {
        id: 'yatsi-farz',
        title: '4 Rekât Farz',
        rakaat: 4,
        color: '#22C55E',
        summary:
          'Yatsı farzı, öğle ve ikindi farzına benzer; gecenin son farz namazıdır.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün yatsı namazının farzını kılmaya.”',
          'İlk iki rekâtta Fâtiha ve sûre, son iki rekâtta sadece Fâtiha okunur.',
          'İkinci rekât sonunda ilk oturuş; dördüncü rekât sonunda son oturuş ve dualar ile selam verilir.',
        ],
      },
      {
        id: 'yatsi-son-sunnet',
        title: '2 Rekât Son Sünnet',
        rakaat: 2,
        color: '#FACC15',
        summary: 'Yatsı farzından sonra kılınan 2 rekât son sünnettir.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için bugünün yatsı namazının son sünnetini kılmaya.”',
          'İki rekât boyunca Fâtiha ve sûre ile rükû ve secdeleri yerine getir.',
          'Son oturuşta Ettehiyyâtü ve diğer dualar okuyup selam ver.',
        ],
      },
    ],
  },
  {
    key: 'vitir',
    label: 'Vitir Namazı',
    totalRakaat: 3,
    info:
      'Vitir, yatsıdan sonra kılınan 3 rekâtlık vacip bir namazdır; özellikle Hanefî mezhebinde önemle vurgulanır.',
    parts: [
      {
        id: 'vitir-uc-rekat',
        title: '3 Rekât Vitir',
        rakaat: 3,
        color: '#EC4899',
        summary:
          'Vitir, üç rekâtlı bir namazdır; genellikle tek selamla bitirilir ve üçüncü rekâtta kunut duaları okunur.',
        steps: [
          'Niyet: “Niyet ettim Allah rızası için vitir namazını kılmaya.”',
          'İlk iki rekâtta Fâtiha ve sûre okuyup rükû ve secdeleri tamamla; ikinci rekât sonunda oturup Ettehiyyâtü oku ve üçüncü rekâta kalk.',
          'Üçüncü rekâtta Fâtiha ve sûre okuduktan sonra rükûya varmadan önce kunut dualarını (Allahümme innâ nesteînüke vb.) oku.',
          'Rükû ve secdeleri tamamlayıp son oturuşta duaları okuduktan sonra selam ver.',
        ],
      },
    ],
  },
];

export default function PrayerGuideScreen() {
  const [activePrayer, setActivePrayer] = useState<PrayerKey>('sabah');
  const current = PRAYER_GUIDES.find((g) => g.key === activePrayer)!;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.header}>
        <Text style={styles.title}>Namaz Kılavuzu</Text>
        <Text style={styles.subtitle}>
          Beş vakit namazı ve vitir namazını; rekâtlarına göre adım adım
          görebilirsin. Aşağıdaki sekmelerden hangi namazı incelemek
          istediğini seç.
        </Text>
      </Card>

      <View style={styles.tabsRow}>
        {PRAYER_GUIDES.map((guide) => (
          <Pressable
            key={guide.key}
            onPress={() => setActivePrayer(guide.key)}
            style={({ pressed }) => [
              styles.tabPill,
              activePrayer === guide.key && styles.tabPillActive,
              pressed && styles.tabPillPressed,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activePrayer === guide.key && styles.tabTextActive,
              ]}
            >
              {guide.label.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.currentHeader}>
        <Text style={styles.currentTitle}>{current.label}</Text>
        <Text style={styles.currentInfo}>{current.info}</Text>
      </View>

      {current.parts.map((part) => (
        <Card key={part.id} style={styles.partCard}>
          <View style={styles.partHeader}>
            <View
              style={[
                styles.partDot,
                { backgroundColor: part.color },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.partTitle}>{part.title}</Text>
              <Text style={styles.partBadge}>
                Toplam{' '}
                <Text style={styles.partBadgeNumber}>{part.rakaat}</Text> rekât
              </Text>
              <Text style={styles.partSummary}>{part.summary}</Text>
            </View>
          </View>

          {part.steps.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View
                style={[
                  styles.stepBullet,
                  { borderColor: part.color },
                ]}
              />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Card>
      ))}

      <Text style={styles.noteText}>
        Not: Bu kılavuz, genel bir özet ve öğretici görsel temsil sunar. Mezheplere
        göre bazı ayrıntılar değişebilir; detaylı bilgi için güvenilir ilmihal
        eserlerine ve Diyanet gibi resmî kaynaklara başvurman tavsiye edilir.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.heading1,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...textStyles.caption,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
  },
  tabPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  tabPillPressed: {
    backgroundColor: '#E5F2ED',
  },
  tabText: {
    fontSize: 12,
    color: colors.textSoft,
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  currentHeader: {
    marginBottom: spacing.xs,
  },
  currentTitle: {
    ...textStyles.heading2,
  },
  currentInfo: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSoft,
  },
  partCard: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  partHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  partDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  partTitle: {
    ...textStyles.body,
    fontWeight: '600',
  },
  partBadge: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textSoft,
  },
  partBadgeNumber: {
    color: colors.primary,
    fontWeight: '600',
  },
  partSummary: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSoft,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stepBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSoft,
  },
  noteText: {
    marginTop: spacing.lg,
    ...textStyles.caption,
  },
});

