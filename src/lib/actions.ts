'use server';

import { redirect } from 'next/navigation';
import { currentUser, clerkClient } from '@clerk/nextjs';

import { db } from '../db';
import { hebBible, lemmaLink, motifLink, stepbibleTbesh, study } from '../schema';
import { and, or, ilike, like, eq, asc, desc, count, gte, lte, gt, lt, SQL } from 'drizzle-orm';

import { nanoid } from 'nanoid';

import { parsePassageInfo, PassageInfo } from './utils';
import { StudyData, PassageData, PassageStaticData, StudyMetadata, WordProps, FetchStudiesResult } from './data';

const SORT_COLUMNS = {
  name: study.name,
  passage: study.passage,
  createdAt: study.createdAt,
  updatedAt: study.updatedAt,
  public: study.public
} as const;

const STEP_BIBLE_SELECT_COLUMNS = [
  "Hebrew",
  "Transliteration",
  "Gloss",
  "Meaning",
  "Morph",
  "eStrong",
  "dStrong",
  "uStrong",
] as const;

const PAGINATION_SIZE = 10;

const formatStrongNumberForDisplay = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return normalized.replace(/([0-9])([A-Z]+)$/, '$1');
};


export async function fetchStudyById(studyId: string) {
  try {
    const row = await db
      .select()
      .from(study)
      .where(eq(study.id, studyId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    const result: StudyData = {
      id: studyId,
      name: row?.name || "",
      owner: row?.owner || "",
      book: row?.book || "",
      passage: row?.passage || "",
      public: row?.public || false,
      model: row?.model || false,
      metadata: (row?.metadata as StudyMetadata) || { words: {} },
      notes: row?.notes || "",
    };

    return result;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch study record.');
  }
}

export async function updateStudyName(id: string, studyName: string) {
  try {
    const result = await db
      .update(study)
      .set({ name: studyName })
      .where(eq(study.id, id))
      .returning({ id: study.id });

    if (result.length === 0) {
      return { message: 'Database Error: Study not found.' };
    }
  } catch (error) {
    return { message: 'Database Error: Failed to update study name.' };
  }
}

export async function updateStudyNotes(id: string, content: string) {
  try {
    await db
      .update(study)
      .set({ notes: content, updatedAt: new Date().toISOString() })
      .where(eq(study.id, id));
  } catch (error) {
    return { message: 'Database Error: Failed to update study notes.' };
  }
}

export async function updatePublic(studyId: string, publicAccess: boolean) {
  try {
    await db
      .update(study)
      .set({ public: publicAccess })
      .where(eq(study.id, studyId));
  } catch (error) {
    return { message: 'Database Error: Failed to update study public access.' };
  }
}

export async function updateStar(studyId: string, isStarred: boolean) {
  try {
    await db
      .update(study)
      .set({ starred: isStarred })
      .where(eq(study.id, studyId));
  } catch (error) {
    return { message: 'Database Error: Failed to update study starred status.' };
  }
}

export async function updateMetadataInDb(studyId: string, studyMetadata: StudyMetadata) {
  "use server";

  try {
    const metadataJson = JSON.stringify(studyMetadata);
    if (metadataJson)
    {
      await db
        .update(study)
        .set({ metadata: studyMetadata, updatedAt: new Date().toISOString() })
        .where(eq(study.id, studyId));
    }
  } catch (error) {
    return { message: 'Database Error: Failed to update study metadata.' };
  }
}

export async function deleteStudy(studyId: string) {
  try {
    const result = await db
      .delete(study)
      .where(eq(study.id, studyId))
      .returning({ id: study.id });

    if (result.length === 0) {
      return { message: 'Database Error: Study not found.' };
    }
  } catch (error) {
    return { message: 'Database Error: Failed to delete study.' };
  }
}

export async function createStudy(passage: string, book: string) {
  const user = await currentUser();

  let newId: string | null = null;

  if (user) {
    try {
      const [record] = await db
        .insert(study)
        .values({
          id: "rec_" + nanoid(20),
          name: "Untitled Study",
          passage: passage,
          book: book,
          owner: user.id,
          metadata: { words: {} },
          public: false,
          model: false,
          starred: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .returning({ id: study.id });

        newId = record?.id ?? null;
    } catch (error) {
      return { message: 'Database Error: Failed to Create Study.' };
    }

    if (newId)
      redirect('/study/' + newId.replace(/^rec_/, '') + '/edit');
  }
}

export async function cloneStudy(originalStudy: StudyData, newName: string) {

  const user = await currentUser();

  if (user) {
    let newId: string | null = null;

    try {
      const [record] = await db
        .insert(study)
        .values({
          id: "rec_" + nanoid(20),
          name: newName,
          book: originalStudy.book,
          passage: originalStudy.passage,
          owner: user.id,
          metadata: originalStudy.metadata,
          public: false,
          model: false,
          starred: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()          
        })
        .returning({ id: study.id });

      newId = record?.id ?? null;
    } catch (error) {
      return { message: 'Database Error: Failed to Clone Study.' };
    }

    if (newId)
      redirect('/study/' + newId.replace(/^rec_/, '') + '/edit');
  }
}

export async function fetchPublicStudies(query: string, currentPage: number, sortKey: any, sortAsc: boolean) {
  const searchResult: FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();

  const filter = and(
    eq(study.model, false),
    eq(study.public, true),
    or(
      ilike(study.name, `%${query}%`),
      ilike(study.book, `%${query}%`),
      like(study.passage, `%${query}%`),
    )
  );

  const sortColumn = SORT_COLUMNS[sortKey as keyof typeof SORT_COLUMNS] ?? study.createdAt;
  const sortOrder = sortAsc ? asc(sortColumn) : desc(sortColumn);

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(study)
      .where(filter)
      .orderBy(sortOrder)
      .limit(PAGINATION_SIZE)
      .offset((currentPage - 1) * PAGINATION_SIZE),

    db
      .select({ count: count() })
      .from(study)
      .where(filter)
      .then((res) => res[0].count),
  ]);

  // collect unique owner ids
  const uniqueIds = new Set<string>();
  rows.forEach((row) => {
    if (row.owner) uniqueIds.add(row.owner);
  });

  // fetch owner info from Clerk
  const users = await clerkClient.users.getUserList({ userId: Array.from(uniqueIds) });

  const userMap = new Map(users.map((u) => [u.id, u]));

  rows.map((row) => {
    searchResult.records.push({
      id: row.id,
      name: row.name ?? "",
      owner: user?.id,
      ownerDisplayName: user?.id === row.owner
        ? "me"
        : `${userMap.get(row.owner ?? "")?.firstName} ${userMap.get(row.owner ?? "")?.lastName}`,
      ownerAvatarUrl: userMap.get(row.owner ?? "")?.imageUrl,
      book: row.book ?? "",
      passage: row.passage ?? "",
      public: row.public ?? false,
      starred: row.starred ?? false,
      lastUpdated: row.updatedAt ? new Date(row.updatedAt) : undefined,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      metadata: row.metadata as StudyMetadata,
      notes: row.notes ?? "",
    });
  });

  searchResult.totalPages = Math.ceil(totalCount / PAGINATION_SIZE);

  return searchResult;
}

export async function fetchRecentStudies(
  query: string,
  currentPage: number,
  sortKey: keyof typeof study,
  sortAsc: boolean
) {
  let searchResult: FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();

  const filter = and(
    eq(study.owner, user?.id ?? ''),
    or(
      ilike(study.name, `%${query}%`),
      ilike(study.book, `%${query}%`),
      like(study.passage, `%${query}%`),  // passage uses $contains (case-sensitive) in original
    )
  );

  const sortColumn = SORT_COLUMNS[sortKey as keyof typeof SORT_COLUMNS] ?? study.createdAt;
  const sortOrder = sortAsc ? asc(sortColumn) : desc(sortColumn);

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(study)
      .where(filter)
      .orderBy(sortOrder)
      .limit(PAGINATION_SIZE)
      .offset((currentPage - 1) * PAGINATION_SIZE),

    db
      .select({ count: count() })
      .from(study)
      .where(filter)
      .then((res) => res[0].count),
  ]);

  rows.map((row) => {
    searchResult.records.push({
      id: row.id,
      name: row.name ?? "",
      owner: user?.id,
      book: row.book ?? "",
      passage: row.passage ?? "",
      public: row.public ?? false,
      starred: row.starred ?? false,
      lastUpdated: row.updatedAt ? new Date(row.updatedAt) : undefined,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      metadata: row.metadata as StudyMetadata,
      notes: row.notes ?? "",
    });
  });

  searchResult.totalPages = Math.ceil(totalCount / PAGINATION_SIZE);

  return searchResult;
}

export async function fetchModelStudies(query: string, currentPage: number, sortKey: any, sortAsc: boolean) {
  const PAGINATION_SIZE = 10;

  const searchResult: FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();

  const filter = and(
    eq(study.model, true),
    or(
      ilike(study.name, `%${query}%`),
      ilike(study.book, `%${query}%`),
      like(study.passage, `%${query}%`),
    )
  );

  const sortColumn = SORT_COLUMNS[sortKey as keyof typeof SORT_COLUMNS] ?? study.createdAt;
  const sortOrder = sortAsc ? asc(sortColumn) : desc(sortColumn);

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(study)
      .where(filter)
      .orderBy(sortOrder)
      .limit(PAGINATION_SIZE)
      .offset((currentPage - 1) * PAGINATION_SIZE),

    db
      .select({ count: count() })
      .from(study)
      .where(filter)
      .then((res) => res[0].count),
  ]);

  rows.map((row) => {
    searchResult.records.push({
      id: row.id,
      name: row.name ?? "",
      owner: user?.id,
      book: row.book ?? "",
      passage: row.passage ?? "",
      public: row.public ?? false,
      starred: row.starred ?? false,
      lastUpdated: row.updatedAt ? new Date(row.updatedAt) : undefined,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      metadata: row.metadata as StudyMetadata,
      notes: row.notes ?? "",
    });
  });

  searchResult.totalPages = Math.ceil(totalCount / PAGINATION_SIZE);

  return searchResult;
}

const createPassageRangeCondition = (passageInfo: PassageInfo): SQL => {
  const bookValue = passageInfo.book ?? "psalms";

  if (passageInfo.startChapter === passageInfo.endChapter) {
    return and(
      eq(hebBible.book, bookValue),
      eq(hebBible.chapter, passageInfo.startChapter),
      gte(hebBible.verse, passageInfo.startVerse),
      lte(hebBible.verse, passageInfo.endVerse)
    ) as SQL;
  }

  const chapterConditions: SQL[] = [
    and(
      eq(hebBible.chapter, passageInfo.startChapter),
      gte(hebBible.verse, passageInfo.startVerse)
    ) as SQL,
    and(
      eq(hebBible.chapter, passageInfo.endChapter),
      lte(hebBible.verse, passageInfo.endVerse)
    ) as SQL,
  ];

  if (passageInfo.endChapter - passageInfo.startChapter > 1) {
    chapterConditions.push(
      and(
        gt(hebBible.chapter, passageInfo.startChapter),
        lt(hebBible.chapter, passageInfo.endChapter)
      ) as SQL
    );
  }

  return and(eq(hebBible.book, bookValue), or(...chapterConditions)) as SQL;
};

export async function fetchPassageData(studyId: string) {
  try {
    const currentStudy = await db
      .select()
      .from(study)
      .where(eq(study.id, studyId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    let studyData : StudyData = {
      id: studyId,
      name: currentStudy?.name || "",
      owner: currentStudy?.owner || "",
      book: currentStudy?.book || "",
      passage: currentStudy?.passage || "",
      public: currentStudy?.public || false,
      model: currentStudy?.model || false,
      metadata: (currentStudy?.metadata as StudyMetadata) || {},
      notes: currentStudy?.notes || ""
    };

    let passageData : PassageStaticData = { study: studyData, bibleData: [] as WordProps[] };

    if (currentStudy)
    {
      const passageInfo = parsePassageInfo(currentStudy.passage || '', currentStudy.book || 'psalms');
      console.log(passageInfo)
      if (passageInfo instanceof Error === false)
      {
        const passageCondition = createPassageRangeCondition(passageInfo);
        const passageContent = await db
          .select({
            hebId: hebBible.hebId,
            chapter: hebBible.chapter,
            verse: hebBible.verse,
            strongNumber: hebBible.strongNumber,
            wlcWord: hebBible.wlcWord,
            gloss: hebBible.gloss,
            ETCBCgloss: hebBible.ETCBCgloss,
            morphology: hebBible.morphology,
            BSBnewLine: hebBible.BSBnewLine,
            motifCategories: motifLink.categories,
            relatedStrongCodes: motifLink.relatedStrongCodes,
            motifLemma: lemmaLink.lemma,
          })
          .from(hebBible)
          .leftJoin(motifLink, eq(hebBible.motifLinkId, motifLink.id))
          .leftJoin(lemmaLink, eq(motifLink.lemmaLinkId, lemmaLink.id))
          .where(passageCondition)
          .orderBy(asc(hebBible.hebId));

        const uniqueStrongNumbers = new Set<number>();
        passageContent.forEach((word) => {
          if (word.strongNumber) {
            uniqueStrongNumbers.add(word.strongNumber);
          }
        });

        type StepBibleWordInfo = Pick<typeof stepbibleTbesh.$inferSelect, (typeof STEP_BIBLE_SELECT_COLUMNS)[number]> & {
          preferredStrong?: string;
        };

        const stepBibleMap = new Map<number, StepBibleWordInfo>();

        const getStrongSuffix = (strongNumber: number) => {
          const [, fractional] = strongNumber.toString().split(".");
          let alphabetIndex = -1;

          if (fractional) {
            const cleanedFraction = fractional.replace(/0+$/, "");
            const numericValue = parseInt(cleanedFraction, 10);

            if (Number.isFinite(numericValue) && numericValue > 0) {
              alphabetIndex = numericValue - 1;
            }
          }

          if (alphabetIndex < 0 || alphabetIndex >= 26) {
            const fractionalPortion = Math.abs(strongNumber - Math.trunc(strongNumber));
            const approximatedIndex = Math.round(fractionalPortion * 10) - 1;

            if (approximatedIndex >= 0 && approximatedIndex < 26) {
              alphabetIndex = approximatedIndex;
            }
          }

          if (alphabetIndex < 0 || alphabetIndex >= 26) {
            return "";
          }

          return String.fromCharCode("a".charCodeAt(0) + alphabetIndex);
        };

        const formatStrongCode = (strongNumber: number) => {
          const base = Math.trunc(strongNumber).toString().padStart(4, "0");
          const suffix = getStrongSuffix(strongNumber);
          return `H${base}${suffix}`;
        };

        const getStrongCodeVariants = (strongNumber: number) => {
          const truncated = Math.trunc(strongNumber);
          const numeric = truncated.toString();
          const suffix = getStrongSuffix(strongNumber);

          const baseCodes = [`H${numeric}`, `H${numeric.padStart(4, "0")}`, `H${numeric.padStart(5, "0")}`];

          const suffixedCodes = suffix
            ? baseCodes.map((code) => `${code}${suffix}`)
            : [];

          return Array.from(new Set([...suffixedCodes, ...baseCodes]));
        };

        const normalizeStrongCode = (code: string) => code.trim().toUpperCase();

        const getStrongNumericValue = (code?: string) => {
          if (!code) {
            return undefined;
          }

          const numericMatch = code.toUpperCase().match(/H?0*(\d{1,5})/);

          if (!numericMatch) {
            return undefined;
          }

          return parseInt(numericMatch[1], 10);
        };

        const selectPreferredStrong = (
          codes: Array<string | undefined>,
          baseStrong?: number,
          fallback?: string
        ) => {
          const trimmedCodes = codes
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value && value.length > 0));

          if (trimmedCodes.length === 0) {
            return fallback;
          }

          if (baseStrong === undefined) {
            return trimmedCodes[0];
          }

          const matchingCodes = trimmedCodes.filter(
            (value) => getStrongNumericValue(value) === baseStrong
          );

          if (matchingCodes.length === 0) {
            return trimmedCodes[0];
          }

          return matchingCodes.sort((a, b) => b.length - a.length)[0];
        };

        const createStepBibleWordInfo = (
          record: Pick<typeof stepbibleTbesh.$inferSelect, (typeof STEP_BIBLE_SELECT_COLUMNS)[number]>,
          normalizedCode: string,
          baseStrong?: number
        ): StepBibleWordInfo => {
          const { Hebrew, Transliteration, Gloss, Meaning, Morph, eStrong, dStrong, uStrong } = record;

          const strongCodes: Array<string | undefined> = [
            eStrong ?? undefined,
            dStrong ?? undefined,
            uStrong ?? undefined,
          ];

          const preferredStrong =
            selectPreferredStrong(strongCodes, baseStrong, normalizedCode) ?? normalizedCode;

          return {
            Hebrew,
            Transliteration,
            Gloss,
            Meaning,
            Morph,
            eStrong,
            dStrong,
            uStrong,
            preferredStrong,
          };
        };

        const fetchRecordForCode = async (
          column: "eStrong" | "dStrong" | "uStrong",
          code: string,
          matchType: "equals" | "startsWith" = "equals",
          baseStrong?: number
        ) => {
          const normalizedCode = normalizeStrongCode(code);

          if (!normalizedCode) {
            return undefined;
          }

          const columnMap = {
            eStrong: stepbibleTbesh.eStrong,
            dStrong: stepbibleTbesh.dStrong,
            uStrong: stepbibleTbesh.uStrong,
          };
          const targetColumn = columnMap[column];

          if (matchType === "startsWith") {
            const records = await db
              .select({
                Hebrew: stepbibleTbesh.Hebrew,
                Transliteration: stepbibleTbesh.Transliteration,
                Gloss: stepbibleTbesh.Gloss,
                Meaning: stepbibleTbesh.Meaning,
                Morph: stepbibleTbesh.Morph,
                eStrong: stepbibleTbesh.eStrong,
                dStrong: stepbibleTbesh.dStrong,
                uStrong: stepbibleTbesh.uStrong,
              })
              .from(stepbibleTbesh)
              .where(like(targetColumn, `${normalizedCode}%`));

            for (const record of records) {
              const columnValue = record[column]?.trim();

              if (baseStrong !== undefined && getStrongNumericValue(columnValue) !== baseStrong) {
                continue;
              }

              return createStepBibleWordInfo(record, normalizedCode, baseStrong);
            }

            return undefined;
          }

          const record = await db
            .select({
              Hebrew: stepbibleTbesh.Hebrew,
              Transliteration: stepbibleTbesh.Transliteration,
              Gloss: stepbibleTbesh.Gloss,
              Meaning: stepbibleTbesh.Meaning,
              Morph: stepbibleTbesh.Morph,
              eStrong: stepbibleTbesh.eStrong,
              dStrong: stepbibleTbesh.dStrong,
              uStrong: stepbibleTbesh.uStrong,
            })
            .from(stepbibleTbesh)
            .where(eq(targetColumn, normalizedCode))
            .limit(1)
            .then((rows) => rows[0]);

          if (!record) {
            return undefined;
          }

          if (baseStrong !== undefined) {
            const columnValue = record[column]?.trim();
            if (getStrongNumericValue(columnValue) !== baseStrong) {
              return undefined;
            }
          }

          return createStepBibleWordInfo(record, normalizedCode, baseStrong);
        };

        const fetchStepBibleRecord = async (strongNumber: number) => {
          const strongCodes = getStrongCodeVariants(strongNumber);
          const baseStrong = Math.trunc(strongNumber);

          for (const code of strongCodes) {
            const record =
              (await fetchRecordForCode("eStrong", code, "equals", baseStrong)) ||
              (await fetchRecordForCode("dStrong", code, "equals", baseStrong)) ||
              (await fetchRecordForCode("uStrong", code, "equals", baseStrong));

            if (record) {
              return record;
            }
          }

          for (const code of strongCodes) {
            const record =
              (await fetchRecordForCode("eStrong", code, "startsWith", baseStrong)) ||
              (await fetchRecordForCode("dStrong", code, "startsWith", baseStrong)) ||
              (await fetchRecordForCode("uStrong", code, "startsWith", baseStrong));

            if (record) {
              return record;
            }
          }

          return undefined;
        };

        await Promise.all(
          Array.from(uniqueStrongNumbers).map(async (strongNumber) => {
            const preferredRecord = await fetchStepBibleRecord(strongNumber);

            if (preferredRecord) {
              const {
                Hebrew,
                Transliteration,
                Gloss,
                Meaning,
                Morph,
                eStrong,
                dStrong,
                uStrong,
                preferredStrong,
              } = preferredRecord;

              stepBibleMap.set(strongNumber, {
                Hebrew,
                Transliteration,
                Gloss,
                Meaning,
                Morph,
                eStrong,
                dStrong,
                uStrong,
                preferredStrong,
              });
            }
          })
        );

        const strongNumberSet = new Set<number>();
        passageContent.forEach(word => word.strongNumber && strongNumberSet.add(word.strongNumber));
        passageContent.forEach(word => {
          let hebWord = {} as WordProps;
          hebWord.wordId = word.hebId || 0;
          hebWord.chapter = word.chapter || 0;
          hebWord.verse = word.verse || 0;
          hebWord.strongNumber = word.strongNumber || 0;
          hebWord.wlcWord = word.wlcWord || "";
          hebWord.gloss = word.gloss?.trim() || "";
          hebWord.ETCBCgloss = word.ETCBCgloss || "";
          hebWord.morphology = word.morphology?.trim() || "";
          hebWord.showVerseNum = false;
          hebWord.newLine = (word.BSBnewLine) || false;

          if (word.motifCategories || word.relatedStrongCodes || word.motifLemma) {
            const relatedStrongNums = word.relatedStrongCodes?.map(code => parseInt(code))
                                        .filter(code => strongNumberSet.has(code) && code != word.strongNumber);
            hebWord.motifData = {
              lemma: word.motifLemma || "",
              relatedStrongNums: relatedStrongNums || [],
              categories: word.motifCategories || []
            }
            //console.log(hebWord.motifData);
          }

          const wordInfo = word.strongNumber ? stepBibleMap.get(word.strongNumber) : undefined;
          const defaultStrong = word.strongNumber ? formatStrongCode(word.strongNumber) : "";

          const extractStrongCode = (value: string | null | undefined) => {
            if (!value) {
              return "";
            }

            const trimmed = value.trim();
            const match = trimmed.match(/H\d{3,5}[A-Za-z]?/i);

            if (!match) {
              return trimmed.toUpperCase();
            }

            const matched = match[0];
            const head = matched.slice(0, 1).toUpperCase();
            const rest = matched.slice(1);
            return `${head}${rest}`;
          };

          const cleanGlossValue = (value: string | null | undefined) => {
            if (!value) {
              return "";
            }

            const trimmed = value.trim();
            if (!trimmed) {
              return "";
            }

            const colonIndex = trimmed.indexOf(":");
            if (colonIndex === -1) {
              return trimmed;
            }

            return trimmed.slice(0, colonIndex).trim();
          };

          const cleanMeaningValue = (value: string | null | undefined) => {
            if (!value) {
              return "";
            }

            const trimmed = value.trim();
            if (!trimmed) {
              return "";
            }

            const lower = trimmed.toLowerCase();
            const colonIndex = trimmed.indexOf(":");
            const brIndex = lower.indexOf("<br");

            if (colonIndex !== -1 && brIndex !== -1 && colonIndex < brIndex) {
              const afterBreak = trimmed.slice(brIndex);
              const withoutFirstBreak = afterBreak.replace(/^<br\s*\/?>(\s*)?/i, "");
              return withoutFirstBreak.trim();
            }

            return trimmed;
          };

          const preferredMorphology = (() => {
            const hebMorph = word.morphology?.trim();
            if (hebMorph && hebMorph.length > 0) {
              return hebMorph;
            }
            const stepMorph = wordInfo?.Morph?.trim();
            return stepMorph && stepMorph.length > 0 ? stepMorph : "";
          })();

          const hebrewWord = (() => {
            const stepBibleHebrew = wordInfo?.Hebrew?.trim();
            if (stepBibleHebrew && stepBibleHebrew.length > 0) {
              return stepBibleHebrew;
            }
            const wlcHebrew = hebWord.wlcWord?.trim();
            return wlcHebrew && wlcHebrew.length > 0 ? wlcHebrew : "";
          })();

          const gloss = (() => {
            const stepBibleGloss = wordInfo?.Gloss?.trim();
            if (stepBibleGloss && stepBibleGloss.length > 0) {
              return stepBibleGloss;
            }
            const passageGloss = hebWord.gloss?.trim();
            return passageGloss && passageGloss.length > 0 ? passageGloss : "";
          })();

          hebWord.morphology = preferredMorphology;
          const strongValue =
            extractStrongCode(wordInfo?.preferredStrong) ||
            extractStrongCode(wordInfo?.eStrong) ||
            extractStrongCode(wordInfo?.dStrong) ||
            extractStrongCode(wordInfo?.uStrong) ||
            defaultStrong;

          const strongNumberForDisplay = strongValue
            ? formatStrongNumberForDisplay(strongValue)
            : "";

          hebWord.wordInformation = {
            hebrew: hebrewWord,
            transliteration: wordInfo?.Transliteration?.trim() || "",
            gloss: cleanGlossValue(gloss),
            morphology: preferredMorphology,
            strongsNumber: strongNumberForDisplay,
            meaning: cleanMeaningValue(wordInfo?.Meaning),
          };

          passageData.bibleData.push(hebWord);
        })
      }
    }
//    console.log(wordsInPassage);
    return passageData;
  }
  catch (error) {
    console.error('Database Error', error);
    throw new Error('Failed to fetch passage data by study id');
  }
}

export async function fetchESVTranslation(book: string, chapter: number, verse: number) {

  const ESV_API_KEY = process.env.ESV_API_KEY;
  const normalizedBook = (book || 'psalms').trim().toLowerCase();
  const esvBookNameMap: Record<string, string> = {
    psalms: 'Psalm',
    genesis: 'Genesis',
    isaiah: 'Isaiah',
    jonah: 'Jonah',
  };
  const formatBookName = (value: string) =>
    value
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  const queryBook = esvBookNameMap[normalizedBook] ?? (formatBookName(normalizedBook) || 'Psalm');

  const esvApiEndpoint = new URL('https://api.esv.org/v3/passage/text/?');
  esvApiEndpoint.searchParams.append('q', `${queryBook}+${chapter}:${verse}`);
  esvApiEndpoint.searchParams.append('include-headings', 'false');
  esvApiEndpoint.searchParams.append('include-footnotes', 'false');
  esvApiEndpoint.searchParams.append('include-verse-numbers', 'false');
  esvApiEndpoint.searchParams.append('include-short-copyright', 'false');
  esvApiEndpoint.searchParams.append('include-passage-references', 'false');

  try {
    const response = await fetch(esvApiEndpoint, {
      headers: {
        'Authorization': 'Token ' + ESV_API_KEY
      },
    })
  
    const data = await response.json();
    return Object.hasOwn(data, 'passages') ? data.passages[0] : "";
  } catch (error) {
    throw new Error('Failed to fetch passage text from ESV API endpoint (error ' + error);
  }
};