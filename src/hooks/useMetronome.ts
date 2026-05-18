/**
 * useMetronome
 *
 * Drives the CPR metronome at exactly 100 BPM using the device vibration motor.
 * 100 BPM = one beat every 600ms, as per the Helping Babies Breathe protocol.
 */

import {useCallback, useRef, useState} from 'react';
import {Vibration} from 'react-native';
import {CPR_BPM} from '../constants/theme';

const BEAT_INTERVAL_MS = Math.round((60 / CPR_BPM) * 1000); // 600ms at 100 BPM
const VIBRATION_DURATION_MS = 80; // Short sharp pulse

export function useMetronome() {
  const [isRunning, setIsRunning] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);
    setBeatCount(0);

    // Immediate first beat
    Vibration.vibrate(VIBRATION_DURATION_MS);
    setBeatCount(1);

    intervalRef.current = setInterval(() => {
      Vibration.vibrate(VIBRATION_DURATION_MS);
      setBeatCount(prev => prev + 1);
    }, BEAT_INTERVAL_MS);
  }, [isRunning]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    Vibration.cancel();
    setIsRunning(false);
    setBeatCount(0);
  }, []);

  return {isRunning, beatCount, start, stop, bpm: CPR_BPM};
}
