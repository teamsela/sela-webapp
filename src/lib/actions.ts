'use server';

import { z } from 'zod';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Prisma, StepbibleTbesh } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { currentUser, clerkClient } from '@clerk/nextjs';

import { parsePassageInfo, PassageInfo } from './utils';
import { StudyData, PassageData, PassageStaticData, StudyProps, PassageProps, StudyMetadata, WordProps, StropheData, HebWord, StanzaData, FetchStudiesResult } from './data';

const formatStrongNumberForDisplay = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return normalized.replace(/([0-9])([A-Z]+)$/, '$1');
};

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

const buildChapterRangeFilter = (
  passageInfo: PassageInfo
): Prisma.HebBibleGenesisAndPsalmsWhereInput => {
  if (passageInfo.startChapter === passageInfo.endChapter) {
    return {
      chapter: passageInfo.startChapter,
      verse: {
        gte: passageInfo.startVerse,
        lte: passageInfo.endVerse,
      },
    };
  }

  const middleChapterCondition: Prisma.HebBibleGenesisAndPsalmsWhereInput[] =
    passageInfo.endChapter - passageInfo.startChapter > 1
      ? [
          {
            chapter: {
              gt: passageInfo.startChapter,
              lt: passageInfo.endChapter,
            },
          },
        ]
      : [];

  return {
    OR: [
      {
        chapter: passageInfo.startChapter,
        verse: { gte: passageInfo.startVerse },
      },
      {
        chapter: passageInfo.endChapter,
        verse: { lte: passageInfo.endVerse },
      },
      ...middleChapterCondition,
    ],
  };
};

const createPassageRangeFilter = (passageInfo: PassageInfo) => {
  const bookValue = passageInfo.book ?? "psalms";
  return {
    AND: [{ book: bookValue }, buildChapterRangeFilter(passageInfo)],
  };
};

export async function fetchStudyById(studyId: string) {

  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  //noStore();
  try {
      const study = await prisma.study.findUnique({ where: { id: studyId } });

      let result : StudyData = {
          id: studyId,
          name: study?.name || "",
          owner: study?.owner || "",
          book: study?.book || "", 
          passage: study?.passage || "",
          public: study?.public || false,
          model: study?.model || false,
          metadata: study?.metadata || {},
          notes: study?.notes || ""
      };

      return result;
  } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch study record.');        
  }
}

export async function updateStudyName(id: string, studyName: string) {

  try {
    await prisma.study.update({ where: { id }, data: { name: studyName } });
  } catch (error) {
    return { message: 'Database Error: Failed to update study name.' };
  }
}

export async function updateStudyNotes(id: string, content: string) {
  
  try {
    await prisma.study.update({ where: { id }, data: { notes: content } });
  } catch (error) {
    return { message: "Database Error: Failed to update study notes"}
  }
}

export async function updatePublic(studyId: string, publicAccess: boolean) {
  "use server";

  try {
    await prisma.study.update({ where: { id: studyId }, data: { public: publicAccess } });
  } catch (error) {
    return { message: 'Database Error: Failed to update study public access.' };
  }
}

export async function updateStar(studyId: string, isStarred: boolean) {

  try {
    await prisma.study.update({ where: { id: studyId }, data: { starred: isStarred } });
  } catch (error) {
    return { message: 'Database Error: Failed to update study star.' };
  }
}

export async function updateMetadataInDb(studyId: string, studyMetadata: StudyMetadata) {
  "use server";

  try {
    const metadataJson = JSON.stringify(studyMetadata);
    if (metadataJson) {
      await prisma.study.update({ where: { id: studyId }, data: { metadata: studyMetadata } });
    }
  } catch (error) {
    return { message: 'Database Error: Failed to update study star.' };
  }
}


export async function deleteStudy(studyId: string) {

  try {
    await prisma.study.delete({ where: { id: studyId } });
  } catch (error) {
    return { message: 'Database Error: Failed to delete study.' };
  }
}

export async function createStudy(passage: string, book: string) {

  const user = await currentUser();

  if (user)
  {
    let record;
    try {
      record = await prisma.study.create({
        data: { name: "Untitled Study", passage: passage, book: book, owner: user.id },
      });
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
    let record;
    try {
      record = await prisma.study.create({
        data: {
          name: newName,
          book: originalStudy.book,
          passage: originalStudy.passage,
          owner: user.id,
          metadata: originalStudy.metadata,
        },
      });
    } catch (error) {
      return { message: 'Database Error: Failed to Clone Study.' };
    }
    if (record)
      redirect('/study/' + record.id.replace("rec_", "") + '/edit');
  }
}

const PAGINATION_SIZE = 10;

const getStudyOrderBy = (
  sortKey: string,
  sortAsc: boolean
): Prisma.StudyOrderByWithRelationInput => {
  const allowedKeys = new Set(["name", "passage", "createdAt", "updatedAt"]);
  const normalizedKey = allowedKeys.has(sortKey) ? sortKey : "updatedAt";
  return { [normalizedKey]: sortAsc ? "asc" : "desc" } as Prisma.StudyOrderByWithRelationInput;
};

export async function fetchPublicStudies(query: string, currentPage: number, sortKey: any, sortAsc: boolean) {
  const searchResult : FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();

  const filter: Prisma.StudyWhereInput = {
    model: false,
    public: true,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { book: { contains: query, mode: "insensitive" } },
      { passage: { contains: query } },
    ],
  };
  const search = await prisma.study.findMany({
    where: filter,
    orderBy: getStudyOrderBy(sortKey, sortAsc),
    skip: (currentPage - 1) * PAGINATION_SIZE,
    take: PAGINATION_SIZE,
  });
  const totalCount = await prisma.study.count({ where: filter });

  // extract the ids from owner column and add them into a set
  const uniqueIds = new Set<string>();
  search.forEach((study) => {
    uniqueIds.add(study?.owner ? study.owner : "");
  });

  // fetch ids and sessions of owners from clerk
  const users = await clerkClient.users.getUserList( { userId: Array.from( uniqueIds ) } );

  let mp = new Map();
  for (let i = 0; i < users.length; i++) {
    mp.set(users[i].id, users[i]);
  }

  const thisUser = await currentUser();

  search.map((studyRecord) => {   
    searchResult.records.push({
      id: studyRecord.id, name: studyRecord.name, owner: user?.id, 
      ownerDisplayName: thisUser?.id === studyRecord.owner ? "me" : mp.get(studyRecord.owner)?.firstName + " " + mp.get(studyRecord.owner)?.lastName,  
      ownerAvatarUrl: mp.get(studyRecord.owner)?.imageUrl,
      passage: studyRecord.passage, book: studyRecord.book!,
      public: studyRecord.public || false, starred: studyRecord.starred || false,
      lastUpdated: studyRecord.updatedAt, 
      createdAt: studyRecord.createdAt, 
      metadata: studyRecord.metadata,
      notes: studyRecord.notes || "" })
  });
  searchResult.totalPages = Math.ceil(totalCount / PAGINATION_SIZE);
  return searchResult;
}

export async function fetchRecentStudies(query: string, currentPage: number, sortKey: any, sortAsc: boolean) {
  let searchResult : FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();

  // filter by study name, book, and passage
  // book+passage is displayed for the passage column, so we need to filter by book here
  // update the filter if UI changes, same for fetchPublicStudies and fetchModelStudies
  const filter: Prisma.StudyWhereInput = {
    owner: user?.id,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { book: { contains: query, mode: "insensitive" } },
      { passage: { contains: query } },
    ],
  };
  const search = await prisma.study.findMany({
    where: filter,
    orderBy: getStudyOrderBy(sortKey, sortAsc),
    skip: (currentPage - 1) * PAGINATION_SIZE,
    take: PAGINATION_SIZE,
  });
  const totalCount = await prisma.study.count({ where: filter });

  search.map((studyRecord) => {   
    searchResult.records.push({
      id: studyRecord.id, name: studyRecord.name, owner: user?.id, book: studyRecord.book || "", passage: studyRecord.passage, 
      public: studyRecord.public || false, starred: studyRecord.starred || false,
      lastUpdated: studyRecord.updatedAt, 
      createdAt: studyRecord.createdAt, 
      metadata: studyRecord.metadata,
      notes: studyRecord.notes || "" })
  });
  searchResult.totalPages = Math.ceil(totalCount / PAGINATION_SIZE);
  return searchResult;
}

export async function fetchModelStudies(query: string, currentPage: number, sortKey: any, sortAsc: boolean) {
  const PAGINATION_SIZE = 10;
  
  let searchResult : FetchStudiesResult = { records: [], totalPages: 1 };

  const user = await currentUser();

  const filter: Prisma.StudyWhereInput = {
    model: true,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { book: { contains: query, mode: "insensitive" } },
      { passage: { contains: query } },
    ],
  };

  const search = await prisma.study.findMany({
    where: filter,
    orderBy: getStudyOrderBy(sortKey, sortAsc),
    skip: (currentPage - 1) * PAGINATION_SIZE,
    take: PAGINATION_SIZE,
  });

  const totalCount = await prisma.study.count({ where: filter });
  
  search.map((studyRecord) => {   
    searchResult.records.push({
      id: studyRecord.id, name: studyRecord.name, owner: user?.id, book: studyRecord.book || "", passage: studyRecord.passage, 
      public: studyRecord.public || false, starred: studyRecord.starred || false,
      lastUpdated: studyRecord.updatedAt, metadata: studyRecord.metadata, notes: studyRecord.notes || "" })
  });
  searchResult.totalPages = Math.ceil(totalCount / PAGINATION_SIZE);
  return searchResult;
}

export async function fetchPassageData(studyId: string) {
  try {
    const study = await prisma.study.findUnique({ where: { id: studyId } });

    let studyData : StudyData = {
      id: studyId,
      name: study?.name || "",
      owner: study?.owner || "",
      book: study?.book || "",
      passage: study?.passage || "",
      public: study?.public || false,
      model: study?.model || false,
      metadata: study?.metadata || {},
      notes: study?.notes || ""
    };

    let passageData : PassageStaticData = { study: studyData, bibleData: [] as WordProps[] };

    if (study)
    {
      const passageInfo = parsePassageInfo(study.passage, study.book||'psalms');
      console.log(passageInfo)
      // fetch all words by start/end chapter and verse
      if (passageInfo instanceof Error === false)
      {
        const passageFilter = createPassageRangeFilter(passageInfo);
        const passageContent = await prisma.hebBibleGenesisAndPsalms.findMany({
          where: passageFilter,
          orderBy: { hebId: "asc" },
          include: {
            motifLink: {
              select: {
                categories: true,
                relatedStrongCodes: true,
                lemmaLink: { select: { lemma: true } },
              },
            },
          },
        });

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

        const stepBibleSelect = STEP_BIBLE_SELECT_COLUMNS.reduce(
          (acc, columnName) => ({ ...acc, [columnName]: true }),
          {} as Record<StepBibleColumn, true>
        );

        type StepBibleWordInfo = Pick<StepbibleTbesh, StepBibleColumn> & {
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
          record: Pick<StepbibleTbesh, StepBibleColumn>,
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

          const filter =
            matchType === "equals"
              ? { [column]: normalizedCode }
              : { [column]: { $startsWith: normalizedCode } };

          const whereClause =
            matchType === "equals"
              ? { [column]: normalizedCode }
              : { [column]: { startsWith: normalizedCode } };

          if (matchType === "startsWith") {
            const records = await prisma.stepbibleTbesh.findMany({
              where: whereClause,
              select: stepBibleSelect,
            });

            for (const record of records) {
              const columnValue = record[column]?.trim();

              if (baseStrong !== undefined && getStrongNumericValue(columnValue) !== baseStrong) {
                continue;
              }

              return createStepBibleWordInfo(record, normalizedCode, baseStrong);
            }

            return undefined;
          }

          const record = await prisma.stepbibleTbesh.findFirst({
            where: whereClause,
            select: stepBibleSelect,
          });

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

          if (word.motifLink) {
            const relatedStrongNums = word.motifLink?.relatedStrongCodes?.map(code => parseInt(code))
                                        .filter(code => strongNumberSet.has(code) && code != word.strongNumber);
            hebWord.motifData = {
              lemma: word.motifLink.lemmaLink?.lemma || "",
              relatedStrongNums: relatedStrongNums || [],
              categories: word.motifLink?.categories || []
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
  
  try {
    const study = await prisma.study.findUnique({ where: { id: studyId } });

    let passageData = { studyId: studyId, stanzas: [] } as PassageData;

    if (study)
    {
      const book = (study.book ?? 'psalms').toLowerCase();
      const passageInfo = parsePassageInfo(study.passage, book);

      // fetch all words by start/end chapter and verse
      if (passageInfo instanceof Error === false)
      {
        const wordStyling = await prisma.styling.findMany({
          where: { studyId: study.id },
          select: {
            hebId: true,
            colorFill: true,
            borderColor: true,
            textColor: true,
            numIndent: true,
            lineBreak: true,
            stropheDiv: true,
            stanzaDiv: true,
          },
          orderBy: { hebId: "asc" },
        });
        const wordStylingMap = new Map();
        wordStyling.forEach((obj) => {
          wordStylingMap.set(obj.hebId, { colorFill: obj.colorFill, borderColor: obj.borderColor, textColor: obj.textColor, numIndent: obj.numIndent, lineBreak: obj.lineBreak, stropheDiv: obj.stropheDiv, stanzaDiv: obj.stanzaDiv });
        });
        
        const stanzaStyling = await prisma.stanzaStyling.findMany({
          where: { studyId: study.id },
          select: { stanzaId: true, expanded: true },
          orderBy: { stanzaId: "asc" },
        });
        const stanzaStylingMap = new Map();
        stanzaStyling.forEach((obj) => {
          stanzaStylingMap.set(obj.stanzaId, { expanded: obj.expanded })
        })

        const stropheStyling = await prisma.stropheStyling.findMany({
          where: { studyId: study.id },
          select: {
            stropheId: true,
            expanded: true,
            borderColor: true,
            colorFill: true,
          },
          orderBy: { stropheId: "asc" },
        });
        const stropheStylingMap = new Map();
        stropheStyling.forEach((obj) => {
          stropheStylingMap.set(obj.stropheId, { borderColor: obj.borderColor, colorFill: obj.colorFill, expanded: obj.expanded });
        });

        const passageFilter = createPassageRangeFilter(passageInfo);
        const passageContent = await prisma.hebBibleGenesisAndPsalms.findMany({
          where: passageFilter,
          orderBy: { hebId: "asc" },
          include: {
            motifLink: {
              select: {
                categories: true,
                relatedStrongCodes: true,
                lemmaLink: { select: { lemma: true } },
              },
            },
          },
        });
        
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
          if (word.motifLink?.lemmaLink) {
            hebWord.lemma = word.motifLink.lemmaLink.lemma || ""
          }
          const relatedStrongNums = word.motifLink?.relatedStrongCodes?.map(code => parseInt(code))
                                      .filter(code => strongNumberSet.has(code) && code != word.strongNumber);
          if (relatedStrongNums && relatedStrongNums.length > 0) {
            hebWord.relatedStrongNums = relatedStrongNums;
          }
          hebWord.categories = word.motifLink?.categories || [];

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
  try {
    const study = await prisma.study.findUnique({ where: { id: studyId } });
    return study?.owner ?? null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch study owner.');
  }
}
