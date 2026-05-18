/**
 * useGemmaModel
 *
 * Core hook for loading and running Gemma 4 E4B via the Cactus framework.
 * Handles model initialization, multimodal prompt construction, and
 * structured JSON output parsing via function calling.
 */

import {useState, useCallback, useRef} from 'react';
import {CactusLM} from '@cactus-compute/react-native-cactus';
import {AssessmentResult} from '../../App';

// Gemma 4 E4B quantized model — downloaded on first run via Cactus
const MODEL_REPO = 'google/gemma-4-E4B-it';
const MODEL_FILE = 'gemma-4-E4B-it-Q4_K_M.gguf';

// The tool schema — forces Gemma 4 to output structured APGAR JSON
const APGAR_TOOL_SCHEMA = {
  type: 'function',
  function: {
    name: 'log_apgar_and_action',
    description:
      'Log the APGAR score and trigger the appropriate medical action based on neonatal assessment.',
    parameters: {
      type: 'object',
      properties: {
        apgar_appearance: {
          type: 'integer',
          description:
            'Skin color: 0=blue/pale all over, 1=blue extremities only, 2=pink all over',
        },
        apgar_pulse: {
          type: 'integer',
          description: 'Heart rate: 0=absent, 1=below 100 bpm, 2=above 100 bpm',
        },
        apgar_grimace: {
          type: 'integer',
          description:
            'Reflex response: 0=no response, 1=grimace, 2=cry/cough/sneeze',
        },
        apgar_activity: {
          type: 'integer',
          description:
            'Muscle tone: 0=limp/flaccid, 1=some flexion, 2=active motion',
        },
        apgar_respiration: {
          type: 'integer',
          description:
            'Breathing: 0=absent, 1=weak/irregular, 2=strong cry',
        },
        total_apgar_score: {
          type: 'integer',
          description: 'Total APGAR score (0-10). Sum of all five components.',
        },
        severity: {
          type: 'string',
          enum: ['normal', 'moderate_distress', 'severe_distress'],
          description:
            'Severity: normal (7-10), moderate_distress (4-6), severe_distress (0-3)',
        },
        action: {
          type: 'string',
          enum: [
            'routine_care',
            'stimulation_and_oxygen',
            'start_cpr_metronome',
          ],
          description:
            'Clinical action: routine_care (7-10), stimulation_and_oxygen (4-6), start_cpr_metronome (0-3)',
        },
        reasoning: {
          type: 'string',
          description: 'Brief clinical reasoning for the assessment',
        },
      },
      required: [
        'apgar_appearance',
        'apgar_pulse',
        'apgar_grimace',
        'apgar_activity',
        'apgar_respiration',
        'total_apgar_score',
        'severity',
        'action',
        'reasoning',
      ],
    },
  },
};

const SYSTEM_PROMPT = `You are PULSE-Neo, an expert neonatal resuscitation AI assistant embedded in a mobile app.
You are helping a birth attendant during the critical Golden Minute after birth.
Analyze the provided clinical observations and ALWAYS call the log_apgar_and_action tool with your complete assessment.
Follow the Helping Babies Breathe (HBB) protocol. Be precise and decisive.`;

export type ModelStatus =
  | 'idle'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'inferring'
  | 'error';

export function useGemmaModel() {
  const [status, setStatus] = useState<ModelStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<CactusLM | null>(null);

  const initModel = useCallback(async () => {
    try {
      setStatus('downloading');
      setError(null);

      // Initialize Cactus with Gemma 4 E4B
      // pro: true enables NPU acceleration on supported Snapdragon/Tensor chips
      const model = await CactusLM.init({
        repoId: MODEL_REPO,
        filename: MODEL_FILE,
        pro: true, // NPU acceleration
        onProgress: (progress: number) => {
          setDownloadProgress(Math.round(progress * 100));
        },
      });

      modelRef.current = model;
      setStatus('ready');
    } catch (err: any) {
      setError(err.message || 'Failed to load model');
      setStatus('error');
    }
  }, []);

  const runAssessment = useCallback(
    async (
      visualDescription: string,
      audioDescription: string,
    ): Promise<AssessmentResult | null> => {
      if (!modelRef.current || status !== 'ready') {
        return null;
      }

      setStatus('inferring');

      try {
        const userPrompt = `GOLDEN MINUTE ASSESSMENT

VISUAL OBSERVATIONS (camera analysis):
${visualDescription}

AUDIO OBSERVATIONS (microphone analysis):
${audioDescription}

Please assess this newborn immediately and call log_apgar_and_action with your findings.`;

        const response = await modelRef.current.completion({
          messages: [
            {role: 'system', content: SYSTEM_PROMPT},
            {role: 'user', content: userPrompt},
          ],
          tools: [APGAR_TOOL_SCHEMA],
          tool_choice: 'required', // Force tool call
          temperature: 0.1,
          max_tokens: 400,
        });

        // Parse the tool call from the response
        const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const result = JSON.parse(toolCall.function.arguments) as AssessmentResult;
          setStatus('ready');
          return result;
        }

        // Fallback: try to parse JSON directly from content
        const content = response.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]) as AssessmentResult;
          setStatus('ready');
          return result;
        }

        throw new Error('Model did not return structured output');
      } catch (err: any) {
        setError(err.message);
        setStatus('ready');
        return null;
      }
    },
    [status],
  );

  const releaseModel = useCallback(() => {
    if (modelRef.current) {
      modelRef.current.release?.();
      modelRef.current = null;
      setStatus('idle');
    }
  }, []);

  return {
    status,
    downloadProgress,
    error,
    initModel,
    runAssessment,
    releaseModel,
  };
}
