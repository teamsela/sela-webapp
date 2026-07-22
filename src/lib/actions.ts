'use server';

import { redirect } from 'next/navigation';
import { currentUser, clerkClient } from '@clerk/nextjs/server';

import { db } from '../db';
import { hebBible, lemmaLink, motifLink, stepbibleTbesh, study } from '../schema';
import { and, or, ilike, like, eq, asc, desc, count, gte, lte, gt, lt, SQL, sql } from 'drizzle-orm';

import { nanoid } from 'nanoid';

import { parsePassageInfo, PassageInfo } from './utils';
import { StudyData, PassageData, PassageStaticData, StudyMetadata, WordProps, FetchStudiesResult, LayerData } from './data';
import { transliterateHebrew } from './transliterate';

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


/*
  Server-side write guard. Server actions are directly invocable by any signed-in
  client, so gating the UI is not enough: every action that mutates an existing
  study must confirm the caller owns it. Returns true only when the current user
  is the study's owner. Queries just the owner column to keep the check cheap.
*/
async function isStudyOwner(studyId: string): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;

  const row = await db
    .select({ owner: study.owner })
    .from(study)
    .where(eq(study.id, studyId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return !!row && row.owner === user.id;
}

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
      scriptura: row?.scriptura || false,
      metadata: (row?.metadata as StudyMetadata) || { words: {} },
      //layers: (row?.layers as LayerData[]) || { },
      notes: row?.notes || "",
    };

    return result;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch study record.');
  }
}

export async function updateStudyName(id: string, studyName: string) {
  if (!(await isStudyOwner(id))) {
    return { message: 'Unauthorized: You do not have permission to modify this study.' };
  }
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
  if (!(await isStudyOwner(studyId))) {
    return { message: 'Unauthorized: You do not have permission to modify this study.' };
  }
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
  if (!(await isStudyOwner(studyId))) {
    return { message: 'Unauthorized: You do not have permission to modify this study.' };
  }
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

  if (!(await isStudyOwner(studyId))) {
    return { message: 'Unauthorized: You do not have permission to modify this study.' };
  }

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
  if (!(await isStudyOwner(studyId))) {
    return { message: 'Unauthorized: You do not have permission to delete this study.' };
  }
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
          scriptura: false,
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
          notes: originalStudy.notes,
          public: false,
          model: false,
          starred: false,
          scriptura: false,
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
  const ownerIds = Array.from(uniqueIds);
  const users = ownerIds.length > 0
    ? (await (await clerkClient()).users.getUserList({ userId: ownerIds })).data
    : [];

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
      //layers: row.layers as LayerData[],
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
      scriptura: row.scriptura ?? false,
      lastUpdated: row.updatedAt ? new Date(row.updatedAt) : undefined,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      metadata: row.metadata as StudyMetadata,
      //layers: row.layers as LayerData[],
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
      //layers: row.layers as LayerData[],
      notes: row.notes ?? "",
    });
  });

  searchResult.totalPages = Math.ceil(totalCount / PAGINATION_SIZE);

  return searchResult;
}

export async function fetchScripturaStudies(query: string, currentPage: number, sortKey: any, sortAsc: boolean) {
  const PAGINATION_SIZE = 10;

  const searchResult: FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();

  const filter = and(
    eq(study.scriptura, true),
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
      //layers: row.layers as LayerData[],
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
      scriptura: currentStudy?.scriptura || false,
      metadata: (currentStudy?.metadata as StudyMetadata) || {},
      //layers: (currentStudy?.layers) as LayerData[] || {},
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

        // Build a query with the OHB hebUnicode column if it exists, else fall back without it.
        const buildPassageQuery = (includeHebUnicode: boolean) =>
          db
            .select({
              hebId: hebBible.hebId,
              chapter: hebBible.chapter,
              verse: hebBible.verse,
              strongNumber: hebBible.strongNumber,
              wlcWord: hebBible.wlcWord,
              ...(includeHebUnicode ? { hebUnicode: hebBible.hebUnicode } : {}),
              gloss: hebBible.gloss,
              ETCBCgloss: hebBible.ETCBCgloss,
              morphology: hebBible.morphology,
              BSBnewLine: hebBible.BSBnewLine,
              BSBstanzaBreak: hebBible.BSBstanzaBreak,
              motifCategories: motifLink.categories,
              relatedStrongCodes: motifLink.relatedStrongCodes,
              motifLemma: lemmaLink.lemma,
            })
            .from(hebBible)
            .leftJoin(motifLink, eq(hebBible.motifLinkId, motifLink.id))
            .leftJoin(lemmaLink, eq(motifLink.lemmaLinkId, lemmaLink.id))
            .where(passageCondition)
            .orderBy(asc(hebBible.hebId));

        let passageContent: Awaited<ReturnType<typeof buildPassageQuery>>;
        try {
          passageContent = await buildPassageQuery(true);
        } catch (queryErr: unknown) {
          const msg = queryErr instanceof Error ? queryErr.message : String(queryErr);
          if (msg.includes("hebUnicode") || msg.includes("column")) {
            // hebUnicode column doesn't exist yet — fall back without it
            passageContent = await buildPassageQuery(false) as typeof passageContent;
          } else {
            throw queryErr;
          }
        }

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

        type StepBibleColumn = "eStrong" | "dStrong" | "uStrong";
        type StepBibleMatchType = "equals" | "startsWith";
        type StepBibleRecord = Pick<typeof stepbibleTbesh.$inferSelect, (typeof STEP_BIBLE_SELECT_COLUMNS)[number]>;

        const STEP_BIBLE_CODE_BATCH_SIZE = 500;
        const STEP_BIBLE_COLUMN_ORDER: StepBibleColumn[] = ["eStrong", "dStrong", "uStrong"];

        const stepBibleSelect = {
          Hebrew: stepbibleTbesh.Hebrew,
          Transliteration: stepbibleTbesh.Transliteration,
          Gloss: stepbibleTbesh.Gloss,
          Meaning: stepbibleTbesh.Meaning,
          Morph: stepbibleTbesh.Morph,
          eStrong: stepbibleTbesh.eStrong,
          dStrong: stepbibleTbesh.dStrong,
          uStrong: stepbibleTbesh.uStrong,
        };

        const chunkValues = <T,>(values: T[], size: number) => {
          const chunks: T[][] = [];

          for (let i = 0; i < values.length; i += size) {
            chunks.push(values.slice(i, i + size));
          }

          return chunks;
        };

        const fetchStepBibleCandidates = async (
          codes: string[],
          matchType: StepBibleMatchType
        ): Promise<StepBibleRecord[]> => {
          const normalizedCodes = Array.from(
            new Set(
              codes
                .map(normalizeStrongCode)
                .filter((code) => code.length > 0)
            )
          );

          if (normalizedCodes.length === 0) {
            return [];
          }

          const records: StepBibleRecord[] = [];

          for (const codeBatch of chunkValues(normalizedCodes, STEP_BIBLE_CODE_BATCH_SIZE)) {
            const patterns = codeBatch.map((code) => `${code}%`);
            const codeArray = sql`ARRAY[${sql.join(codeBatch.map((code) => sql`${code}`), sql`, `)}]::text[]`;
            const patternArray = sql`ARRAY[${sql.join(patterns.map((pattern) => sql`${pattern}`), sql`, `)}]::text[]`;
            const whereClause = matchType === "equals"
              ? sql`(
                  ${stepbibleTbesh.eStrong} = ANY(${codeArray})
                  OR ${stepbibleTbesh.dStrong} = ANY(${codeArray})
                  OR ${stepbibleTbesh.uStrong} = ANY(${codeArray})
                )`
              : sql`(
                  ${stepbibleTbesh.eStrong} LIKE ANY(${patternArray})
                  OR ${stepbibleTbesh.dStrong} LIKE ANY(${patternArray})
                  OR ${stepbibleTbesh.uStrong} LIKE ANY(${patternArray})
                )`;

            const batchRecords = await db
              .select(stepBibleSelect)
              .from(stepbibleTbesh)
              .where(whereClause);

            records.push(...batchRecords);
          }

          return records;
        };

        const findStepBibleRecord = (
          candidates: StepBibleRecord[],
          column: StepBibleColumn,
          code: string,
          matchType: StepBibleMatchType,
          baseStrong: number
        ) => {
          const normalizedCode = normalizeStrongCode(code);

          if (!normalizedCode) {
            return undefined;
          }

          return candidates.find((record) => {
            const columnValue = record[column]?.trim();

            if (getStrongNumericValue(columnValue) !== baseStrong) {
              return false;
            }

            const normalizedColumnValue = normalizeStrongCode(columnValue ?? "");

            return matchType === "equals"
              ? normalizedColumnValue === normalizedCode
              : normalizedColumnValue.startsWith(normalizedCode);
          });
        };

        const selectStepBibleRecord = (
          candidates: StepBibleRecord[],
          strongNumber: number,
          matchType: StepBibleMatchType
        ) => {
          const strongCodes = getStrongCodeVariants(strongNumber);
          const baseStrong = Math.trunc(strongNumber);

          for (const code of strongCodes) {
            for (const column of STEP_BIBLE_COLUMN_ORDER) {
              const record = findStepBibleRecord(candidates, column, code, matchType, baseStrong);

              if (record) {
                return createStepBibleWordInfo(record, normalizeStrongCode(code), baseStrong);
              }
            }
          }

          return undefined;
        };

        const uniqueStrongNumberList = Array.from(uniqueStrongNumbers);
        const strongCodesForNumbers = (strongNumbers: number[]) =>
          Array.from(new Set(strongNumbers.flatMap(getStrongCodeVariants)));

        const exactCandidates = await fetchStepBibleCandidates(
          strongCodesForNumbers(uniqueStrongNumberList),
          "equals"
        );
        const unresolvedStrongNumbers: number[] = [];

        uniqueStrongNumberList.forEach((strongNumber) => {
          const preferredRecord = selectStepBibleRecord(exactCandidates, strongNumber, "equals");

          if (!preferredRecord) {
            unresolvedStrongNumbers.push(strongNumber);
            return;
          }

          stepBibleMap.set(strongNumber, preferredRecord);
        });

        if (unresolvedStrongNumbers.length > 0) {
          const prefixCandidates = await fetchStepBibleCandidates(
            strongCodesForNumbers(unresolvedStrongNumbers),
            "startsWith"
          );

          unresolvedStrongNumbers.forEach((strongNumber) => {
            const preferredRecord = selectStepBibleRecord(prefixCandidates, strongNumber, "startsWith");

            if (preferredRecord) {
              stepBibleMap.set(strongNumber, preferredRecord);
            }
          });
        }

        // The wlcWord column may store Hebrew text as HTML numeric entities
        // (e.g. "&#1497;&#1463;" instead of "יַ") depending on the database branch.
        // Decode them to actual Unicode so React renders Hebrew glyphs, not entity strings.
        const decodeHtmlEntities = (str: string | null | undefined): string => {
          if (!str) return "";
          return str.replace(/&#(\d+);/g, (_, code: string) =>
            String.fromCodePoint(parseInt(code, 10))
          );
        };

        const strongNumberSet = new Set<number>();
        passageContent.forEach(word => word.strongNumber && strongNumberSet.add(word.strongNumber));
        passageContent.forEach(word => {
          let hebWord = {} as WordProps;
          hebWord.wordId = word.hebId || 0;
          hebWord.chapter = word.chapter || 0;
          hebWord.verse = word.verse || 0;
          hebWord.strongNumber = word.strongNumber || 0;
          hebWord.wlcWord = decodeHtmlEntities(word.wlcWord);
          hebWord.gloss = word.gloss?.trim() || "";
          hebWord.ETCBCgloss = word.ETCBCgloss || "";
          hebWord.morphology = word.morphology?.trim() || "";
          hebWord.showVerseNum = false;
          hebWord.newLine = (word.BSBnewLine) || false;
          hebWord.BSBnewLine = (word.BSBnewLine) || false;
          hebWord.newVerse = false;
          hebWord.BSBstanzaBreak = (word.BSBstanzaBreak) || false;

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

          const stepBibleHebrew = wordInfo?.Hebrew?.trim() || "";
          const hebrewWord = (() => {
            // Use StepBible Hebrew as primary source — it is the lexical/dictionary citation form
            // (without context-specific prefixes/suffixes), appropriate for word information display.
            if (stepBibleHebrew.length > 0) {
              return stepBibleHebrew;
            }
            // Fall back to WLC passage text if no lexical form is available.
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

          // Passage transliteration: transliterates the actual passage text (with prefixes/suffixes)
          // from heb_bible. H3068 is always "a.do.nai" (qere perpetuum).
          // Used by the passage display in transliteration mode — separate from wordInformation.
          const passageTransliteration = (() => {
            if (Math.trunc(word.strongNumber || 0) === 3068) {
              return "a.do.nai";
            }
            const ohbText = decodeHtmlEntities(word.hebUnicode);
            if (ohbText && ohbText.length > 0) {
              const isHebrew = /[\u05D0-\u05EA]/.test(ohbText);
              const result = isHebrew ? transliterateHebrew(ohbText) : ohbText;
              if (result) return result;
            }
            return transliterateHebrew(hebWord.wlcWord) || "";
          })();
          hebWord.passageTransliteration = passageTransliteration;

          // Word information transliteration: uses the lexical/dictionary form (StepBible).
          // H3068 is always "a.do.nai".
          let transliteration = "";
          if (Math.trunc(word.strongNumber || 0) === 3068) {
            transliteration = "a.do.nai";
          } else {
            transliteration = transliterateHebrew(hebrewWord) || wordInfo?.Transliteration?.trim() || "";
          }

          hebWord.wordInformation = {
            hebrew: hebrewWord,
            hebrewSource: stepBibleHebrew ? "lexical" : "passage-fallback",
            transliteration,
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
    genesis: 'Genesis',
    exodus: 'Exodus',
    leviticus: 'Leviticus',
    numbers: 'Numbers',
    deuteronomy: 'Deuteronomy',
    joshua: 'Joshua',
    judges: 'Judges',
    ruth: 'Ruth',
    firstSamuel: '1 Samuel',
    secondSamuel: '2 Samuel',
    firstKings: '1 Kings',
    secondKings: '2 Kings',
    firstChronicles: '1 Chronicles',
    secondChronicles: '2 Chronicles',
    ezra: 'Ezra',
    nehemiah: 'Nehemiah',
    esther: 'Esther',
    job: 'Job',
    psalms: 'Psalm',
    proverbs: 'Proverbs',
    ecclesiastes: 'Ecclesiastes',
    songs: 'Song of Solomon',
    isaiah: 'Isaiah',
    jeremiah: 'Jeremiah',
    lamentations: 'Lamentations',
    ezekiel: 'Ezekiel',
    daniel: 'Daniel',
    hosea: 'Hosea',
    joel: 'Joel',
    amos: 'Amos',
    obadiah: 'Obadiah',
    jonah: 'Jonah',
    micah: 'Micah',
    nahum: 'Nahum',
    habakkuk: 'Habakkuk',
    zephaniah: 'Zephaniah',
    haggai: 'Haggai',
    zechariah: 'Zechariah',
    malachi: 'Malachi'
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
