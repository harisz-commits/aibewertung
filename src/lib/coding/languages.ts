// Canonical programming-language registry + alias resolver. Maps the many
// spellings/abbreviations used across benchmarks (MultiPL-E "cpp", McEval "C++",
// SWE-bench "JavaScript/TypeScript") onto one standardized language name.

export interface LanguageDef {
  canonical: string;
  aliases: string[];
}

export const LANGUAGES: LanguageDef[] = [
  { canonical: 'Python', aliases: ['py', 'python', 'python3'] },
  { canonical: 'JavaScript', aliases: ['js', 'javascript', 'node', 'nodejs'] },
  { canonical: 'TypeScript', aliases: ['ts', 'typescript'] },
  { canonical: 'Java', aliases: ['java'] },
  { canonical: 'C', aliases: ['c'] },
  { canonical: 'C++', aliases: ['cpp', 'c++', 'cxx', 'cplusplus'] },
  { canonical: 'C#', aliases: ['cs', 'c#', 'csharp'] },
  { canonical: 'Go', aliases: ['go', 'golang'] },
  { canonical: 'Rust', aliases: ['rs', 'rust'] },
  { canonical: 'PHP', aliases: ['php'] },
  { canonical: 'Ruby', aliases: ['rb', 'ruby'] },
  { canonical: 'Swift', aliases: ['swift'] },
  { canonical: 'Kotlin', aliases: ['kt', 'kotlin'] },
  { canonical: 'Scala', aliases: ['scala'] },
  { canonical: 'R', aliases: ['r'] },
  { canonical: 'Julia', aliases: ['jl', 'julia'] },
  { canonical: 'Perl', aliases: ['pl', 'perl'] },
  { canonical: 'Lua', aliases: ['lua'] },
  { canonical: 'Haskell', aliases: ['hs', 'haskell'] },
  { canonical: 'OCaml', aliases: ['ml', 'ocaml'] },
  { canonical: 'Racket', aliases: ['rkt', 'racket'] },
  { canonical: 'Clojure', aliases: ['clj', 'clojure'] },
  { canonical: 'Elixir', aliases: ['elixir', 'ex'] },
  { canonical: 'Erlang', aliases: ['erl', 'erlang'] },
  { canonical: 'Dart', aliases: ['dart'] },
  { canonical: 'D', aliases: ['d', 'dlang'] },
  { canonical: 'Ada', aliases: ['adb', 'ada'] },
  { canonical: 'Bash', aliases: ['sh', 'bash', 'shell'] },
  { canonical: 'SQL', aliases: ['sql'] },
  { canonical: 'MATLAB', aliases: ['matlab', 'm'] },
  { canonical: 'Fortran', aliases: ['f90', 'fortran'] },
  { canonical: 'Groovy', aliases: ['groovy'] },
  { canonical: 'Visual Basic', aliases: ['vb', 'visualbasic'] },
  { canonical: 'PowerShell', aliases: ['ps1', 'powershell'] },
  { canonical: 'Objective-C', aliases: ['objc', 'objective-c'] },
  { canonical: 'F#', aliases: ['fs', 'fsharp', 'f#'] }
];

const ALIAS_TO_CANONICAL: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const def of LANGUAGES) {
    map[def.canonical.toLowerCase()] = def.canonical;
    for (const a of def.aliases) map[a.toLowerCase()] = def.canonical;
  }
  return map;
})();

/** Resolve a raw language string (or MultiPL-E config suffix) to a canonical
 * name, or null when unknown. Handles combined labels like "javascript/typescript". */
export function canonicalLanguage(raw: string): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (ALIAS_TO_CANONICAL[key]) return ALIAS_TO_CANONICAL[key];
  // MultiPL-E config: "humaneval-cpp" / "mbpp-java" → take the suffix.
  const dash = key.lastIndexOf('-');
  if (dash >= 0 && ALIAS_TO_CANONICAL[key.slice(dash + 1)]) return ALIAS_TO_CANONICAL[key.slice(dash + 1)];
  // Combined "javascript/typescript" → first resolvable part.
  for (const part of key.split(/[\/,+&]/)) {
    const p = part.trim();
    if (ALIAS_TO_CANONICAL[p]) return ALIAS_TO_CANONICAL[p];
  }
  return null;
}

export const CANONICAL_LANGUAGES = LANGUAGES.map((l) => l.canonical);
