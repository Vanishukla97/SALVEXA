const env = require('../config/env');

const symptomAliasMap = {
  fever: ['fever', 'temperature', 'high temp', 'chills'],
  headache: ['headache', 'migraine', 'head pain'],
  fatigue: ['fatigue', 'tiredness', 'weakness', 'lethargy'],
  nausea: ['nausea', 'vomiting', 'queasy'],
  vomiting: ['vomit', 'vomiting', 'throw up', 'emesis'],
  cough: ['cough', 'dry cough', 'wet cough'],
  cold: ['cold', 'runny nose', 'sneezing', 'blocked nose'],
  allergy: ['allergy', 'rash', 'itching', 'allergic'],
  pain: ['pain', 'body pain', 'muscle pain', 'joint pain'],
  left_arm_pain: ['left arm pain', 'left shoulder pain', 'radiating arm pain', 'arm pain'],
  chest_discomfort: [
    'chest pain',
    'chest discomfort',
    'chest tightness',
    'chest pressure',
    'chest heaviness',
  ],
  breathing_difficulty: ['shortness of breath', 'breathing difficulty', 'breathlessness', 'difficulty breathing'],
  acidity: ['acidity', 'heartburn', 'acid reflux'],
  dizziness: ['dizziness', 'vertigo', 'lightheadedness', 'faint'],
  sore_throat: ['sore throat', 'throat pain'],
  diarrhea: ['diarrhea', 'loose motion', 'watery stool'],
};

const conditionHints = {
  fever: 'Viral fever or mild infection',
  headache: 'Tension headache or migraine',
  fatigue: 'Viral fatigue or sleep/stress-related exhaustion',
  nausea: 'Gastric irritation or viral gastro symptoms',
  cough: 'Upper respiratory tract irritation',
  cold: 'Common cold or allergic rhinitis',
  allergy: 'Allergic response',
  pain: 'Inflammatory or musculoskeletal pain',
  left_arm_pain: 'Possible radiating pain pattern requiring urgent assessment',
  chest_discomfort: 'Possible acute coronary/cardiopulmonary symptom pattern',
  breathing_difficulty: 'Respiratory or cardiac distress pattern',
  acidity: 'Acid peptic symptoms',
  dizziness: 'Vertigo/dehydration/blood pressure related issue',
  sore_throat: 'Pharyngitis or throat irritation',
  diarrhea: 'Gastrointestinal infection or food intolerance',
};

const redFlagRules = [
  {
    name: 'chest_pain',
    phrase: 'chest pain',
    reason: 'Chest pain can indicate a cardiac or respiratory emergency.',
    severity: 'high',
  },
  {
    name: 'breathing_difficulty',
    phrase: 'shortness of breath',
    reason: 'Breathing difficulty may require immediate in-person medical care.',
    severity: 'high',
  },
  {
    name: 'chest_discomfort',
    phrase: 'chest discomfort',
    reason: 'Chest discomfort may indicate a serious heart-related emergency.',
    severity: 'high',
  },
  {
    name: 'left_arm_pain',
    phrase: 'left arm pain',
    reason: 'Left arm pain with chest symptoms may indicate acute coronary syndrome.',
    severity: 'high',
  },
  {
    name: 'breathlessness',
    phrase: 'breathing difficulty',
    reason: 'Breathing difficulty requires urgent medical evaluation.',
    severity: 'high',
  },
  {
    name: 'fainting',
    phrase: 'fainting',
    reason: 'Fainting can indicate neurological or cardiovascular instability.',
    severity: 'high',
  },
  {
    name: 'blood_vomit',
    phrase: 'blood',
    reason: 'Blood in vomit/stool/cough needs urgent medical evaluation.',
    severity: 'high',
  },
  {
    name: 'high_fever_persistent',
    phrase: 'high fever',
    reason: 'Persistent high fever can indicate serious infection.',
    severity: 'medium',
  },
  {
    name: 'confusion',
    phrase: 'confusion',
    reason: 'Confusion or disorientation requires prompt doctor assessment.',
    severity: 'high',
  },
];

function uniqueStrings(items) {
  return Array.from(new Set(items.map((item) => String(item).trim()).filter(Boolean)));
}

function tokenize(input) {
  return String(input)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function canonicalizeSymptoms(symptoms = [], symptomText = '') {
  const raw = uniqueStrings([...symptoms, ...tokenize(symptomText)]);
  const normalized = new Set();

  for (const phrase of raw) {
    const lower = phrase.toLowerCase();
    for (const [canonical, aliases] of Object.entries(symptomAliasMap)) {
      const matched = aliases.some((alias) => lower.includes(alias));
      if (matched) normalized.add(canonical);
    }
  }

  return Array.from(normalized);
}

function detectRedFlags(symptoms = [], symptomText = '') {
  const text = `${symptoms.join(' ')} ${String(symptomText || '')}`.toLowerCase();
  const flags = redFlagRules.filter((rule) => {
    const normalizedPhrase = rule.phrase.replace(/\s+/g, '_');
    return text.includes(rule.phrase) || text.includes(rule.name) || text.includes(normalizedPhrase);
  });

  const hasChest =
    text.includes('chest pain') ||
    text.includes('chest discomfort') ||
    text.includes('chest tightness') ||
    text.includes('chest pressure') ||
    text.includes('chest_discomfort');
  const hasLeftArm =
    text.includes('left arm pain') ||
    text.includes('left shoulder pain') ||
    text.includes('radiating arm pain') ||
    text.includes('left_arm_pain');
  const hasBreath =
    text.includes('shortness of breath') ||
    text.includes('breathing difficulty') ||
    text.includes('breathlessness') ||
    text.includes('breathing_difficulty');
  const hasNauseaVomit =
    text.includes('nausea') ||
    text.includes('vomit') ||
    text.includes('vomiting') ||
    text.includes('emesis');

  if ((hasChest && hasBreath) || (hasChest && hasLeftArm) || (hasChest && hasNauseaVomit && hasBreath)) {
    flags.push({
      name: 'cardiac_emergency_pattern',
      phrase: 'cardiac pattern',
      reason:
        'Symptoms suggest a possible acute heart emergency (e.g. heart attack). Go to nearest hospital/emergency immediately.',
      severity: 'high',
    });
  }

  return flags;
}

function heuristicTriage(symptoms = [], symptomText = '') {
  const normalizedSymptoms = canonicalizeSymptoms(symptoms, symptomText);
  const redFlags = detectRedFlags(normalizedSymptoms, symptomText);
  const possibleConditions = uniqueStrings(
    normalizedSymptoms
      .map((symptom) => conditionHints[symptom])
      .filter(Boolean)
  );

  if (redFlags.some((flag) => flag.name === 'cardiac_emergency_pattern')) {
    possibleConditions.unshift('Possible acute coronary syndrome (medical emergency)');
  }

  let confidence = normalizedSymptoms.length ? 0.76 : 0.55;
  if (symptomText && symptomText.trim().length > 20) confidence += 0.08;
  if (normalizedSymptoms.length >= 3) confidence += 0.06;
  if (redFlags.length) confidence -= 0.1;
  confidence = Math.min(0.95, Math.max(0.35, confidence));

  let triage = 'self_care';
  if (redFlags.some((flag) => flag.severity === 'high')) {
    triage = 'urgent_care';
  } else if (confidence < env.openai.lowConfidenceThreshold || normalizedSymptoms.length === 0) {
    triage = 'doctor_review';
  }

  return {
    source: 'heuristic',
    normalizedSymptoms,
    possibleConditions,
    redFlags,
    confidenceScore: confidence,
    triage,
    clinicalNote:
      triage === 'urgent_care'
        ? 'Urgent warning signs detected. Please seek immediate medical attention.'
        : triage === 'doctor_review'
          ? 'AI confidence is limited. Doctor review is recommended before medication use.'
          : 'No immediate red-flag pattern detected from provided inputs.',
  };
}

function parseAiPayload(rawContent) {
  if (!rawContent) return null;
  try {
    return JSON.parse(rawContent);
  } catch (error) {
    return null;
  }
}

function sanitizeAiResult(raw, fallback) {
  if (!raw || typeof raw !== 'object') return fallback;

  const normalizedSymptoms = uniqueStrings(
    Array.isArray(raw.normalized_symptoms) ? raw.normalized_symptoms : fallback.normalizedSymptoms
  ).map((symptom) => symptom.toLowerCase());

  const possibleConditions = uniqueStrings(
    Array.isArray(raw.possible_conditions) ? raw.possible_conditions : fallback.possibleConditions
  );

  const redFlagsRaw = Array.isArray(raw.red_flags) ? raw.red_flags : [];
  const redFlags = redFlagsRaw
    .map((item) => ({
      name: String(item?.name || 'clinical_flag'),
      reason: String(item?.reason || 'Potential clinical risk identified.'),
      severity: item?.severity === 'high' || item?.severity === 'medium' ? item.severity : 'medium',
    }))
    .filter((item) => item.reason);

  let confidenceScore = Number(raw.confidence_score);
  if (Number.isNaN(confidenceScore)) confidenceScore = fallback.confidenceScore;
  confidenceScore = Math.min(0.99, Math.max(0.05, confidenceScore));

  const triageInput = String(raw.triage || '').toLowerCase();
  let triage = fallback.triage;
  if (['self_care', 'doctor_review', 'urgent_care'].includes(triageInput)) {
    triage = triageInput;
  }

  if (redFlags.some((flag) => flag.severity === 'high')) {
    triage = 'urgent_care';
  } else if (confidenceScore < env.openai.lowConfidenceThreshold && triage === 'self_care') {
    triage = 'doctor_review';
  }

  return {
    source: 'openai',
    normalizedSymptoms: normalizedSymptoms.length ? normalizedSymptoms : fallback.normalizedSymptoms,
    possibleConditions: possibleConditions.length ? possibleConditions : fallback.possibleConditions,
    redFlags: redFlags.length ? redFlags : fallback.redFlags,
    confidenceScore,
    triage,
    clinicalNote:
      typeof raw.clinical_note === 'string' && raw.clinical_note.trim()
        ? raw.clinical_note.trim()
        : fallback.clinicalNote,
  };
}

async function analyzeSymptomsWithAI({ symptoms = [], symptomText = '' }) {
  const fallback = heuristicTriage(symptoms, symptomText);
  const apiKey = env.openai.apiKey;
  if (!apiKey) {
    return fallback;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), env.openai.timeoutMs);

  try {
    const response = await fetch(`${env.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: abortController.signal,
      body: JSON.stringify({
        model: env.openai.model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a clinical triage normalizer. Return only valid JSON with keys: normalized_symptoms, possible_conditions, red_flags, confidence_score, triage, clinical_note. triage must be one of self_care, doctor_review, urgent_care.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              selected_symptoms: symptoms,
              symptom_text: symptomText,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        ...fallback,
        clinicalNote: 'AI service unavailable right now. Using safety-focused fallback analysis.',
      };
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || '';
    const parsed = parseAiPayload(content);
    return sanitizeAiResult(parsed, fallback);
  } catch (error) {
    return {
      ...fallback,
      clinicalNote: 'AI analysis timeout/failure. Using fallback safety logic.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  analyzeSymptomsWithAI,
  heuristicTriage,
};
