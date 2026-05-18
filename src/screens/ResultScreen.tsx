/**
 * ResultScreen
 *
 * Displays the Gemma 4 E4B assessment result:
 * - Full APGAR score breakdown
 * - Severity classification
 * - Action triggered (routine care / stimulation / CPR metronome)
 *
 * For CRITICAL cases, automatically starts the 100 BPM CPR metronome.
 */

import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, AssessmentResult} from '../../App';
import {useMetronome} from '../hooks/useMetronome';
import {COLORS} from '../constants/theme';

type ResultRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultNavProp = StackNavigationProp<RootStackParamList, 'Result'>;

const APGAR_LABELS = [
  {key: 'apgar_appearance', label: 'Appearance', desc: 'Skin color'},
  {key: 'apgar_pulse', label: 'Pulse', desc: 'Heart rate'},
  {key: 'apgar_grimace', label: 'Grimace', desc: 'Reflex response'},
  {key: 'apgar_activity', label: 'Activity', desc: 'Muscle tone'},
  {key: 'apgar_respiration', label: 'Respiration', desc: 'Breathing'},
];

export default function ResultScreen() {
  const navigation = useNavigation<ResultNavProp>();
  const route = useRoute<ResultRouteProp>();
  const {result} = route.params;
  const metronome = useMetronome();

  const isCritical = result.action === 'start_cpr_metronome';
  const isModerate = result.action === 'stimulation_and_oxygen';

  // Auto-start CPR metronome for critical cases
  useEffect(() => {
    if (isCritical) {
      metronome.start();
    }
    return () => {
      metronome.stop();
    };
  }, []);

  const getActionColor = () => {
    if (isCritical) return COLORS.critical;
    if (isModerate) return COLORS.warning;
    return COLORS.success;
  };

  const getActionLabel = () => {
    switch (result.action) {
      case 'start_cpr_metronome':
        return '🚨 START CPR — 100 BPM';
      case 'stimulation_and_oxygen':
        return '⚠️ STIMULATION + OXYGEN';
      case 'routine_care':
        return '✅ ROUTINE CARE';
    }
  };

  const getSeverityLabel = () => {
    switch (result.severity) {
      case 'severe_distress': return 'SEVERE DISTRESS';
      case 'moderate_distress': return 'MODERATE DISTRESS';
      case 'normal': return 'NORMAL';
    }
  };

  const getScoreColor = (score: number) => {
    if (score === 2) return COLORS.success;
    if (score === 1) return COLORS.warning;
    return COLORS.critical;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Action banner */}
        <View style={[styles.actionBanner, {backgroundColor: getActionColor() + '22', borderColor: getActionColor()}]}>
          <Text style={[styles.actionText, {color: getActionColor()}]}>
            {getActionLabel()}
          </Text>
          <Text style={[styles.severityText, {color: getActionColor()}]}>
            {getSeverityLabel()}
          </Text>
        </View>

        {/* CPR Metronome */}
        {isCritical && (
          <View style={styles.metronomeCard}>
            <Text style={styles.metronomeTitle}>CPR METRONOME</Text>
            <Text style={styles.metronomeBPM}>{metronome.bpm} BPM</Text>
            <Text style={styles.metronomeBeats}>
              {metronome.isRunning ? `Beat ${metronome.beatCount}` : 'Stopped'}
            </Text>
            <Text style={styles.metronomeInstructions}>
              Push down 1/3 of chest depth.{'\n'}
              Allow full chest recoil between compressions.
            </Text>
            <TouchableOpacity
              style={[styles.metronomeBtn, metronome.isRunning && styles.metronomeBtnStop]}
              onPress={metronome.isRunning ? metronome.stop : metronome.start}>
              <Text style={styles.metronomeBtnText}>
                {metronome.isRunning ? '■ STOP' : '▶ START'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* APGAR Score */}
        <View style={styles.apgarCard}>
          <View style={styles.apgarHeader}>
            <Text style={styles.apgarTitle}>APGAR Score</Text>
            <Text style={[styles.apgarTotal, {color: getActionColor()}]}>
              {result.total_apgar_score}/10
            </Text>
          </View>

          {APGAR_LABELS.map(item => {
            const score = result[item.key as keyof AssessmentResult] as number;
            return (
              <View key={item.key} style={styles.apgarRow}>
                <View style={styles.apgarRowLeft}>
                  <Text style={styles.apgarRowLabel}>{item.label}</Text>
                  <Text style={styles.apgarRowDesc}>{item.desc}</Text>
                </View>
                <View style={[styles.apgarScore, {backgroundColor: getScoreColor(score) + '33', borderColor: getScoreColor(score)}]}>
                  <Text style={[styles.apgarScoreText, {color: getScoreColor(score)}]}>
                    {score}/2
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Reasoning */}
        <View style={styles.reasoningCard}>
          <Text style={styles.reasoningTitle}>Clinical Reasoning</Text>
          <Text style={styles.reasoningText}>{result.reasoning}</Text>
        </View>

        {/* Protocol reminder */}
        {isModerate && (
          <View style={[styles.protocolCard, {borderColor: COLORS.warning}]}>
            <Text style={styles.protocolTitle}>⚠️ Stimulation Protocol</Text>
            <Text style={styles.protocolText}>
              1. Dry and stimulate the baby{'\n'}
              2. Reposition airway (slight neck extension){'\n'}
              3. Suction mouth then nose if needed{'\n'}
              4. Provide supplemental oxygen{'\n'}
              5. Reassess in 30 seconds
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.newAssessmentBtn}
            onPress={() => {
              metronome.stop();
              navigation.navigate('Assessment');
            }}>
            <Text style={styles.newAssessmentText}>New Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => {
              metronome.stop();
              navigation.navigate('Home');
            }}>
            <Text style={styles.homeText}>Home</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 32}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  actionBanner: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 2,
  },
  metronomeCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.critical + '11',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.critical,
    alignItems: 'center',
  },
  metronomeTitle: {
    color: COLORS.critical,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 4,
  },
  metronomeBPM: {
    color: COLORS.textPrimary,
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 64,
  },
  metronomeBeats: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  metronomeInstructions: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  metronomeBtn: {
    backgroundColor: COLORS.critical,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  metronomeBtnStop: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.critical,
  },
  metronomeBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 2,
  },
  apgarCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  apgarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  apgarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  apgarTotal: {
    fontSize: 32,
    fontWeight: '900',
  },
  apgarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  apgarRowLeft: {flex: 1},
  apgarRowLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  apgarRowDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  apgarScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  apgarScoreText: {
    fontSize: 16,
    fontWeight: '800',
  },
  reasoningCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  reasoningText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  protocolCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
  },
  protocolTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.warning,
    marginBottom: 10,
  },
  protocolText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  newAssessmentBtn: {
    flex: 2,
    backgroundColor: COLORS.critical,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  newAssessmentText: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  homeBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  homeText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
});
