// Benchmark registry - the single source of truth for which tests botbrix
// tracks and, crucially, how to explain each one in plain language (EN/DE).
//
// This is editorial content (accurate descriptions of well-known public
// benchmarks), NOT measured data. Measured values are attached to models by the
// importers (Artificial Analysis, LMArena, HELM, …) and stay separate.

import type { BenchmarkGroupSlug } from './types.ts';

export interface Bilingual {
  en: string;
  de: string;
}

export interface BenchmarkGroup {
  slug: BenchmarkGroupSlug;
  name: Bilingual;
  blurb: Bilingual;
}

export interface BenchmarkDef {
  slug: string;
  name: string;
  groupSlug: BenchmarkGroupSlug;
  higherIsBetter: boolean;
  /** Unit shown next to the raw value, e.g. "%", "Elo", "pass@1". */
  unit: string;
  /** Rough max of the raw scale, used only for display hints. */
  maxValue: number | null;
  sourceUrl: string | null;
  /** What the test actually measures - for a total beginner. */
  what: Bilingual;
  /** How to read a score / what "good" looks like. */
  howToRead: Bilingual;
  /** Where it can mislead - every benchmark has caveats. */
  caveat: Bilingual;
}

export const BENCHMARK_GROUPS: BenchmarkGroup[] = [
  {
    slug: 'intelligence',
    name: { en: 'General intelligence', de: 'Allgemeine Intelligenz' },
    blurb: {
      en: 'Broad knowledge and problem-solving across many subjects.',
      de: 'Breites Wissen und Problemlösen über viele Fachgebiete.'
    }
  },
  {
    slug: 'reasoning',
    name: { en: 'Reasoning', de: 'Logisches Denken' },
    blurb: {
      en: 'Multi-step logical thinking and hard, expert-level questions.',
      de: 'Mehrschrittiges logisches Denken und schwere Expertenfragen.'
    }
  },
  {
    slug: 'coding',
    name: { en: 'Coding', de: 'Programmieren' },
    blurb: {
      en: 'Writing correct code and fixing real software bugs.',
      de: 'Korrekten Code schreiben und echte Software-Bugs beheben.'
    }
  },
  {
    slug: 'math',
    name: { en: 'Math', de: 'Mathematik' },
    blurb: {
      en: 'Solving competition-level and advanced math problems.',
      de: 'Lösen von Wettbewerbs- und höherer Mathematik.'
    }
  },
  {
    slug: 'agentic',
    name: { en: 'Agents & tool use', de: 'Agenten & Werkzeugnutzung' },
    blurb: {
      en: 'Using tools/APIs and completing long, multi-step tasks.',
      de: 'Werkzeuge/APIs nutzen und lange, mehrstufige Aufgaben erledigen.'
    }
  },
  {
    slug: 'multimodal',
    name: { en: 'Vision & multimodal', de: 'Vision & Multimodal' },
    blurb: {
      en: 'Understanding images, charts and documents, not just text.',
      de: 'Bilder, Diagramme und Dokumente verstehen, nicht nur Text.'
    }
  },
  {
    slug: 'human_preference',
    name: { en: 'Human preference', de: 'Menschliche Präferenz' },
    blurb: {
      en: 'Which answers real people actually prefer, head-to-head.',
      de: 'Welche Antworten echte Menschen im direkten Vergleich bevorzugen.'
    }
  },
  {
    slug: 'factuality',
    name: { en: 'Factuality', de: 'Faktentreue' },
    blurb: {
      en: 'How often the model is right instead of confidently wrong.',
      de: 'Wie oft das Modell richtig liegt statt selbstbewusst falsch.'
    }
  },
  {
    slug: 'long_context',
    name: { en: 'Long context', de: 'Langer Kontext' },
    blurb: {
      en: 'Finding and using facts buried in very long inputs.',
      de: 'Fakten in sehr langen Eingaben finden und nutzen.'
    }
  },
  {
    slug: 'business_agents',
    name: { en: 'Long-horizon business agents', de: 'Langzeit-Business-Agenten' },
    blurb: {
      en: 'Running a task for hours/days and staying coherent and profitable.',
      de: 'Eine Aufgabe über Stunden/Tage führen und dabei kohärent und profitabel bleiben.'
    }
  }
];

export const BENCHMARKS: BenchmarkDef[] = [
  {
    slug: 'mmlu_pro',
    name: 'MMLU-Pro',
    groupSlug: 'intelligence',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro',
    what: {
      en: 'A tough, cleaned-up general-knowledge exam covering 14 subjects (law, physics, business…). A harder successor to the classic MMLU.',
      de: 'Eine schwere, überarbeitete Allgemeinwissens-Prüfung über 14 Fächer (Recht, Physik, Wirtschaft…). Der schwerere Nachfolger des klassischen MMLU.'
    },
    howToRead: {
      en: 'Percent of multiple-choice questions answered correctly. 70%+ is strong; top models push into the 80s.',
      de: 'Prozent korrekt beantworteter Multiple-Choice-Fragen. 70 %+ ist stark; Spitzenmodelle erreichen die 80er.'
    },
    caveat: {
      en: 'Multiple-choice ≠ real work. High scores can also mean the test leaked into training data.',
      de: 'Multiple-Choice ≠ echte Arbeit. Hohe Werte können auch bedeuten, dass der Test ins Training gelangt ist.'
    }
  },
  {
    slug: 'mmlu',
    name: 'MMLU',
    groupSlug: 'intelligence',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://github.com/hendrycks/test',
    what: {
      en: 'The original 57-subject knowledge exam. Now largely "saturated" - most good models score high.',
      de: 'Die ursprüngliche Wissensprüfung über 57 Fächer. Heute weitgehend „gesättigt" - die meisten guten Modelle liegen hoch.'
    },
    howToRead: {
      en: 'Percent correct. Above ~88% differences are mostly noise now.',
      de: 'Prozent korrekt. Über ~88 % sind Unterschiede heute meist Rauschen.'
    },
    caveat: {
      en: 'Saturated and partly contaminated; prefer MMLU-Pro for separating top models.',
      de: 'Gesättigt und teils kontaminiert; für die Trennung von Spitzenmodellen lieber MMLU-Pro.'
    }
  },
  {
    slug: 'gpqa',
    name: 'GPQA Diamond',
    groupSlug: 'reasoning',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://arxiv.org/abs/2311.12022',
    what: {
      en: 'Graduate-level science questions (biology, physics, chemistry) so hard that non-expert humans with Google still mostly fail.',
      de: 'Naturwissenschaftliche Fragen auf Master-Niveau (Biologie, Physik, Chemie), so schwer, dass selbst Laien mit Google meist scheitern.'
    },
    howToRead: {
      en: 'Percent correct. This is a genuine reasoning test - 50%+ is already very strong.',
      de: 'Prozent korrekt. Ein echter Reasoning-Test - 50 %+ ist bereits sehr stark.'
    },
    caveat: {
      en: 'Small question set, so a few lucky guesses move the number.',
      de: 'Kleiner Fragensatz, daher verschieben wenige Glückstreffer den Wert.'
    }
  },
  {
    slug: 'humaneval',
    name: 'HumanEval',
    groupSlug: 'coding',
    higherIsBetter: true,
    unit: 'pass@1',
    maxValue: 100,
    sourceUrl: 'https://github.com/openai/human-eval',
    what: {
      en: 'Write a small Python function from a description; it either passes the hidden tests or it does not.',
      de: 'Eine kleine Python-Funktion aus einer Beschreibung schreiben; sie besteht die versteckten Tests oder nicht.'
    },
    howToRead: {
      en: '"pass@1" = share solved on the first try. Now saturated - most strong models exceed 90%.',
      de: '„pass@1" = Anteil beim ersten Versuch gelöst. Heute gesättigt - die meisten starken Modelle über 90 %.'
    },
    caveat: {
      en: 'Tiny, isolated snippets - nothing like maintaining a real codebase.',
      de: 'Winzige, isolierte Schnipsel - nichts wie das Pflegen einer echten Codebasis.'
    }
  },
  {
    slug: 'mbpp',
    name: 'MBPP',
    groupSlug: 'coding',
    higherIsBetter: true,
    unit: 'pass@1',
    maxValue: 100,
    sourceUrl: 'https://github.com/google-research/google-research/tree/master/mbpp',
    what: {
      en: 'A thousand entry-level Python programming problems ("mostly basic programming problems").',
      de: 'Tausend einfache Python-Aufgaben („mostly basic programming problems").'
    },
    howToRead: {
      en: 'Percent solved. Similar story to HumanEval - useful floor, not a differentiator at the top.',
      de: 'Prozent gelöst. Ähnlich wie HumanEval - nützliche Untergrenze, oben kein Unterscheidungsmerkmal.'
    },
    caveat: {
      en: 'Basic difficulty; a high score does not imply senior-level engineering.',
      de: 'Einfacher Schwierigkeitsgrad; ein hoher Wert bedeutet keine Senior-Entwicklung.'
    }
  },
  {
    slug: 'swebench_verified',
    name: 'SWE-bench Verified',
    groupSlug: 'coding',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://www.swebench.com/',
    what: {
      en: 'Fix real GitHub issues in real open-source projects - the model must produce a patch that makes the project’s tests pass. "Verified" is a human-checked, solvable subset.',
      de: 'Echte GitHub-Issues in echten Open-Source-Projekten beheben - das Modell muss einen Patch liefern, der die Tests bestehen lässt. „Verified" ist eine von Menschen geprüfte, lösbare Teilmenge.'
    },
    howToRead: {
      en: 'Percent of issues actually fixed. This is the closest thing to real dev work - 40%+ is excellent today.',
      de: 'Prozent tatsächlich behobener Issues. Das kommt echter Entwicklerarbeit am nächsten - 40 %+ ist heute exzellent.'
    },
    caveat: {
      en: 'Depends heavily on the scaffolding/agent around the model, not just the model.',
      de: 'Hängt stark vom Gerüst/Agenten um das Modell ab, nicht nur vom Modell selbst.'
    }
  },
  {
    slug: 'swebench',
    name: 'SWE-bench',
    groupSlug: 'coding',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://www.swebench.com/',
    what: {
      en: 'The full (harder, noisier) set of real GitHub issues behind SWE-bench Verified.',
      de: 'Der vollständige (schwerere, unsauberere) Satz echter GitHub-Issues hinter SWE-bench Verified.'
    },
    howToRead: {
      en: 'Percent fixed. Lower than the Verified subset; compare like-for-like only.',
      de: 'Prozent behoben. Niedriger als die Verified-Teilmenge; nur Gleiches mit Gleichem vergleichen.'
    },
    caveat: {
      en: 'Some tasks are ambiguous or under-specified, adding noise.',
      de: 'Manche Aufgaben sind mehrdeutig oder unterspezifiziert und erzeugen Rauschen.'
    }
  },
  {
    slug: 'livecodebench',
    name: 'LiveCodeBench',
    groupSlug: 'coding',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://livecodebench.github.io/',
    what: {
      en: 'Coding problems collected continuously from recent contests, so they post-date model training - harder to "memorise".',
      de: 'Coding-Aufgaben laufend aus aktuellen Wettbewerben gesammelt, also nach dem Training - schwerer zu „memorieren".'
    },
    howToRead: {
      en: 'Percent solved on fresh problems. A cleaner signal for real coding ability than saturated sets.',
      de: 'Prozent gelöster frischer Aufgaben. Ein sauberes Signal für echte Coding-Fähigkeit als gesättigte Sets.'
    },
    caveat: {
      en: 'Contest-style puzzles ≠ everyday product engineering.',
      de: 'Wettbewerbs-Rätsel ≠ alltägliche Produktentwicklung.'
    }
  },
  {
    slug: 'aime',
    name: 'AIME',
    groupSlug: 'math',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://artofproblemsolving.com/wiki/index.php/AIME',
    what: {
      en: 'Questions from a hard US high-school math olympiad qualifier. Integer answers, no lucky multiple-choice.',
      de: 'Aufgaben aus einer schweren US-Mathe-Olympiade-Qualifikation. Ganzzahlige Antworten, kein Multiple-Choice-Glück.'
    },
    howToRead: {
      en: 'Percent solved. A favourite for reasoning models; 80%+ signals strong step-by-step math.',
      de: 'Prozent gelöst. Beliebt bei Reasoning-Modellen; 80 %+ signalisiert starke schrittweise Mathematik.'
    },
    caveat: {
      en: 'Very few problems per year → high variance; watch which year is reported.',
      de: 'Sehr wenige Aufgaben pro Jahr → hohe Varianz; achte auf das berichtete Jahr.'
    }
  },
  {
    slug: 'math',
    name: 'MATH',
    groupSlug: 'math',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://github.com/hendrycks/math',
    what: {
      en: 'Thousands of competition math problems across algebra, geometry, number theory and more.',
      de: 'Tausende Wettbewerbs-Matheaufgaben aus Algebra, Geometrie, Zahlentheorie u. a.'
    },
    howToRead: {
      en: 'Percent correct with the right final answer. Broad math coverage.',
      de: 'Prozent mit korrekter Endantwort. Breite Mathe-Abdeckung.'
    },
    caveat: {
      en: 'Increasingly saturated at the top end.',
      de: 'Im Spitzenbereich zunehmend gesättigt.'
    }
  },
  {
    slug: 'mmmu',
    name: 'MMMU',
    groupSlug: 'multimodal',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://mmmu-benchmark.github.io/',
    what: {
      en: 'College-level questions that require reading images, diagrams, charts and tables - not just text.',
      de: 'Fragen auf Hochschulniveau, die Bilder, Diagramme, Charts und Tabellen erfordern - nicht nur Text.'
    },
    howToRead: {
      en: 'Percent correct. The go-to score for "can this model actually see and reason about visuals".',
      de: 'Prozent korrekt. Der Standardwert für „kann dieses Modell wirklich sehen und über Visuelles schließen".'
    },
    caveat: {
      en: 'Only relevant for vision-capable models.',
      de: 'Nur relevant für vision-fähige Modelle.'
    }
  },
  {
    slug: 'lmarena',
    name: 'LMArena (Chatbot Arena)',
    groupSlug: 'human_preference',
    higherIsBetter: true,
    unit: 'Elo',
    maxValue: null,
    sourceUrl: 'https://lmarena.ai/',
    what: {
      en: 'Real users chat with two anonymous models and vote for the better answer. Votes become a chess-style Elo rating.',
      de: 'Echte Nutzer chatten mit zwei anonymen Modellen und stimmen für die bessere Antwort. Stimmen ergeben ein Schach-artiges Elo-Rating.'
    },
    howToRead: {
      en: 'Higher Elo = people prefer it more often. Great for "feel"/helpfulness, which exams miss.',
      de: 'Höheres Elo = wird öfter bevorzugt. Gut für „Gefühl"/Hilfsbereitschaft, was Prüfungen verpassen.'
    },
    caveat: {
      en: 'Popularity ≠ correctness; style, length and friendliness sway votes.',
      de: 'Beliebtheit ≠ Korrektheit; Stil, Länge und Freundlichkeit beeinflussen die Stimmen.'
    }
  },
  {
    slug: 'aa_intelligence',
    name: 'Artificial Analysis Intelligence Index',
    groupSlug: 'intelligence',
    higherIsBetter: true,
    unit: 'index',
    maxValue: 100,
    sourceUrl: 'https://artificialanalysis.ai/',
    what: {
      en: 'A single blended score combining several benchmarks (reasoning, math, coding, knowledge) into one intelligence number.',
      de: 'Ein einzelner Mischwert, der mehrere Benchmarks (Reasoning, Mathe, Coding, Wissen) zu einer Intelligenz-Zahl zusammenfasst.'
    },
    howToRead: {
      en: 'Higher = smarter overall. Handy one-glance ranking; check the components before trusting it.',
      de: 'Höher = insgesamt schlauer. Praktisches Ranking auf einen Blick; prüfe die Bestandteile.'
    },
    caveat: {
      en: 'A weighted blend - the weighting is a judgement call, not a law of nature.',
      de: 'Eine gewichtete Mischung - die Gewichtung ist eine Entscheidung, kein Naturgesetz.'
    }
  },
  {
    slug: 'bfcl',
    name: 'BFCL (function calling)',
    groupSlug: 'agentic',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://gorilla.cs.berkeley.edu/leaderboard.html',
    what: {
      en: 'Berkeley Function-Calling Leaderboard: can the model call the right tool/API with the right arguments?',
      de: 'Berkeley Function-Calling Leaderboard: Ruft das Modell das richtige Tool/API mit den richtigen Argumenten auf?'
    },
    howToRead: {
      en: 'Percent of correct tool calls. Critical if you build agents or integrations.',
      de: 'Prozent korrekter Tool-Aufrufe. Entscheidend, wenn du Agenten oder Integrationen baust.'
    },
    caveat: {
      en: 'Tests the calling format, not whether the overall task succeeds.',
      de: 'Prüft das Aufruf-Format, nicht ob die Gesamtaufgabe gelingt.'
    }
  },
  {
    slug: 'simpleqa',
    name: 'SimpleQA',
    groupSlug: 'factuality',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://openai.com/index/introducing-simpleqa/',
    what: {
      en: 'Short factual questions with one correct answer, designed to catch confident "hallucinations".',
      de: 'Kurze Faktenfragen mit einer korrekten Antwort, um selbstbewusste „Halluzinationen" aufzudecken.'
    },
    howToRead: {
      en: 'Percent correct. Even strong models score surprisingly low - humility is the point.',
      de: 'Prozent korrekt. Selbst starke Modelle liegen überraschend niedrig - genau das ist der Punkt.'
    },
    caveat: {
      en: 'Trivia-style facts; not a measure of reasoning or usefulness.',
      de: 'Trivia-artige Fakten; kein Maß für Reasoning oder Nützlichkeit.'
    }
  },
  {
    slug: 'helm',
    name: 'Stanford HELM',
    groupSlug: 'intelligence',
    higherIsBetter: true,
    unit: 'index',
    maxValue: 100,
    sourceUrl: 'https://crfm.stanford.edu/helm/',
    what: {
      en: 'A broad, transparent evaluation framework from Stanford that scores models across many scenarios and metrics (accuracy, robustness, bias, efficiency).',
      de: 'Ein breites, transparentes Bewertungs-Framework aus Stanford, das Modelle über viele Szenarien und Metriken bewertet (Genauigkeit, Robustheit, Bias, Effizienz).'
    },
    howToRead: {
      en: 'Use it for a well-documented, multi-metric view rather than a single "smartness" number.',
      de: 'Für eine gut dokumentierte Mehr-Metrik-Sicht nutzen statt einer einzelnen „Schlauheit"-Zahl.'
    },
    caveat: {
      en: 'Coverage varies by model and updates on its own cadence.',
      de: 'Die Abdeckung variiert je Modell und wird in eigenem Takt aktualisiert.'
    }
  },
  {
    slug: 'hle',
    name: "Humanity's Last Exam (HLE)",
    groupSlug: 'reasoning',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://lastexam.ai/',
    what: {
      en: 'Thousands of extremely hard, expert-written questions across maths, sciences and humanities - designed to sit at the very frontier of human knowledge.',
      de: 'Tausende extrem schwere, von Experten geschriebene Fragen aus Mathematik, Naturwissenschaften und Geisteswissenschaften - bewusst an der Grenze des menschlichen Wissens.'
    },
    howToRead: {
      en: 'Percent correct. Scores are LOW by design - even frontier models are in the low tens, so small gaps matter.',
      de: 'Prozent korrekt. Werte sind bewusst NIEDRIG - selbst Spitzenmodelle liegen im niedrigen Zehnerbereich, daher zählen kleine Abstände.'
    },
    caveat: {
      en: 'So hard that noise is large; treat single-digit differences with care.',
      de: 'So schwer, dass das Rauschen groß ist; einstellige Unterschiede vorsichtig behandeln.'
    }
  },
  {
    slug: 'scicode',
    name: 'SciCode',
    groupSlug: 'coding',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://scicode-bench.github.io/',
    what: {
      en: 'Write real scientific code (physics, biology, maths) that reproduces research results - coding plus domain knowledge.',
      de: 'Echten wissenschaftlichen Code (Physik, Biologie, Mathe) schreiben, der Forschungsergebnisse reproduziert - Coding plus Fachwissen.'
    },
    howToRead: {
      en: 'Percent of sub-problems solved. Harder and more realistic than toy coding tests.',
      de: 'Prozent gelöster Teilaufgaben. Schwerer und realistischer als Spielzeug-Coding-Tests.'
    },
    caveat: {
      en: 'Requires scientific knowledge, so it mixes two skills.',
      de: 'Erfordert wissenschaftliches Wissen und mischt damit zwei Fähigkeiten.'
    }
  },
  {
    slug: 'terminalbench',
    name: 'Terminal-Bench',
    groupSlug: 'agentic',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://www.tbench.ai/',
    what: {
      en: 'Can the model actually operate a computer through the terminal - set up servers, run tools, fix things - as an autonomous agent?',
      de: 'Kann das Modell einen Computer wirklich über das Terminal bedienen - Server aufsetzen, Tools ausführen, Dinge reparieren - als autonomer Agent?'
    },
    howToRead: {
      en: 'Percent of end-to-end terminal tasks completed. A strong signal for real agentic ability.',
      de: 'Prozent vollständig gelöster Terminal-Aufgaben. Ein starkes Signal für echte Agenten-Fähigkeit.'
    },
    caveat: {
      en: 'Depends on the agent scaffold around the model, not the model alone.',
      de: 'Hängt vom Agenten-Gerüst um das Modell ab, nicht nur vom Modell.'
    }
  },
  {
    slug: 'ifbench',
    name: 'IFBench / IFEval',
    groupSlug: 'agentic',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://github.com/google-research/google-research/tree/master/instruction_following_eval',
    what: {
      en: 'Does the model follow precise formatting and structure instructions exactly ("answer in 3 bullet points, no punctuation")?',
      de: 'Befolgt das Modell präzise Formatierungs- und Struktur-Anweisungen exakt („antworte in 3 Stichpunkten, ohne Satzzeichen")?'
    },
    howToRead: {
      en: 'Percent of instructions obeyed exactly. Crucial for reliable automation and structured output.',
      de: 'Prozent exakt befolgter Anweisungen. Entscheidend für verlässliche Automatisierung und strukturierte Ausgaben.'
    },
    caveat: {
      en: 'Measures obedience to format, not the quality of the content.',
      de: 'Misst das Befolgen des Formats, nicht die Qualität des Inhalts.'
    }
  },
  {
    slug: 'tau2',
    name: 'τ²-bench (tool use)',
    groupSlug: 'agentic',
    higherIsBetter: true,
    unit: '%',
    maxValue: 100,
    sourceUrl: 'https://github.com/sierra-research/tau2-bench',
    what: {
      en: 'Realistic customer-service style tasks where the model must use tools/APIs correctly over a multi-turn conversation (e.g. banking, retail).',
      de: 'Realistische Kundenservice-Aufgaben, bei denen das Modell Tools/APIs über mehrere Gesprächsrunden korrekt nutzen muss (z. B. Banking, Handel).'
    },
    howToRead: {
      en: 'Percent of tasks completed correctly. A practical measure of agent reliability, not just single tool calls.',
      de: 'Prozent korrekt gelöster Aufgaben. Ein praxisnahes Maß für Agenten-Zuverlässigkeit, nicht nur einzelne Tool-Aufrufe.'
    },
    caveat: {
      en: 'Domain-specific; strong here does not guarantee every agent workflow.',
      de: 'Domänenspezifisch; stark hier heißt nicht jeder Agenten-Workflow gelingt.'
    }
  },
  {
    slug: 'aa_coding',
    name: 'Artificial Analysis Coding Index',
    groupSlug: 'coding',
    higherIsBetter: true,
    unit: 'index',
    maxValue: 100,
    sourceUrl: 'https://artificialanalysis.ai/',
    what: {
      en: 'A blended coding score combining several coding benchmarks (e.g. LiveCodeBench, SciCode) into one number.',
      de: 'Ein gemischter Coding-Score, der mehrere Coding-Benchmarks (z. B. LiveCodeBench, SciCode) zu einer Zahl zusammenfasst.'
    },
    howToRead: {
      en: 'Higher = better at coding overall. Convenient one-glance coding rank.',
      de: 'Höher = insgesamt besser beim Coden. Praktischer Coding-Rang auf einen Blick.'
    },
    caveat: {
      en: 'A weighted blend; the components matter more than the single number.',
      de: 'Eine gewichtete Mischung; die Bestandteile zählen mehr als die eine Zahl.'
    }
  },
  {
    slug: 'aa_math',
    name: 'Artificial Analysis Math Index',
    groupSlug: 'math',
    higherIsBetter: true,
    unit: 'index',
    maxValue: 100,
    sourceUrl: 'https://artificialanalysis.ai/',
    what: {
      en: 'A blended maths score combining competition-maths benchmarks (e.g. AIME, MATH-500) into one number.',
      de: 'Ein gemischter Mathe-Score, der Wettbewerbs-Mathe-Benchmarks (z. B. AIME, MATH-500) zu einer Zahl zusammenfasst.'
    },
    howToRead: {
      en: 'Higher = stronger competition-level maths.',
      de: 'Höher = stärker in Wettbewerbs-Mathematik.'
    },
    caveat: {
      en: 'A weighted blend of a few hard maths tests.',
      de: 'Eine gewichtete Mischung einiger schwerer Mathe-Tests.'
    }
  },
  {
    slug: 'vending_bench',
    name: 'Vending-Bench',
    groupSlug: 'business_agents',
    higherIsBetter: true,
    unit: '$ net worth',
    maxValue: null,
    sourceUrl: 'https://andonlabs.com/evals/vending-bench',
    what: {
      en: 'The model runs a simulated vending-machine business for a long time - ordering stock, setting prices, paying fees - and we see if it makes or loses money.',
      de: 'Das Modell führt lange ein simuliertes Automaten-Geschäft - Nachbestellen, Preise setzen, Gebühren zahlen - und wir sehen, ob es Geld verdient oder verliert.'
    },
    howToRead: {
      en: 'Higher final net worth = better at long, boring, real-world business tasks without losing the plot.',
      de: 'Höheres Endvermögen = besser bei langen, drögen, realen Geschäftsaufgaben, ohne den Faden zu verlieren.'
    },
    caveat: {
      en: 'One narrow simulation; great for "long-horizon coherence", not general skill.',
      de: 'Eine enge Simulation; gut für „Langzeit-Kohärenz", nicht für allgemeines Können.'
    }
  },
  {
    slug: 'vending_bench_2',
    name: 'Vending-Bench 2',
    groupSlug: 'business_agents',
    higherIsBetter: true,
    unit: '$ net worth',
    maxValue: null,
    sourceUrl: 'https://andonlabs.com/evals/vending-bench',
    what: {
      en: 'A longer, harder version of Vending-Bench with more events and a full simulated year of operation.',
      de: 'Eine längere, schwerere Version von Vending-Bench mit mehr Ereignissen und einem vollen simulierten Betriebsjahr.'
    },
    howToRead: {
      en: 'Same idea, tougher test of staying profitable and sane over very long runs.',
      de: 'Gleiche Idee, härterer Test, über sehr lange Läufe profitabel und stabil zu bleiben.'
    },
    caveat: {
      en: 'Still a single simulated domain; results swing between runs.',
      de: 'Weiterhin eine einzelne Simulation; Ergebnisse schwanken zwischen Läufen.'
    }
  }
];

export const BENCHMARKS_BY_SLUG: Record<string, BenchmarkDef> = Object.fromEntries(
  BENCHMARKS.map((b) => [b.slug, b])
);

export function benchmarksInGroup(group: BenchmarkGroupSlug): BenchmarkDef[] {
  return BENCHMARKS.filter((b) => b.groupSlug === group);
}
