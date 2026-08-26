export type AssessmentBand = {
  id: number;
  frequencyThreshold: number;
  words: readonly string[];
};

export const ASSESSMENT_BANDS: readonly AssessmentBand[] = [
  {
    id: 0,
    frequencyThreshold: 0.9,
    words: ["after", "answer", "book", "child", "city", "family", "friend", "happy", "home", "house", "learn", "money", "morning", "name", "people", "place", "small", "story", "water", "work"],
  },
  {
    id: 1,
    frequencyThreshold: 0.8,
    words: ["almost", "careful", "choose", "common", "decide", "explain", "happen", "improve", "journey", "notice", "ordinary", "perhaps", "provide", "reason", "remember", "result", "simple", "together", "usually", "wonder"],
  },
  {
    id: 2,
    frequencyThreshold: 0.68,
    words: ["approach", "available", "benefit", "contain", "describe", "develop", "effort", "establish", "evidence", "feature", "likely", "maintain", "occur", "purpose", "require", "respond", "significant", "suggest", "value", "various"],
  },
  {
    id: 3,
    frequencyThreshold: 0.55,
    words: ["acquire", "ambiguous", "assess", "coherent", "compelling", "contribute", "diminish", "encounter", "identify", "inevitable", "interpret", "relevant", "reluctant", "retain", "subtle", "undergo", "valid", "vary", "viable", "widespread"],
  },
  {
    id: 4,
    frequencyThreshold: 0.42,
    words: ["alleviate", "arbitrary", "conjecture", "detrimental", "exacerbate", "intricate", "nuanced", "pervasive", "plausible", "preliminary", "rigorous", "scrutiny", "sufficient", "tentative", "underlying", "unprecedented", "validate", "vulnerability", "warrant", "whereby"],
  },
  {
    id: 5,
    frequencyThreshold: 0.3,
    words: ["acquiesce", "ameliorate", "assiduous", "circumspect", "conundrum", "deleterious", "equivocal", "esoteric", "fastidious", "intransigent", "laconic", "obfuscate", "parsimonious", "perfunctory", "recalcitrant", "sagacious", "trenchant", "ubiquitous", "vacillate", "verisimilitude"],
  },
] as const;
