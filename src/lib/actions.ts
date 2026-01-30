'use server';

import { z } from 'zod';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { getDb } from '@/db/client';
import {
  study,
  stepbibleTbesh,
  hebBibleGenesisAndPsalms,
  styling,
  stropheStyling,
  stanzaStyling,
  motif,
  lexicon,
  type StudyRecord,
  type StepbibleTbeshRecord,
} from '@/db/schema';
import { currentUser, clerkClient } from '@clerk/nextjs';

import { parsePassageInfo, PassageInfo } from './utils';
import { StudyData, PassageData, PassageStaticData, StudyProps, PassageProps, StudyMetadata, WordProps, StropheData, HebWord, StanzaData, FetchStudiesResult } from './data';
import { and, asc, desc, eq, gt, gte, ilike, like, lt, lte, or, sql } from 'drizzle-orm';

const formatStrongNumberForDisplay = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return normalized.replace(/([0-9])([A-Z]+)$/, '$1');
};

const createRecordId = () => `rec_${randomUUID()}`;

const RenameFormSchema = z.object({
  id: z.string(),
  studyName: z.string({ required_error: "Study name is required" })
    .min(5, { message: "Study name must be more than 5 characters" })
    .max(50, { message: "Study name must be less than 50 characters" })
    .trim(),
});

export type State = {
    errors?: {
      studyName?: string[];
    };
    message?: string | null;
};

const buildChapterRangeFilter = (passageInfo: PassageInfo) => {
  if (passageInfo.startChapter === passageInfo.endChapter) {
    return and(
      eq(hebBibleGenesisAndPsalms.chapter, passageInfo.startChapter),
      gte(hebBibleGenesisAndPsalms.verse, passageInfo.startVerse),
      lte(hebBibleGenesisAndPsalms.verse, passageInfo.endVerse)
    );
  }

  const middleChapterCondition =
    passageInfo.endChapter - passageInfo.startChapter > 1
      ? and(
          gt(hebBibleGenesisAndPsalms.chapter, passageInfo.startChapter),
          lt(hebBibleGenesisAndPsalms.chapter, passageInfo.endChapter)
        )
      : undefined;

  return or(
    and(
      eq(hebBibleGenesisAndPsalms.chapter, passageInfo.startChapter),
      gte(hebBibleGenesisAndPsalms.verse, passageInfo.startVerse)
    ),
    and(
      eq(hebBibleGenesisAndPsalms.chapter, passageInfo.endChapter),
      lte(hebBibleGenesisAndPsalms.verse, passageInfo.endVerse)
    ),
    ...(middleChapterCondition ? [middleChapterCondition] : [])
  );
};

const createPassageRangeFilter = (passageInfo: PassageInfo) => {
  const bookValue = passageInfo.book ?? "psalms";
  return and(
    eq(hebBibleGenesisAndPsalms.book, bookValue),
    buildChapterRangeFilter(passageInfo)
  );
};

export async function fetchStudyById(studyId: string) {

  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  //noStore();
  const db = getDb();

  try {
      const [studyRecord] = await db
        .select()
        .from(study)
        .where(eq(study.id, studyId))
        .limit(1);

      let result : StudyData = {
          id: studyId,
          name: studyRecord?.name || "",
          owner: studyRecord?.owner || "",
          book: studyRecord?.book || "", 
          passage: studyRecord?.passage || "",
          public: studyRecord?.public || false,
          model: studyRecord?.model || false,
          metadata: (studyRecord?.metadata as StudyMetadata) || {},
          notes: studyRecord?.notes || ""
      };

      return result;
  } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch study record.');        
  }
}

export async function updateStudyName(id: string, studyName: string) {

  const db = getDb();
  try {
    await db.update(study).set({ name: studyName }).where(eq(study.id, id));
  } catch (error) {
    return { message: 'Database Error: Failed to update study name.' };
  }
}

export async function updateStudyNotes(id: string, content: string) {
  
  const db = getDb();
  try {
    await db.update(study).set({ notes: content }).where(eq(study.id, id));
  } catch (error) {
    return { message: "Database Error: Failed to update study notes"}
  }
}

export async function updatePublic(studyId: string, publicAccess: boolean) {
  "use server";

  const db = getDb();
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

  const db = getDb();
  try {
    await db
      .update(study)
      .set({ starred: isStarred })
      .where(eq(study.id, studyId));
  } catch (error) {
    return { message: 'Database Error: Failed to update study star.' };
  }
}

export async function updateMetadataInDb(studyId: string, studyMetadata: StudyMetadata) {
  "use server";

  const db = getDb();
  try {
    const metadataJson = JSON.stringify(studyMetadata);
    if (metadataJson) {
      await db
        .update(study)
        .set({ metadata: studyMetadata })
        .where(eq(study.id, studyId));
    }
  } catch (error) {
    return { message: 'Database Error: Failed to update study star.' };
  }
}




export async function deleteStudy(studyId: string) {

  const db = getDb();
  try {
    await db.delete(study).where(eq(study.id, studyId));
  } catch (error) {
    return { message: 'Database Error: Failed to delete study.' };
  }
}

export async function createStudy(passage: string, book: string) {

  const user = await currentUser();

  if (user)
  {
    var record : StudyRecord | undefined;
    const db = getDb();
    try {
      const [created] = await db
        .insert(study)
        .values({
          id: createRecordId(),
          name: "Untitled Study",
          passage,
          book,
          owner: user.id,
        })
        .returning();
      record = created;
    } catch (error) {
      return { message: 'Database Error: Failed to Create Study.' };
    }
    if (record)
      redirect('/study/' + record.id.replace("rec_", "") + '/edit');
  }
}

export async function cloneStudy(originalStudy: StudyData, newName: string) {

  const user = await currentUser();

  if (user)
  {
    var record : StudyRecord | undefined;
    const db = getDb();
    try {
      const [created] = await db
        .insert(study)
        .values({
          id: createRecordId(),
          name: newName,
          book: originalStudy.book,
          passage: originalStudy.passage,
          owner: user.id,
          metadata: originalStudy.metadata,
        })
        .returning();
      record = created;
    } catch (error) {
      return { message: 'Database Error: Failed to Clone Study.' };
    }
    if (record)
      redirect('/study/' + record.id.replace("rec_", "") + '/edit');
  }
}

const PAGINATION_SIZE = 10;
const studySortColumns = {
  name: study.name,
  passage: study.passage,
  createdAt: study.xataCreatedAt,
  updatedAt: study.xataUpdatedAt,
  public: study.public,
};

const resolveStudySortColumn = (sortKey: string) =>
  studySortColumns[sortKey as keyof typeof studySortColumns] ??
  study.xataUpdatedAt;

export async function fetchPublicStudies(query: string, currentPage: number, sortKey: string, sortAsc: boolean) {
  const searchResult : FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();
  const db = getDb();

  const searchFilter = and(
    eq(study.model, false),
    eq(study.public, true),
    or(
      ilike(study.name, `%${query}%`),
      ilike(study.book, `%${query}%`),
      ilike(study.passage, `%${query}%`)
    )
  );

  const sortColumn = resolveStudySortColumn(sortKey);

  const search = await db
    .select()
    .from(study)
    .where(searchFilter)
    .orderBy(sortAsc ? asc(sortColumn) : desc(sortColumn))
    .limit(PAGINATION_SIZE)
    .offset((currentPage - 1) * PAGINATION_SIZE);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(study)
    .where(searchFilter);

  // extract the ids from owner column and add them into a set
  const uniqueIds = new Set<string>();
  search.forEach((studyRecord) => {
    if (studyRecord?.owner) {
      uniqueIds.add(studyRecord.owner);
    }
  });

  // fetch ids and sessions of owners from clerk
  const users = await clerkClient.users.getUserList({ userId: Array.from(uniqueIds) });

  let mp = new Map();
  for (let i = 0; i < users.length; i++) {
    mp.set(users[i].id, users[i]);
  }

  const thisUser = await currentUser();

  search.forEach((studyRecord) => {
    searchResult.records.push({
      id: studyRecord.id,
      name: studyRecord.name,
      owner: user?.id,
      ownerDisplayName:
        thisUser?.id === studyRecord.owner
          ? "me"
          : mp.get(studyRecord.owner)?.firstName + " " + mp.get(studyRecord.owner)?.lastName,
      ownerAvatarUrl: mp.get(studyRecord.owner)?.imageUrl,
      passage: studyRecord.passage,
      book: studyRecord.book!,
      public: studyRecord.public || false,
      starred: studyRecord.starred || false,
      lastUpdated: studyRecord.xataUpdatedAt ?? undefined,
      createdAt: studyRecord.xataCreatedAt ?? undefined,
      metadata: studyRecord.metadata as StudyMetadata,
      notes: studyRecord.notes || "",
    });
  });
  searchResult.totalPages = Math.ceil((count ?? 0) / PAGINATION_SIZE);
  return searchResult;
}

export async function fetchRecentStudies(query: string, currentPage: number, sortKey: string, sortAsc: boolean) {
  let searchResult : FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();
  if (!user?.id) {
    return searchResult;
  }

  const db = getDb();

  // filter by study name, book, and passage
  // book+passage is displayed for the passage column, so we need to filter by book here
  // update the filter if UI changes, same for fetchPublicStudies and fetchModelStudies
  const searchFilter = and(
    eq(study.owner, user.id),
    or(
      ilike(study.name, `%${query}%`),
      ilike(study.book, `%${query}%`),
      ilike(study.passage, `%${query}%`)
    )
  );

  const sortColumn = resolveStudySortColumn(sortKey);

  const search = await db
    .select()
    .from(study)
    .where(searchFilter)
    .orderBy(sortAsc ? asc(sortColumn) : desc(sortColumn))
    .limit(PAGINATION_SIZE)
    .offset((currentPage - 1) * PAGINATION_SIZE);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(study)
    .where(searchFilter);

  search.forEach((studyRecord) => {
    searchResult.records.push({
      id: studyRecord.id,
      name: studyRecord.name,
      owner: user?.id,
      book: studyRecord.book || "",
      passage: studyRecord.passage,
      public: studyRecord.public || false,
      starred: studyRecord.starred || false,
      lastUpdated: studyRecord.xataUpdatedAt ?? undefined,
      createdAt: studyRecord.xataCreatedAt ?? undefined,
      metadata: studyRecord.metadata as StudyMetadata,
      notes: studyRecord.notes || "",
    });
  });
  searchResult.totalPages = Math.ceil((count ?? 0) / PAGINATION_SIZE);
  return searchResult;
}

export async function fetchModelStudies(query: string, currentPage: number, sortKey: string, sortAsc: boolean) {
  const PAGINATION_SIZE = 10;

  let searchResult : FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();

  const db = getDb();

  const searchFilter = and(
    eq(study.model, true),
    or(
      ilike(study.name, `%${query}%`),
      ilike(study.book, `%${query}%`),
      ilike(study.passage, `%${query}%`)
    )
  );

  const sortColumn = resolveStudySortColumn(sortKey);

  const search = await db
    .select()
    .from(study)
    .where(searchFilter)
    .orderBy(sortAsc ? asc(sortColumn) : desc(sortColumn))
    .limit(PAGINATION_SIZE)
    .offset((currentPage - 1) * PAGINATION_SIZE);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(study)
    .where(searchFilter);

  search.forEach((studyRecord) => {
    searchResult.records.push({
      id: studyRecord.id,
      name: studyRecord.name,
      owner: user?.id,
      book: studyRecord.book || "",
      passage: studyRecord.passage,
      public: studyRecord.public || false,
      starred: studyRecord.starred || false,
      lastUpdated: studyRecord.xataUpdatedAt ?? undefined,
      metadata: studyRecord.metadata as StudyMetadata,
      notes: studyRecord.notes || "",
    });
  });
  searchResult.totalPages = Math.ceil((count ?? 0) / PAGINATION_SIZE);
  return searchResult;
}

export async function fetchPassageData(studyId: string) {
  const db = getDb();

  try {
    const [studyRecord] = await db
      .select()
      .from(study)
      .where(eq(study.id, studyId))
      .limit(1);

    let studyData : StudyData = {
      id: studyId,
      name: studyRecord?.name || "",
      owner: studyRecord?.owner || "",
      book: studyRecord?.book || "",
      passage: studyRecord?.passage || "",
      public: studyRecord?.public || false,
      model: studyRecord?.model || false,
      metadata: (studyRecord?.metadata as StudyMetadata) || {},
      notes: studyRecord?.notes || ""
    };

    let passageData : PassageStaticData = { study: studyData, bibleData: [] as WordProps[] };

    if (studyRecord)
    {
      const passageInfo = parsePassageInfo(studyRecord.passage, studyRecord.book||'psalms');
      console.log(passageInfo)
      // fetch all words from the database by start/end chapter and verse
      if (passageInfo instanceof Error === false)
      {
        const passageFilter = createPassageRangeFilter(passageInfo);
        const passageContent = await db
          .select({
            hebId: hebBibleGenesisAndPsalms.hebId,
            chapter: hebBibleGenesisAndPsalms.chapter,
            verse: hebBibleGenesisAndPsalms.verse,
            strongNumber: hebBibleGenesisAndPsalms.strongNumber,
            wlcWord: hebBibleGenesisAndPsalms.wlcWord,
            gloss: hebBibleGenesisAndPsalms.gloss,
            ETCBCgloss: hebBibleGenesisAndPsalms.ETCBCgloss,
            morphology: hebBibleGenesisAndPsalms.morphology,
            BSBnewLine: hebBibleGenesisAndPsalms.BSBnewLine,
            motifCategories: motif.categories,
            motifRelatedStrongCodes: motif.relatedStrongCodes,
            lemma: lexicon.lemma,
          })
          .from(hebBibleGenesisAndPsalms)
          .leftJoin(motif, eq(hebBibleGenesisAndPsalms.motifLink, motif.id))
          .leftJoin(lexicon, eq(motif.lemmaLink, lexicon.id))
          .where(passageFilter)
          .orderBy(asc(hebBibleGenesisAndPsalms.hebId));

        const uniqueStrongNumbers = new Set<number>();
        passageContent.forEach((word) => {
          if (word.strongNumber) {
            uniqueStrongNumbers.add(word.strongNumber);
          }
        });

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

        type StepBibleColumn = (typeof STEP_BIBLE_SELECT_COLUMNS)[number];

        type StepBibleWordInfo = Pick<StepbibleTbeshRecord, StepBibleColumn> & {
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
          record: Pick<StepbibleTbeshRecord, StepBibleColumn>,
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

          const columnRef = stepbibleTbesh[column];
          const whereClause =
            matchType === "equals"
              ? eq(columnRef, normalizedCode)
              : like(columnRef, `${normalizedCode}%`);

          const query = db
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
            .where(whereClause);

          if (matchType === "startsWith") {
            const records = await query;

            for (const record of records) {
              const columnValue = record[column]?.trim();

              if (baseStrong !== undefined && getStrongNumericValue(columnValue) !== baseStrong) {
                continue;
              }

              return createStepBibleWordInfo(record, normalizedCode, baseStrong);
            }

            return undefined;
          }

          const [record] = await query.limit(1);

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

          if (word.motifCategories || word.motifRelatedStrongCodes || word.lemma) {
            const relatedStrongNums = word.motifRelatedStrongCodes
              ?.map((code) => parseInt(code))
              .filter(code => strongNumberSet.has(code) && code != word.strongNumber);
            hebWord.motifData = {
              lemma: word.lemma || "",
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

export async function fetchPassageContentOld(studyId: string) {
  
  const db = getDb();

  try {
    const [studyRecord] = await db
      .select()
      .from(study)
      .where(eq(study.id, studyId))
      .limit(1);

    let passageData = { studyId: studyId, stanzas: [] } as PassageData;

    if (studyRecord)
    {
      const book = (studyRecord.book ?? 'psalms').toLowerCase();
      const passageInfo = parsePassageInfo(studyRecord.passage, book);

      // fetch all words from the database by start/end chapter and verse
      if (passageInfo instanceof Error === false)
      {
        const wordStyling = await db
          .select({
            hebId: styling.hebId,
            colorFill: styling.colorFill,
            borderColor: styling.borderColor,
            textColor: styling.textColor,
            numIndent: styling.numIndent,
            lineBreak: styling.lineBreak,
            stropheDiv: styling.stropheDiv,
            stanzaDiv: styling.stanzaDiv,
          })
          .from(styling)
          .where(eq(styling.studyId, studyRecord.id))
          .orderBy(asc(styling.hebId));
        const wordStylingMap = new Map();
        wordStyling.forEach((obj) => {
          wordStylingMap.set(obj.hebId, { colorFill: obj.colorFill, borderColor: obj.borderColor, textColor: obj.textColor, numIndent: obj.numIndent, lineBreak: obj.lineBreak, stropheDiv: obj.stropheDiv, stanzaDiv: obj.stanzaDiv });
        });
        
        const stanzaStylingRows = await db
          .select({ stanzaId: stanzaStyling.stanzaId, expanded: stanzaStyling.expanded })
          .from(stanzaStyling)
          .where(eq(stanzaStyling.studyId, studyRecord.id))
          .orderBy(asc(stanzaStyling.stanzaId));
        const stanzaStylingMap = new Map();
        stanzaStylingRows.forEach((obj) => {
          stanzaStylingMap.set(obj.stanzaId, { expanded: obj.expanded })
        })

        const stropheStylingRows = await db
          .select({
            stropheId: stropheStyling.stropheId,
            expanded: stropheStyling.expanded,
            borderColor: stropheStyling.borderColor,
            colorFill: stropheStyling.colorFill,
          })
          .from(stropheStyling)
          .where(eq(stropheStyling.studyId, studyRecord.id))
          .orderBy(asc(stropheStyling.stropheId));
        const stropheStylingMap = new Map();
        stropheStylingRows.forEach((obj) => {
          stropheStylingMap.set(obj.stropheId, { borderColor: obj.borderColor, colorFill: obj.colorFill, expanded: obj.expanded });
        });

        const passageFilter = createPassageRangeFilter(passageInfo);
        const passageContent = await db
          .select({
            hebId: hebBibleGenesisAndPsalms.hebId,
            chapter: hebBibleGenesisAndPsalms.chapter,
            verse: hebBibleGenesisAndPsalms.verse,
            strongNumber: hebBibleGenesisAndPsalms.strongNumber,
            wlcWord: hebBibleGenesisAndPsalms.wlcWord,
            gloss: hebBibleGenesisAndPsalms.gloss,
            ETCBCgloss: hebBibleGenesisAndPsalms.ETCBCgloss,
            morphology: hebBibleGenesisAndPsalms.morphology,
            BSBnewLine: hebBibleGenesisAndPsalms.BSBnewLine,
            motifCategories: motif.categories,
            motifRelatedStrongCodes: motif.relatedStrongCodes,
            lemma: lexicon.lemma,
          })
          .from(hebBibleGenesisAndPsalms)
          .leftJoin(motif, eq(hebBibleGenesisAndPsalms.motifLink, motif.id))
          .leftJoin(lexicon, eq(motif.lemmaLink, lexicon.id))
          .where(passageFilter)
          .orderBy(asc(hebBibleGenesisAndPsalms.hebId));
        
        let currentStanzaIdx = -1;
        let currentStropheIdx = -1;
        let runningStropheIdx = -1;
        let currentLineIdx = -1;
        let prevVerseNum = 0;
        
        const strongNumberSet = new Set<number>();
        passageContent.forEach(word => word.strongNumber && strongNumberSet.add(word.strongNumber));
        passageContent.forEach(word => {
          let hebWord = {} as HebWord;
          hebWord.id = word.hebId || 0;
          hebWord.chapter = word.chapter || 0;
          hebWord.verse = word.verse || 0;
          hebWord.strongNumber = word.strongNumber || 0;
          hebWord.wlcWord = word.wlcWord || "";
          hebWord.gloss = word.gloss?.trim() || "";
          hebWord.ETCBCgloss = word.ETCBCgloss || "";
          hebWord.showVerseNum = false;
          hebWord.numIndent = 0;
          hebWord.lineBreak = (word.BSBnewLine) || false;
          hebWord.lastLineInStrophe = false;
          hebWord.firstWordInStrophe = false;
          hebWord.firstStropheInStanza = false; 
          hebWord.lastStropheInStanza = false;
          if (word.lemma) {
            hebWord.lemma = word.lemma || ""
          }
          const relatedStrongNums = word.motifRelatedStrongCodes?.map(code => parseInt(code))
                                      .filter(code => strongNumberSet.has(code) && code != word.strongNumber);
          if (relatedStrongNums && relatedStrongNums.length > 0) {
            hebWord.relatedStrongNums = relatedStrongNums;
          }
          hebWord.categories = word.motifCategories || [];

          const currentWordStyling = wordStylingMap.get(hebWord.id);
          if (currentWordStyling !== undefined) {
            (currentWordStyling.colorFill !== null) && (hebWord.colorFill = currentWordStyling.colorFill);
            (currentWordStyling.borderColor !== null) && (hebWord.borderColor = currentWordStyling.borderColor);
            (currentWordStyling.textColor !== null) && (hebWord.textColor = currentWordStyling.textColor);
            (currentWordStyling.numIndent !== null) && (hebWord.numIndent = currentWordStyling.numIndent);
            (currentWordStyling.lineBreak !== null) && (hebWord.lineBreak = currentWordStyling.lineBreak);
            (currentWordStyling.stropheDiv !== null) && (hebWord.stropheDiv = currentWordStyling.stropheDiv);
            (currentWordStyling.stanzaDiv !== null) && (hebWord.stanzaDiv = currentWordStyling.stanzaDiv);
          }

          let currentStanzaData = passageData.stanzas[currentStanzaIdx];
          if (currentStanzaData === undefined || (hebWord.stanzaDiv !== undefined && hebWord.stanzaDiv)) {
            if (currentStropheIdx !== -1 && currentStanzaIdx !== -1) {
              let currentStropheData = currentStanzaData.strophes[currentStropheIdx];
              let lastLineIdxInLastStrophe = currentStropheData.lines.length-1;
              currentStropheData.lines[lastLineIdxInLastStrophe].words.forEach(word => {
                word.lastLineInStrophe = true;
              })
            }
            
            
            passageData.stanzas.push({id: ++currentStanzaIdx, strophes:[]});
            currentStanzaData = passageData.stanzas[currentStanzaIdx];
            const currentStanzaStyling = stanzaStylingMap.get(currentStanzaIdx);
            if (currentStanzaStyling !== undefined) {
              (currentStanzaStyling.expanded !== null) && (currentStanzaData.expanded = currentStanzaStyling.expanded);
            }
            currentStropheIdx = -1;
          } 

          let currentStropheData = passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx];
          if (currentStropheData === undefined || (hebWord.stropheDiv !== undefined && hebWord.stropheDiv)) {
            if (currentStropheIdx !== -1) {
              let lastLineIdxInLastStrophe = passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines.length-1;
              passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines[lastLineIdxInLastStrophe].words.forEach(word => {
                word.lastLineInStrophe = true;
              })
            }
            passageData.stanzas[currentStanzaIdx].strophes.push({id: ++runningStropheIdx, lines: []});
            ++currentStropheIdx;
            currentStropheData = passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx];
            const currentStropheStyling = stropheStylingMap.get(runningStropheIdx);
            if (currentStropheStyling !== undefined) {
              (currentStropheStyling.colorFill !== null) && (currentStropheData.colorFill = currentStropheStyling.colorFill);
              (currentStropheStyling.borderColor !== null) && (currentStropheData.borderColor = currentStropheStyling.borderColor);
              (currentStropheStyling.expanded !== null) && (currentStropheData.expanded = currentStropheStyling.expanded);
            }
            currentStropheData.firstStropheInStanza = (currentStropheIdx === 0);
            currentLineIdx = -1;
            hebWord.firstWordInStrophe = true;
          } 

          let currentLineData = currentStropheData.lines[currentLineIdx];
          if (currentLineData === undefined || hebWord.lineBreak) {
            currentStropheData.lines.push({id: ++currentLineIdx, words: []})
            currentLineData = currentStropheData.lines[currentLineIdx];
          }

          if (prevVerseNum !== hebWord.verse) {
            hebWord.showVerseNum = true;
          }
          hebWord.firstStropheInStanza = (currentStropheIdx === 0);
          hebWord.lastStropheInStanza = false;
          hebWord.lineId = currentLineIdx;
          hebWord.stropheId = runningStropheIdx;
          hebWord.stanzaId = currentStanzaIdx;

          currentLineData.words.push(hebWord);
          prevVerseNum = hebWord.verse;
        })
        let lastLineIdxInLastStrophe = passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines.length-1;
        passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines[lastLineIdxInLastStrophe].words.forEach(word => {
          word.lastLineInStrophe = true;
        })
        passageData.stanzas.map((stanza) => {
          stanza.strophes.map((strophe, stropheId) => {
            strophe.lastStropheInStanza = (stropheId === stanza.strophes.length-1);
            strophe.lines.forEach((line) => {
              line.words.forEach((word) => {
                word.lastStropheInStanza = strophe.lastStropheInStanza?true:false;
              })
            })
          })
        })
      }
    }
    return passageData;
  }
  catch (error) {
    console.error('Database Error', error);
    throw new Error('Failed to fetch passage content by study id');
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

export async function fetchStudyOwner(studyId: string) {
  const db = getDb();
  try {
    const [studyRecord] = await db
      .select({ owner: study.owner })
      .from(study)
      .where(eq(study.id, studyId))
      .limit(1);
    return studyRecord?.owner ?? null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch study owner.');
  }
}
