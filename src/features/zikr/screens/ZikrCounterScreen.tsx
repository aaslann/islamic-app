import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, textStyles } from '../../../theme/designSystem';
import { Card } from '../../../shared/components/Card';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';

const STORAGE_KEY = 'zikr-counter-presets-v2';

type ZikrHistoryEntry = {
  id: string;
  timestamp: string;
  count: number;
};

type ZikrPresetState = {
  count: number;
  target: number;
  history: ZikrHistoryEntry[];
};

type ZikrState = {
  activePhrase: string;
  presets: string[];
  data: Record<string, ZikrPresetState>;
};

const DEFAULT_PRESETS = ['Subhânallâh', 'Elhamdülillâh', 'Allahu Ekber'];

export default function ZikrCounterScreen() {
  const [activePhrase, setActivePhrase] = useState<string>(DEFAULT_PRESETS[0]);
  const [presets, setPresets] = useState<string[]>(DEFAULT_PRESETS);
  const [presetData, setPresetData] = useState<Record<string, ZikrPresetState>>(
    {},
  );
  const [newPhrase, setNewPhrase] = useState('');
  const [renamePhrase, setRenamePhrase] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ZikrState;
          setActivePhrase(parsed.activePhrase);
          setPresets(
            parsed.presets && parsed.presets.length
              ? parsed.presets
              : DEFAULT_PRESETS,
          );
          const normalizedData: Record<string, ZikrPresetState> = {};
          Object.entries(parsed.data ?? {}).forEach(([key, value]) => {
            normalizedData[key] = {
              count: value.count ?? 0,
              target: value.target ?? 33,
              history: value.history ?? [],
            };
          });
          setPresetData(normalizedData);
        } else {
          const initialData: Record<string, ZikrPresetState> = {};
          DEFAULT_PRESETS.forEach((p) => {
            initialData[p] = { count: 0, target: 33, history: [] };
          });
          setPresetData(initialData);
        }
      } catch {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    setRenamePhrase(activePhrase);
    setShowDeleteConfirm(false);
  }, [activePhrase]);

  const getCurrentState = (): ZikrState => ({
    activePhrase,
    presets,
    data: presetData,
  });

  const persistState = async (next: ZikrState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const current =
    presetData[activePhrase] ?? { count: 0, target: 33, history: [] };
  const count = current.count;
  const target = current.target;
  const history = current.history ?? [];

  const handleSaveSession = () => {
    if (count <= 0) return;
    const entry: ZikrHistoryEntry = {
      id: `${Date.now()}`,
      timestamp: new Date().toISOString(),
      count,
    };
    const nextHistory = [entry, ...history];
    const nextData = {
      ...presetData,
      [activePhrase]: { count: 0, target, history: nextHistory },
    };
    setPresetData(nextData);
    persistState({ ...getCurrentState(), data: nextData });
  };

  const handleIncrement = () => {
    const nextCount = count + 1;
    const nextData = {
      ...presetData,
      [activePhrase]: { ...current, count: nextCount },
    };
    setPresetData(nextData);
    persistState({ ...getCurrentState(), data: nextData });
  };

  const handleReset = () => {
    const nextData = {
      ...presetData,
      [activePhrase]: { ...current, count: 0 },
    };
    setPresetData(nextData);
    persistState({ ...getCurrentState(), data: nextData });
  };

  const handleSetTarget = (value: number) => {
    const nextData = {
      ...presetData,
      [activePhrase]: { count: 0, target: value, history },
    };
    setPresetData(nextData);
    persistState({ ...getCurrentState(), data: nextData });
  };

  const handleSelectPreset = (phrase: string) => {
    setActivePhrase(phrase);
    if (!presetData[phrase]) {
      const nextData = {
        ...presetData,
        [phrase]: { count: 0, target: 33, history: [] },
      };
      setPresetData(nextData);
      persistState({
        activePhrase: phrase,
        presets,
        data: nextData,
      });
    } else {
      persistState({ ...getCurrentState(), activePhrase: phrase });
    }
  };

  const handleAddPreset = () => {
    const trimmed = newPhrase.trim();
    if (!trimmed) return;
    if (presets.includes(trimmed)) {
      setActivePhrase(trimmed);
      setNewPhrase('');
      return;
    }
    const nextPresets = [...presets, trimmed];
    const nextData = {
      ...presetData,
      [trimmed]: { count: 0, target: 33, history: [] },
    };
    setPresets(nextPresets);
    setPresetData(nextData);
    setActivePhrase(trimmed);
    setNewPhrase('');
    persistState({
      activePhrase: trimmed,
      presets: nextPresets,
      data: nextData,
    });
  };

  const handleRenameActive = () => {
    const trimmed = renamePhrase.trim();
    if (!trimmed || trimmed === activePhrase) return;

    // Eğer zaten böyle bir zikir varsa sadece ona geç
    if (presets.includes(trimmed)) {
      setActivePhrase(trimmed);
      return;
    }

    const nextPresets = presets.map((p) =>
      p === activePhrase ? trimmed : p,
    );

    const { [activePhrase]: activeData, ...rest } = presetData;
    const nextData: Record<string, ZikrPresetState> = {
      ...rest,
      [trimmed]:
        activeData ??
        ({
          count: 0,
          target: 33,
          history: [],
        } as ZikrPresetState),
    };

    setPresets(nextPresets);
    setPresetData(nextData);
    setActivePhrase(trimmed);
    persistState({
      activePhrase: trimmed,
      presets: nextPresets,
      data: nextData,
    });
  };

  const handleDeleteActive = () => {
    if (presets.length <= 1) {
      return;
    }

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    const nextPresets = presets.filter((p) => p !== activePhrase);
    const { [activePhrase]: _removed, ...rest } = presetData;
    const nextData = rest;
    const nextActive = nextPresets[0] ?? DEFAULT_PRESETS[0];

    setPresets(nextPresets);
    setPresetData(nextData);
    setActivePhrase(nextActive);
    setShowDeleteConfirm(false);

    persistState({
      activePhrase: nextActive,
      presets: nextPresets,
      data: nextData,
    });
  };

  const progress = Math.min(target > 0 ? count / target : 0, 1);
  const progressPercent = Math.round(progress * 100);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <Text style={styles.title}>Zikir Sayacı</Text>
        <Text style={styles.subtitle}>
          Hedef belirleyip sayım yapabileceğin zikir sayacı. Seçtiğin zikir ve
          son sayımın cihazda saklanır.
        </Text>

        <View style={styles.phraseBox}>
          <Text style={styles.phraseLabel}>Zikir seçenekleri</Text>
          <View style={styles.presetRow}>
            {presets.map((p) => (
              <Pressable
                key={p}
                disabled={!isLoaded}
                onPress={() => handleSelectPreset(p)}
                style={({ pressed }) => [
                  styles.presetPill,
                  activePhrase === p && styles.presetPillActive,
                  pressed && styles.presetPillPressed,
                ]}
              >
                <Text
                  style={[
                    styles.presetPillText,
                    activePhrase === p && styles.presetPillTextActive,
                  ]}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.addRow}>
            <TextInput
              value={newPhrase}
              onChangeText={setNewPhrase}
              placeholder="Yeni zikir ekle..."
              placeholderTextColor={colors.textSoft}
              style={styles.phraseInput}
              editable={isLoaded}
            />
            <Pressable
              onPress={handleAddPreset}
              disabled={!isLoaded}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
            >
              <Text style={styles.addButtonText}>Ekle</Text>
            </Pressable>
          </View>

          <View style={styles.editRow}>
            <TextInput
              value={renamePhrase}
              onChangeText={setRenamePhrase}
              placeholder="Seçili zikri yeniden adlandır..."
              placeholderTextColor={colors.textSoft}
              style={styles.phraseInput}
              editable={isLoaded}
            />
            <Pressable
              onPress={handleRenameActive}
              disabled={!isLoaded}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
            >
              <Text style={styles.editButtonText}>Kaydet</Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteActive}
              disabled={!isLoaded || presets.length <= 1}
              style={({ pressed }) => [
                styles.deleteButton,
                showDeleteConfirm && styles.deleteButtonConfirm,
                pressed && styles.deleteButtonPressed,
              ]}
            >
              <Text style={styles.deleteButtonText}>
                {showDeleteConfirm ? 'Eminim, sil' : 'Sil'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.progressCircle}>
          <View style={styles.progressInner}>
            <Text style={styles.countText}>{count}</Text>
            <Text style={styles.targetText}>/ {target}</Text>
            <Text style={styles.percentText}>{progressPercent}%</Text>
          </View>
        </View>

        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Hızlı hedefler:</Text>
          {[33, 100, 1000].map((value) => (
            <Pressable
              key={value}
              onPress={() => handleSetTarget(value)}
              style={({ pressed }) => [
                styles.targetPill,
                target === value && styles.targetPillActive,
                pressed && styles.targetPillPressed,
              ]}
            >
              <Text
                style={[
                  styles.targetPillText,
                  target === value && styles.targetPillTextActive,
                ]}
              >
                {value}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.mainButtonWrapper}>
          <PrimaryButton
            label="+1 Zikir"
            onPress={handleIncrement}
            style={styles.mainButton}
          />
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={handleSaveSession} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </Pressable>
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Sıfırla</Text>
          </Pressable>
        </View>

        <View style={styles.historyBox}>
          <Text style={styles.historyTitle}>Kayıtlı zikirler</Text>
          {presets.map((phrase) => {
            const data =
              presetData[phrase] ?? { count: 0, target: 33, history: [] };
            const totalForPhrase = (data.history ?? []).reduce(
              (sum, h) => sum + h.count,
              0,
            );

            return (
              <View key={phrase} style={styles.historyGroup}>
                <View style={styles.historyGroupHeader}>
                  <Text style={styles.historyPhrase}>{phrase}</Text>
                  <Text style={styles.historySummary}>
                    Toplam: {totalForPhrase} zikir
                  </Text>
                </View>
                {(data.history ?? []).slice(0, 3).map((entry) => (
                  <View key={entry.id} style={styles.historyItem}>
                    <Text style={styles.historyCount}>{entry.count}</Text>
                    <Text style={styles.historyTime}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </Card>
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
    alignItems: 'stretch',
  },
  card: {
    alignItems: 'center',
  },
  title: {
    ...textStyles.heading1,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    ...textStyles.caption,
    textAlign: 'center',
  },
  phraseBox: {
    marginTop: spacing.lg,
    width: '100%',
  },
  phraseLabel: {
    ...textStyles.caption,
    marginBottom: spacing.xs,
  },
  phraseInput: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textDark,
    backgroundColor: colors.card,
    flex: 1,
    minWidth: 0,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
  },
  presetPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  presetPillPressed: {
    backgroundColor: '#E5F2ED',
  },
  presetPillText: {
    ...textStyles.caption,
    color: colors.textSoft,
  },
  presetPillTextActive: {
    color: colors.primaryDark,
    fontWeight: '500',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  addButtonText: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.white,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },
  editButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  editButtonText: {
    ...textStyles.caption,
    color: colors.primaryDark,
  },
  deleteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F97316',
  },
  deleteButtonPressed: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  deleteButtonConfirm: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  deleteButtonText: {
    ...textStyles.caption,
    color: '#F97316',
  },
  progressCircle: {
    marginTop: spacing.xl,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  progressInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...textStyles.hero,
    fontSize: 32,
  },
  targetText: {
    ...textStyles.caption,
    marginTop: spacing.xs,
  },
  percentText: {
    marginTop: spacing.xs,
    ...textStyles.caption,
    color: colors.primary,
  },
  targetRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  targetLabel: {
    ...textStyles.caption,
  },
  targetPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
  },
  targetPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  targetPillPressed: {
    backgroundColor: '#E5F2ED',
  },
  targetPillText: {
    ...textStyles.caption,
  },
  targetPillTextActive: {
    color: colors.primaryDark,
  },
  mainButtonWrapper: {
    marginTop: spacing.lg,
    width: '100%',
  },
  mainButton: {
    width: '100%',
  },
  actionsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  saveButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#22C55E',
  },
  saveButtonText: {
    ...textStyles.caption,
    color: '#22C55E',
  },
  resetButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
  },
  resetButtonText: {
    ...textStyles.caption,
    color: colors.textSoft,
  },
  historyBox: {
    marginTop: spacing.lg,
    width: '100%',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primarySoft,
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  historyTitle: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.textDark,
  },
  historyGroup: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.primarySoft,
  },
  historyGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  historyPhrase: {
    ...textStyles.caption,
    fontWeight: '500',
    color: colors.textDark,
  },
  historySummary: {
    fontSize: 11,
    color: colors.textSoft,
  },
  historyItem: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyCount: {
    ...textStyles.body,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 11,
    color: colors.textSoft,
  },
});

