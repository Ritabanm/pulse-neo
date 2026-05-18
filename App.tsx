/**
 * PULSE-Neo: The Golden Minute Co-Pilot
 * Offline neonatal resuscitation triage powered by Gemma 4 E4B
 *
 * Built for the Kaggle Gemma 4 Good Hackathon
 * https://github.com/Ritabanm/pulse-neo
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import AssessmentScreen from './src/screens/AssessmentScreen';
import ResultScreen from './src/screens/ResultScreen';
import {COLORS} from './src/constants/theme';

export type RootStackParamList = {
  Home: undefined;
  Assessment: undefined;
  Result: {result: AssessmentResult};
};

export interface AssessmentResult {
  apgar_appearance: number;
  apgar_pulse: number;
  apgar_grimace: number;
  apgar_activity: number;
  apgar_respiration: number;
  total_apgar_score: number;
  severity: 'normal' | 'moderate_distress' | 'severe_distress';
  action: 'routine_care' | 'stimulation_and_oxygen' | 'start_cpr_metronome';
  reasoning: string;
}

const Stack = createStackNavigator<RootStackParamList>();

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyle: {backgroundColor: COLORS.background},
          }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Assessment" component={AssessmentScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
