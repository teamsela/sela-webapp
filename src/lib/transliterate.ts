/**
 * WLC Hebrew → OHB-style dot-separated transliteration.
 * Server-safe module — no client-side dependencies.
 *
 * Converts Hebrew words with nikkud (vowel points) to Latin transliteration
 * including prefixes. e.g. "לְדָוִד" → "le.da.vid", "מִזְמוֹר" → "miz.mor"
 */

type Cluster = {
  base: string;
  hasDagesh: boolean;
  hasShinDot: boolean;
  hasSinDot: boolean;
  vowel: string;
  isShva: boolean; // true when U+05B0 simple shva (not chataf vowels)
};

export const transliterateHebrew = (wlcWord: string): string => {
  if (!wlcWord) return "";

  const clusters: Cluster[] = [];
  let current: Cluster | null = null;

  for (const char of wlcWord) {
    const cp = char.codePointAt(0) ?? 0;

    // Hebrew letters: U+05D0–U+05EA
    if (cp >= 0x05D0 && cp <= 0x05EA) {
      if (current) clusters.push(current);
      current = { base: char, hasDagesh: false, hasShinDot: false, hasSinDot: false, vowel: "", isShva: false };
      continue;
    }

    if (!current) continue;

    if (cp === 0x05BC) { current.hasDagesh = true; continue; } // dagesh
    if (cp === 0x05C1) { current.hasShinDot = true; continue; } // shin dot
    if (cp === 0x05C2) { current.hasSinDot = true; continue; } // sin dot

    // Vowel points
    switch (cp) {
      case 0x05B0: current.vowel = "e"; current.isShva = true; break;   // shva
      case 0x05B1: current.vowel = "e"; break;   // chataf segol (always vocal)
      case 0x05B2: current.vowel = "a"; break;   // chataf patach (always vocal)
      case 0x05B3: current.vowel = "o"; break;   // chataf qamats (always vocal)
      case 0x05B4: current.vowel = "i"; break;   // chiriq
      case 0x05B5: current.vowel = "e"; break;   // tsere
      case 0x05B6: current.vowel = "e"; break;   // segol
      case 0x05B7: current.vowel = "a"; break;   // patach
      case 0x05B8: current.vowel = "a"; break;   // qamats
      case 0x05B9: current.vowel = "o"; break;   // cholam
      case 0x05BA: current.vowel = "o"; break;   // cholam chaser
      case 0x05BB: current.vowel = "u"; break;   // qubbuts
    }
  }
  if (current) clusters.push(current);
  if (clusters.length === 0) return "";

  const SIMPLE_MAP: Record<string, string> = {
    "א": "", "ג": "g", "ד": "d", "ה": "h", "ו": "v", "ז": "z",
    "ח": "ch", "ט": "t", "י": "y", "ל": "l", "מ": "m", "ם": "m",
    "נ": "n", "ן": "n", "ס": "s", "ע": "", "צ": "ts", "ץ": "ts",
    "ק": "q", "ר": "r", "ת": "t",
  };

  const syllables: string[] = [];
  let syllable = "";

  for (let i = 0; i < clusters.length; i++) {
    const cl = clusters[i];

    // Determine consonant
    let consonant: string;
    if (cl.base === "ש") {
      consonant = cl.hasSinDot ? "s" : "sh";
    } else if (cl.base === "ב") {
      consonant = cl.hasDagesh ? "b" : "v";
    } else if (cl.base === "כ" || cl.base === "ך") {
      consonant = cl.hasDagesh ? "k" : "kh";
    } else if (cl.base === "פ" || cl.base === "ף") {
      consonant = cl.hasDagesh ? "p" : "f";
    } else {
      consonant = SIMPLE_MAP[cl.base] ?? "";
    }

    // Vav as vowel letter
    if (cl.base === "ו") {
      if (cl.vowel === "o") { syllable += "o"; syllables.push(syllable); syllable = ""; continue; }
      if (cl.hasDagesh && !cl.vowel) { syllable += "u"; syllables.push(syllable); syllable = ""; continue; }
    }

    // Final yod without a vowel = mater lectionis ("i").
    // Only append "i" if the preceding syllable doesn't already end in "i"
    // (chiriq male = chiriq + yod confirming the vowel — don't double up).
    if (cl.base === "י" && !cl.vowel && i === clusters.length - 1 && syllables.length > 0) {
      if (!syllables[syllables.length - 1].endsWith("i")) {
        syllables[syllables.length - 1] += "i";
      }
      syllable = "";
      continue;
    }

    // Interior yod mater lectionis (chiriq male): yod with no vowel directly after
    // a chiriq vowel confirms the "i" — don't add an extra "y" consonant.
    if (cl.base === "י" && !cl.vowel && i > 0 && i < clusters.length - 1 &&
        clusters[i - 1].vowel === "i" && !clusters[i - 1].isShva) {
      continue;
    }

    // Silent shva (shva nach): a simple shva that's not word-initial and follows
    // a fully-vowelled cluster closes that preceding syllable rather than opening a new one.
    // e.g. מִזְמוֹר → miz.mor, אֶחְסָר → ech.sar, יַרְבִּיצֵנִי → yar.bi.tse.ni
    if (cl.isShva && i > 0) {
      const prev = clusters[i - 1];
      if (prev.vowel && !prev.isShva) {
        // Append this consonant to the last completed syllable (closes it)
        if (syllables.length > 0) {
          syllables[syllables.length - 1] += consonant;
        } else {
          syllable += consonant;
        }
        // Do NOT push a new syllable — the shva is silent
        continue;
      }
    }

    syllable += consonant;

    if (cl.vowel) {
      syllable += cl.vowel;
      syllables.push(syllable);
      syllable = "";
    }
  }

  if (syllable) {
    if (syllables.length > 0) {
      syllables[syllables.length - 1] += syllable;
    } else {
      syllables.push(syllable);
    }
  }

  return syllables.join(".").toLowerCase() || wlcWord;
};

