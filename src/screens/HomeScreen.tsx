import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../App';
import {useGemmaModel} from '../hooks/useGemmaModel';
import {COLORS} from '../constants/theme';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const {status, downloadProgress, error, initModel} = useGemmaModel();

  useEffect(() => {
    // Auto-initialize model on app launch
    initModel();
  }, []);

  const handleStart = () => {
    if (status !== 'ready') {
      Alert.alert('Model Loading', 'Please wait for the AI model to finish loading.');
      return;
    }
    navigation.navigate('Assessment');
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'downloading':
        return (
          <View style={styles.statusBadge}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>
              Downloading Gemma 4 E4B... {downloadProgress}%
            </Text>
          </View>
        );
      case 'loading':
        return (
          <View style={styles.statusBadge}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Loading model into NPU...</Text>
          </View>
        );
      case 'ready':
        return (
          <View style={[styles.statusBadge, styles.statusReady]}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, {color: COLORS.success}]}>
              Gemma 4 E4B — Ready (Offline)
            </Text>
          </View>
        );
      case 'error':
        return (
          <View style={[styles.statusBadge, styles.statusError]}>
            <Text style={[styles.statusText, {color: COLORS.critical}]}>
              Error: {error}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>PULSE-Neo</Text>
        <Text style={styles.tagline}>The Golden Minute Co-Pilot</Text>
      </View>

      {/* Hero stat */}
      <View style={styles.heroCard}>
        <Text style={styles.heroNumber}>2.5M</Text>
        <Text style={styles.heroLabel}>
          newborns die in their first 24 hours every year.
        </Text>
        <Text style={styles.heroSub}>
          Most are preventable. Most happen without internet.
        </Text>
      </View>

      {/* Model status */}
      <View style={styles.statusContainer}>{renderStatusBadge()}</View>

      {/* Protocol info */}
      <View style={styles.infoRow}>
        <InfoChip icon="📷" label="Vision" sub="Cyanosis detection" />
        <InfoChip icon="🎙️" label="Audio" sub="Cry analysis" />
        <InfoChip icon="📳" label="CPR" sub="100 BPM metronome" />
      </View>

      {/* Start button */}
      <TouchableOpacity
        style={[
          styles.startButton,
          status !== 'ready' && styles.startButtonDisabled,
        ]}
        onPress={handleStart}
        activeOpacity={0.8}>
        <Text style={styles.startButtonText}>
          {status === 'ready' ? 'BEGIN ASSESSMENT' : 'LOADING MODEL...'}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        Powered by Gemma 4 E4B · No internet required
      </Text>
    </SafeAreaView>
  );
}

function InfoChip({icon, label, sub}: {icon: string; label: string; sub: string}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 32,
    marginBottom: 28,
    alignItems: 'center',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  heroNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.critical,
    lineHeight: 72,
  },
  heroLabel: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  heroSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusReady: {
    borderColor: COLORS.success,
  },
  statusError: {
    borderColor: COLORS.critical,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  chip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipIcon: {fontSize: 24, marginBottom: 4},
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chipSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: COLORS.critical,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.surfaceElevated,
  },
  startButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
});
