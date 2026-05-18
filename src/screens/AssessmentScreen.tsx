/**
 * AssessmentScreen
 *
 * The core Golden Minute UI. Displays a 60-second countdown timer,
 * captures visual and audio observations, and runs the Gemma 4 E4B
 * assessment when the attendant is ready.
 */

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../App';
import {useGemmaModel} from '../hooks/useGemmaModel';
import {COLORS, GOLDEN_MINUTE_SECONDS} from '../constants/theme';

type AssessmentNavProp = StackNavigationProp<RootStackParamList, 'Assessment'>;

// Observation options for the attendant to tap
const SKIN_OPTIONS = [
  {id: 'pink', label: 'Pink all over', score: 2, color: COLORS.success},
  {id: 'blue_extremities', label: 'Blue hands/feet only', score: 1, color: COLORS.warning},
  {id: 'blue_all', label: 'Blue / pale all over', score: 0, color: COLORS.critical},
];

const CRY_OPTIONS = [
  {id: 'strong', label: 'Strong cry', score: 2, color: COLORS.success},
  {id: 'weak', label: 'Weak / whimpering', score: 1, color: COLORS.warning},
  {id: 'absent', label: 'No cry', score: 0, color: COLORS.critical},
];

const TONE_OPTIONS = [
  {id: 'active', label: 'Active movement', score: 2, color: COLORS.success},
  {id: 'some', label: 'Some flexion', score: 1, color: COLORS.warning},
  {id: 'limp', label: 'Limp / flaccid', score: 0, color: COLORS.critical},
];

const HR_OPTIONS = [
  {id: 'above100', label: 'Above 100 bpm', score: 2, color: COLORS.success},
  {id: 'below100', label: 'Below 100 bpm', score: 1, color: COLORS.warning},
  {id: 'absent', label: 'No heartbeat', score: 0, color: COLORS.critical},
];

export default function AssessmentScreen() {
  const navigation = useNavigation<AssessmentNavProp>();
  const {status, runAssessment} = useGemmaModel();

  const [timeLeft, setTimeLeft] = useState(GOLDEN_MINUTE_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);
  const [skinColor, setSkinColor] = useState<string | null>(null);
  const [cryStrength, setCryStrength] = useState<string | null>(null);
  const [muscleTone, setMuscleTone] = useState<string | null>(null);
  const [heartRate, setHeartRate] = useState<string | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Timer countdown
  useEffect(() => {
    if (!timerStarted) return;
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, timeLeft]);

  // Pulse animation for the timer ring
  useEffect(() => {
    if (timeLeft <= 15 && timerStarted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 1.05, duration: 300, useNativeDriver: true}),
          Animated.timing(pulseAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
        ]),
      ).start();
    }
  }, [timeLeft, timerStarted]);

  const getTimerColor = () => {
    if (timeLeft > 30) return COLORS.success;
    if (timeLeft > 15) return COLORS.warning;
    return COLORS.critical;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const canAssess = skinColor && cryStrength && muscleTone && heartRate;

  const handleAssess = useCallback(async () => {
    if (!canAssess) {
      Alert.alert('Incomplete', 'Please select all four observations before assessing.');
      return;
    }

    setIsAssessing(true);

    const visualDescription = `Skin color: ${skinColor}. Muscle tone: ${muscleTone}.`;
    const audioDescription = `Cry strength: ${cryStrength}. Heart rate: ${heartRate}.`;

    const result = await runAssessment(visualDescription, audioDescription);

    setIsAssessing(false);

    if (result) {
      navigation.navigate('Result', {result});
    } else {
      Alert.alert('Assessment Failed', 'Could not complete assessment. Please try again.');
    }
  }, [canAssess, skinColor, cryStrength, muscleTone, heartRate, runAssessment, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Golden Minute</Text>
        </View>

        {/* Timer */}
        <Animated.View style={[styles.timerContainer, {transform: [{scale: pulseAnim}]}]}>
          <View style={[styles.timerRing, {borderColor: getTimerColor()}]}>
            <Text style={[styles.timerText, {color: getTimerColor()}]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={styles.timerLabel}>seconds remaining</Text>
          </View>
          {!timerStarted && (
            <TouchableOpacity
              style={styles.startTimerBtn}
              onPress={() => setTimerStarted(true)}>
              <Text style={styles.startTimerText}>START TIMER</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Observation sections */}
        <ObservationSection
          title="Skin Color"
          emoji="👁️"
          options={SKIN_OPTIONS}
          selected={skinColor}
          onSelect={setSkinColor}
        />
        <ObservationSection
          title="Cry Strength"
          emoji="🎙️"
          options={CRY_OPTIONS}
          selected={cryStrength}
          onSelect={setCryStrength}
        />
        <ObservationSection
          title="Muscle Tone"
          emoji="💪"
          options={TONE_OPTIONS}
          selected={muscleTone}
          onSelect={setMuscleTone}
        />
        <ObservationSection
          title="Heart Rate"
          emoji="❤️"
          options={HR_OPTIONS}
          selected={heartRate}
          onSelect={setHeartRate}
        />

        {/* Assess button */}
        <TouchableOpacity
          style={[
            styles.assessButton,
            (!canAssess || isAssessing) && styles.assessButtonDisabled,
          ]}
          onPress={handleAssess}
          disabled={!canAssess || isAssessing}
          activeOpacity={0.8}>
          <Text style={styles.assessButtonText}>
            {isAssessing ? 'GEMMA 4 ASSESSING...' : 'RUN ASSESSMENT'}
          </Text>
        </TouchableOpacity>

        <View style={{height: 32}} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ObservationSection({
  title,
  emoji,
  options,
  selected,
  onSelect,
}: {
  title: string;
  emoji: string;
  options: {id: string; label: string; score: number; color: string}[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {emoji} {title}
      </Text>
      <View style={styles.optionsRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.optionBtn,
              selected === opt.id && {
                borderColor: opt.color,
                backgroundColor: opt.color + '22',
              },
            ]}
            onPress={() => onSelect(opt.id)}>
            <Text
              style={[
                styles.optionText,
                selected === opt.id && {color: opt.color, fontWeight: '700'},
              ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 8,
  },
  backBtn: {paddingRight: 16},
  backText: {color: COLORS.primary, fontSize: 16},
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  timerText: {
    fontSize: 40,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  startTimerBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startTimerText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  optionsRow: {gap: 8},
  optionBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  assessButton: {
    marginHorizontal: 20,
    backgroundColor: COLORS.critical,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  assessButtonDisabled: {
    backgroundColor: COLORS.surfaceElevated,
  },
  assessButtonText: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
