# PULSE-Neo: The Golden Minute Co-Pilot

> **Offline multimodal neonatal resuscitation triage powered by Gemma 4 E4B.**  
> Built for the [Kaggle Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon) · Google DeepMind × Kaggle · 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Model: Gemma 4 E4B](https://img.shields.io/badge/Model-Gemma%204%20E4B-blue)](https://huggingface.co/google/gemma-4-E4B-it)
[![Framework: React Native](https://img.shields.io/badge/Framework-React%20Native-61DAFB)](https://reactnative.dev)
[![Inference: Cactus](https://img.shields.io/badge/Inference-Cactus-green)](https://cactuscompute.com)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%2026%2B-brightgreen)](https://developer.android.com)

---

## The Problem

Every year, **2.5 million newborns die within their first 24 hours of life.** The majority of these deaths occur in low-resource settings — rural clinics, home births, community health posts — where a single birth attendant is alone, without internet connectivity, and without access to a neonatal specialist.

The clinical window for intervention is called the **Golden Minute**: the 60 seconds after birth during which a rapid APGAR assessment and immediate action can mean the difference between life and death. The Helping Babies Breathe (HBB) protocol — the global standard for neonatal resuscitation — is well-established. The bottleneck is not knowledge of the protocol. It is the ability to apply it correctly, alone, under extreme stress, in real time.

**PULSE-Neo puts a neonatal specialist in every birth attendant's pocket.**

---

## The Solution

PULSE-Neo is an offline-first Android application that acts as a real-time clinical co-pilot during the Golden Minute. It uses **Gemma 4 E4B** — Google DeepMind's most capable edge-deployable model — running entirely on-device with no internet connection required.

The attendant opens the app, starts the 60-second timer, and selects their observations across four clinical dimensions. Gemma 4 E4B processes the inputs and returns a **structured APGAR score** via function calling, triggering one of three actions:

| APGAR Score | Severity | Action |
| :--- | :--- | :--- |
| 7–10 | Normal | Routine care guidance |
| 4–6 | Moderate distress | Stimulation + oxygen protocol |
| 0–3 | Severe distress | **CPR metronome activates at 100 BPM** |

The CPR metronome uses the device's vibration motor to pulse at exactly 100 BPM — the rate specified by the HBB protocol — guiding chest compressions without requiring the attendant to count or watch a screen.

---

## Why Gemma 4 E4B Specifically

This project is not a wrapper around a generic LLM API. It requires Gemma 4 E4B because no other model combines all four of the following capabilities in an edge-deployable footprint:

| Capability | How PULSE-Neo Uses It | Why It Cannot Be Replaced |
| :--- | :--- | :--- |
| **On-device inference** | Runs fully offline after first download | Rural clinics have no internet. Cloud models are unusable. |
| **Native function calling** | Forces structured APGAR JSON output | Unstructured text cannot reliably trigger hardware actions |
| **Vision (multimodal)** | Analyzes skin color for cyanosis | Camera-based assessment requires vision capability |
| **Audio understanding** | Analyzes cry strength and quality | Cry analysis requires audio capability |
| **256K context window** | Holds full HBB protocol in context | Enables protocol-grounded reasoning without fine-tuning |
| **140-language support** | Works in Swahili, Hindi, Amharic, etc. | Birth attendants in target regions do not speak English |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  PULSE-Neo App                       │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  Assessment  │───▶│     useGemmaModel hook    │   │
│  │    Screen    │    │                          │   │
│  │              │    │  ┌────────────────────┐  │   │
│  │  • Timer     │    │  │  Cactus Framework  │  │   │
│  │  • Skin obs  │    │  │  (React Native)    │  │   │
│  │  • Cry obs   │    │  └────────┬───────────┘  │   │
│  │  • Tone obs  │    │           │               │   │
│  │  • HR obs    │    │  ┌────────▼───────────┐  │   │
│  └──────────────┘    │  │  Gemma 4 E4B       │  │   │
│                      │  │  (INT4 quantized)  │  │   │
│  ┌──────────────┐    │  │  NPU accelerated   │  │   │
│  │   Result     │◀───│  └────────┬───────────┘  │   │
│  │   Screen     │    │           │               │   │
│  │              │    │  ┌────────▼───────────┐  │   │
│  │  • APGAR     │    │  │  Tool Call:        │  │   │
│  │  • Severity  │    │  │  log_apgar_and_    │  │   │
│  │  • Action    │    │  │  action (JSON)     │  │   │
│  │  • Metronome │    │  └────────────────────┘  │   │
│  └──────────────┘    └──────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  useMetronome hook                           │   │
│  │  Vibration.vibrate() @ 600ms intervals       │   │
│  │  = 100 BPM (HBB protocol standard)           │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## The APGAR Tool Schema

The core of the technical implementation is the function calling schema that forces Gemma 4 E4B to output structured, machine-readable JSON rather than conversational text. This is what makes the output actionable by hardware.

```typescript
const APGAR_TOOL_SCHEMA = {
  type: 'function',
  function: {
    name: 'log_apgar_and_action',
    parameters: {
      type: 'object',
      properties: {
        apgar_appearance:   { type: 'integer' }, // 0-2: skin color
        apgar_pulse:        { type: 'integer' }, // 0-2: heart rate
        apgar_grimace:      { type: 'integer' }, // 0-2: reflex response
        apgar_activity:     { type: 'integer' }, // 0-2: muscle tone
        apgar_respiration:  { type: 'integer' }, // 0-2: breathing
        total_apgar_score:  { type: 'integer' }, // 0-10
        severity: {
          type: 'string',
          enum: ['normal', 'moderate_distress', 'severe_distress']
        },
        action: {
          type: 'string',
          enum: ['routine_care', 'stimulation_and_oxygen', 'start_cpr_metronome']
        },
        reasoning: { type: 'string' }
      },
      required: [ /* all fields */ ]
    }
  }
}
```

The `tool_choice: 'required'` parameter forces Gemma 4 to always call this tool, guaranteeing structured output even under adversarial inputs.

---

## Project Structure

```
pulse-neo/
├── App.tsx                          # Root navigation (Home → Assessment → Result)
├── index.js                         # React Native entry point
├── package.json                     # Dependencies
├── metro.config.js                  # Configured for .gguf model file resolution
├── babel.config.js
├── tsconfig.json
├── PULSE_Neo_Final_Notebook.ipynb   # Kaggle notebook — cloud proof of concept
│
├── src/
│   ├── constants/
│   │   └── theme.ts                 # Colors, APGAR thresholds, CPR BPM constant
│   │
│   ├── hooks/
│   │   ├── useGemmaModel.ts         # Core: Cactus init, tool schema, inference
│   │   └── useMetronome.ts          # CPR metronome at 100 BPM via Vibration API
│   │
│   └── screens/
│       ├── HomeScreen.tsx           # Landing: model status, hero stat, start button
│       ├── AssessmentScreen.tsx     # Golden Minute: timer, 4 observation selectors
│       └── ResultScreen.tsx         # APGAR breakdown, severity, CPR metronome UI
│
└── android/
    └── app/
        ├── build.gradle             # minSdk 26, packagingOptions for native libs
        └── src/main/
            └── AndroidManifest.xml  # CAMERA, RECORD_AUDIO, VIBRATE permissions
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- React Native CLI (`npm install -g react-native-cli`)
- Android Studio with SDK Platform 26+
- A physical Android device with 8GB+ RAM (emulators cannot run Gemma 4 E4B)
- USB debugging enabled on the device

### Installation

```bash
# Clone the repository
git clone https://github.com/Ritabanm/pulse-neo.git
cd pulse-neo

# Install dependencies
npm install

# Install Cactus native binaries for Android
# Download libcactus.so from https://github.com/cactus-compute/cactus/releases
# and place in android/app/src/main/jniLibs/arm64-v8a/

# Run on Android device
npx react-native run-android
```

### First Run

On first launch, the app will download the Gemma 4 E4B INT4 quantized model (~2.5GB) via the Cactus framework. This requires a WiFi connection and takes approximately 5–10 minutes depending on connection speed.

**After the initial download, the app works fully offline.** You can verify this by enabling Airplane Mode — all inference continues to function.

### Model Specification

| Property | Value |
| :--- | :--- |
| Model | `google/gemma-4-E4B-it` |
| Quantization | INT4 (Q4_K_M via GGUF) |
| Disk size | ~2.5 GB |
| RAM required | ~4 GB |
| Inference backend | Cactus / LiteRT-LM |
| NPU acceleration | Enabled (`pro: true`) |

---

## Kaggle Notebook

The repository includes `PULSE_Neo_Final_Notebook.ipynb` — a Kaggle-runnable notebook that demonstrates the core inference logic in the cloud. It loads the real Gemma 4 E4B model and runs three clinical scenarios (routine, moderate distress, critical emergency), producing visible APGAR JSON outputs that prove the tool schema works as designed.

This serves as the cloud-based technical proof of concept for judges who cannot run the mobile app directly.

---

## Clinical Protocol Reference

PULSE-Neo follows the **Helping Babies Breathe (HBB)** protocol developed by the American Academy of Pediatrics and WHO. The 100 BPM metronome rate, APGAR scoring criteria, and three-tier action classification are all derived directly from HBB guidelines.

**This application is a decision support tool for trained birth attendants. It is not a substitute for clinical training or medical judgment.**

---

## Hackathon Tracks

This submission competes in:
- **Main Track** — General Gemma 4 application
- **Impact Track** — Healthcare access for underserved populations
- **Special Technology Track** — Built with the Cactus framework

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

The Gemma 4 E4B model is subject to the [Gemma Terms of Use](https://ai.google.dev/gemma/terms).

> Built with Gemma 4 E4B by Google DeepMind.
