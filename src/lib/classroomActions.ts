'use server';

import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { and, or, eq, inArray, ilike, like, asc, desc, count, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from '../db';
import { classroom, classroomMember, classroomStudy, study } from '../schema';
import {
  ClassroomDetails,
  ClassroomOverview,
  ClassroomRole,
  FetchStudiesResult,
  MyClassroomsResult,
  StudyMetadata,
  StudySharing,
  StudySharingUpdate,
} from './data';

const PAGINATION_SIZE = 10;
const MAX_NAME_LENGTH = 80;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Viewer = {
  id: string;
  isSysAdmin: boolean;
  isClassAdmin: boolean; // may create classrooms; true for sys_admin too
  emails: string[];
  primaryEmail: string | null;
};

/*
  Roles live in Clerk public metadata as `role`, which only the Clerk backend
  API can write, so a user cannot grant one to themselves:
    - "class_admin": classroom admin; can create classrooms (and becomes an
      admin of each one they create).
    - "sys_admin":   system admin; can do everything a class_admin can, plus
      manage every classroom (name, admins, members) from /admin.
  Per-classroom admin rights are separate: a classroom_member row with
  role 'admin'. Those rows decide who manages a given classroom.
*/
async function getViewer(): Promise<Viewer | null> {
  const user = await currentUser();
  if (!user) return null;
  const emails = user.emailAddresses
    .filter((e) => !e.verification || e.verification.status === 'verified')
    .map((e) => e.emailAddress.toLowerCase());
  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  const isSysAdmin = role === 'sys_admin';
  return {
    id: user.id,
    isSysAdmin,
    isClassAdmin: isSysAdmin || role === 'class_admin',
    emails,
    primaryEmail: user.primaryEmailAddress?.emailAddress.toLowerCase() ?? emails[0] ?? null,
  };
}

function membershipIds(viewer: Viewer, role?: ClassroomRole) {
  return db
    .select({ id: classroomMember.classroomId })
    .from(classroomMember)
    .where(and(
      inArray(classroomMember.email, viewer.emails),
      role ? eq(classroomMember.role, role) : undefined,
    ));
}

// Condition matching every classroom the viewer belongs to (as member or admin).
function memberOf(viewer: Viewer) {
  if (viewer.emails.length === 0) return sql`false`;
  return inArray(classroom.id, membershipIds(viewer));
}

// Classrooms the viewer administers (always true for every classroom for a sys_admin).
function adminOf(viewer: Viewer) {
  if (viewer.isSysAdmin) return sql`true`;
  if (viewer.emails.length === 0) return sql`false`;
  return inArray(classroom.id, membershipIds(viewer, 'admin'));
}

// A classroom the viewer may open: they belong to it, or they are a sys_admin.
async function getAccessibleClassroom(viewer: Viewer, classroomId: string) {
  const [row] = await db
    .select()
    .from(classroom)
    .where(and(eq(classroom.id, classroomId), viewer.isSysAdmin ? undefined : memberOf(viewer)))
    .limit(1);
  return row ?? null;
}

async function getManagedClassroom(viewer: Viewer, classroomId: string) {
  const [row] = await db
    .select()
    .from(classroom)
    .where(and(eq(classroom.id, classroomId), adminOf(viewer)))
    .limit(1);
  return row ?? null;
}

async function canManage(viewer: Viewer, classroomId: string) {
  return !!(await getManagedClassroom(viewer, classroomId));
}

function cleanName(name: string) {
  return name.trim().slice(0, MAX_NAME_LENGTH);
}

export async function fetchMyClassrooms(): Promise<MyClassroomsResult> {
  const viewer = await getViewer();
  if (!viewer) return { isClassAdmin: false, isSysAdmin: false, classrooms: [] };

  const [rows, managed] = await Promise.all([
    db
      .select({ id: classroom.id, name: classroom.name })
      .from(classroom)
      .where(memberOf(viewer))
      .orderBy(asc(classroom.name)),
    db.select({ id: classroom.id }).from(classroom).where(and(memberOf(viewer), adminOf(viewer))),
  ]);
  const managedIds = new Set(managed.map((r) => r.id));

  return {
    isClassAdmin: viewer.isClassAdmin,
    isSysAdmin: viewer.isSysAdmin,
    classrooms: rows.map((r) => ({ id: r.id, name: r.name, canManage: managedIds.has(r.id) })),
  };
}

/*
  Creates a classroom. The creator becomes its first admin unless
  `addSelfAsAdmin` is false, which only a sys_admin may ask for (creating a
  classroom on someone else's behalf from /admin).
*/
export async function createClassroom(
  name: string,
  addSelfAsAdmin = true
): Promise<{ id?: string; message?: string }> {
  const viewer = await getViewer();
  if (!viewer?.isClassAdmin) return { message: 'Only classroom admins can create classrooms.' };
  const cleaned = cleanName(name);
  if (!cleaned) return { message: 'Classroom name cannot be empty.' };
  const addSelf = addSelfAsAdmin || !viewer.isSysAdmin;
  if (addSelf && !viewer.primaryEmail) return { message: 'Your account has no verified email address.' };

  try {
    const id = 'cls_' + nanoid(20);
    const now = new Date().toISOString();
    await db.insert(classroom).values({ id, name: cleaned, owner: viewer.id, createdAt: now });
    if (addSelf) {
      await db.insert(classroomMember).values({
        classroomId: id,
        email: viewer.primaryEmail!,
        role: 'admin',
        invitedBy: viewer.id,
        createdAt: now,
      });
    }
    return { id };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to create classroom.' };
  }
}

export async function renameClassroom(classroomId: string, name: string): Promise<{ message?: string }> {
  const viewer = await getViewer();
  if (!viewer || !(await canManage(viewer, classroomId))) {
    return { message: 'Unauthorized: You cannot rename this classroom.' };
  }
  const cleaned = cleanName(name);
  if (!cleaned) return { message: 'Classroom name cannot be empty.' };
  try {
    await db.update(classroom).set({ name: cleaned }).where(eq(classroom.id, classroomId));
    return {};
  } catch (error) {
    return { message: 'Database Error: Failed to rename classroom.' };
  }
}

export async function deleteClassroom(classroomId: string): Promise<{ message?: string }> {
  const viewer = await getViewer();
  if (!viewer || !(await canManage(viewer, classroomId))) {
    return { message: 'Unauthorized: You cannot delete this classroom.' };
  }
  try {
    // Shared studies themselves are untouched; only the links go.
    await db.delete(classroomStudy).where(eq(classroomStudy.classroomId, classroomId));
    await db.delete(classroomMember).where(eq(classroomMember.classroomId, classroomId));
    await db.delete(classroom).where(eq(classroom.id, classroomId));
    return {};
  } catch (error) {
    return { message: 'Database Error: Failed to delete classroom.' };
  }
}

export async function fetchClassroomDetails(classroomId: string): Promise<ClassroomDetails | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const row = await getAccessibleClassroom(viewer, classroomId);
  if (!row) return null;

  const manage = await canManage(viewer, classroomId);
  const base = { id: row.id, name: row.name, canManage: manage, canManageAdmins: viewer.isSysAdmin };
  if (!manage) return { ...base, members: [] };

  const memberRows = await db
    .select({ email: classroomMember.email, role: classroomMember.role })
    .from(classroomMember)
    .where(eq(classroomMember.classroomId, classroomId))
    .orderBy(desc(classroomMember.role), asc(classroomMember.email)); // admins first

  const emails = memberRows.map((m) => m.email);
  const users = emails.length > 0
    ? (await (await clerkClient()).users.getUserList({ emailAddress: emails, limit: 500 })).data
    : [];
  const byEmail = new Map<string, (typeof users)[number]>();
  users.forEach((u) => u.emailAddresses.forEach((e) => byEmail.set(e.emailAddress.toLowerCase(), u)));

  return {
    ...base,
    members: memberRows.map(({ email, role }) => {
      const u = byEmail.get(email);
      const displayName = u ? [u.firstName, u.lastName].filter(Boolean).join(' ') : undefined;
      return { email, role: role === 'admin' ? 'admin' : 'member', displayName: displayName || undefined, hasAccount: !!u };
    }),
  };
}

/*
  Adds members by email. Addresses are stored lower-cased; the member sees the
  classroom as soon as they sign in with that address. People with no Sela
  account yet are also sent a Clerk sign-up invitation (best effort: a failure
  there does not undo the membership).
*/
export async function inviteClassroomMembers(
  classroomId: string,
  rawEmails: string,
  role: ClassroomRole = 'member'
): Promise<{ added: string[]; invalid: string[]; emailed: string[]; message?: string }> {
  const result = { added: [] as string[], invalid: [] as string[], emailed: [] as string[] };
  const viewer = await getViewer();
  if (!viewer || !(await canManage(viewer, classroomId))) {
    return { ...result, message: 'Unauthorized: You cannot invite members to this classroom.' };
  }
  if (role === 'admin' && !viewer.isSysAdmin) {
    return { ...result, message: 'Unauthorized: Only system admins can add classroom admins.' };
  }

  const candidates = Array.from(new Set(
    rawEmails.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)
  ));
  const valid = candidates.filter((e) => EMAIL_RE.test(e));
  result.invalid = candidates.filter((e) => !EMAIL_RE.test(e));
  if (valid.length === 0) return result;

  try {
    const insert = db
      .insert(classroomMember)
      .values(valid.map((email) => ({
        classroomId,
        email,
        role,
        invitedBy: viewer.id,
        createdAt: new Date().toISOString(),
      })));
    // Inviting an existing member as admin promotes them; inviting as member never demotes.
    const inserted = await (role === 'admin'
      ? insert.onConflictDoUpdate({
          target: [classroomMember.classroomId, classroomMember.email],
          set: { role: 'admin' },
        })
      : insert.onConflictDoNothing()
    ).returning({ email: classroomMember.email });
    result.added = inserted.map((r) => r.email);
  } catch (error) {
    console.error('Database Error:', error);
    return { ...result, message: 'Database Error: Failed to add members.' };
  }

  if (result.added.length > 0) {
    try {
      const client = await clerkClient();
      const existing = (await client.users.getUserList({ emailAddress: result.added, limit: 500 })).data;
      const known = new Set(existing.flatMap((u) => u.emailAddresses.map((e) => e.emailAddress.toLowerCase())));
      for (const email of result.added.filter((e) => !known.has(e))) {
        try {
          await client.invitations.createInvitation({ emailAddress: email, ignoreExisting: true });
          result.emailed.push(email);
        } catch (error) {
          console.error(`Clerk invitation failed for an invitee:`, (error as Error).message);
        }
      }
    } catch (error) {
      console.error('Clerk lookup failed:', (error as Error).message);
    }
  }

  return result;
}

export async function removeClassroomMember(classroomId: string, email: string): Promise<{ message?: string }> {
  const viewer = await getViewer();
  if (!viewer || !(await canManage(viewer, classroomId))) {
    return { message: 'Unauthorized: You cannot remove members from this classroom.' };
  }
  const target = and(eq(classroomMember.classroomId, classroomId), eq(classroomMember.email, email.toLowerCase()));
  try {
    const [row] = await db.select({ role: classroomMember.role }).from(classroomMember).where(target).limit(1);
    if (row?.role === 'admin' && !viewer.isSysAdmin) {
      return { message: 'Only system admins can remove a classroom admin.' };
    }
    await db.delete(classroomMember).where(target);
    return {};
  } catch (error) {
    return { message: 'Database Error: Failed to remove member.' };
  }
}

// Grants or revokes classroom admin for an existing member. sys_admin only.
export async function setClassroomMemberRole(
  classroomId: string,
  email: string,
  role: ClassroomRole
): Promise<{ message?: string }> {
  const viewer = await getViewer();
  if (!viewer?.isSysAdmin) return { message: 'Unauthorized: Only system admins can change classroom admins.' };
  if (role !== 'admin' && role !== 'member') return { message: 'Invalid role.' };
  try {
    const updated = await db
      .update(classroomMember)
      .set({ role })
      .where(and(eq(classroomMember.classroomId, classroomId), eq(classroomMember.email, email.toLowerCase())))
      .returning({ email: classroomMember.email });
    if (updated.length === 0) return { message: 'That person is not a member of this classroom.' };
    return {};
  } catch (error) {
    return { message: 'Database Error: Failed to update role.' };
  }
}

// Every classroom, for the /admin page. sys_admin only.
export async function fetchAllClassrooms(query = ''): Promise<ClassroomOverview[] | null> {
  const viewer = await getViewer();
  if (!viewer?.isSysAdmin) return null;

  const [rooms, members, studies] = await Promise.all([
    db
      .select()
      .from(classroom)
      .where(query ? ilike(classroom.name, `%${query}%`) : undefined)
      .orderBy(asc(classroom.name)),
    db
      .select({ classroomId: classroomMember.classroomId, email: classroomMember.email, role: classroomMember.role })
      .from(classroomMember),
    db
      .select({ classroomId: classroomStudy.classroomId, n: count() })
      .from(classroomStudy)
      .groupBy(classroomStudy.classroomId),
  ]);

  const studyCounts = new Map(studies.map((s) => [s.classroomId, s.n]));
  return rooms.map((r) => {
    const mine = members.filter((m) => m.classroomId === r.id);
    return {
      id: r.id,
      name: r.name,
      createdAt: r.createdAt ?? undefined,
      admins: mine.filter((m) => m.role === 'admin').map((m) => m.email).sort(),
      memberCount: mine.filter((m) => m.role !== 'admin').length,
      studyCount: studyCounts.get(r.id) ?? 0,
    };
  });
}

const SORT_COLUMNS = {
  name: study.name,
  passage: study.passage,
  createdTime: study.createdAt,
  updatedTime: study.updatedAt,
  sharedTime: classroomStudy.createdAt,
} as const;

export async function fetchClassroomStudies(
  classroomId: string,
  query: string,
  currentPage: number,
  sortKey: string,
  sortAsc: boolean
): Promise<FetchStudiesResult> {
  const searchResult: FetchStudiesResult = { records: [], totalPages: 0 };
  const viewer = await getViewer();
  if (!viewer || !(await getAccessibleClassroom(viewer, classroomId))) return searchResult;

  const filter = and(
    eq(classroomStudy.classroomId, classroomId),
    or(
      ilike(study.name, `%${query}%`),
      ilike(study.book, `%${query}%`),
      like(study.passage, `%${query}%`),
    )
  );
  const sortColumn = SORT_COLUMNS[sortKey as keyof typeof SORT_COLUMNS] ?? classroomStudy.createdAt;
  const sortOrder = sortAsc ? asc(sortColumn) : desc(sortColumn);

  const [rows, totalCount] = await Promise.all([
    db
      .select({ study })
      .from(classroomStudy)
      .innerJoin(study, eq(study.id, classroomStudy.studyId))
      .where(filter)
      .orderBy(sortOrder)
      .limit(PAGINATION_SIZE)
      .offset((currentPage - 1) * PAGINATION_SIZE),
    db
      .select({ count: count() })
      .from(classroomStudy)
      .innerJoin(study, eq(study.id, classroomStudy.studyId))
      .where(filter)
      .then((res) => res[0].count),
  ]);

  const ownerIds = Array.from(new Set(rows.map((r) => r.study.owner).filter((o): o is string => !!o)));
  const users = ownerIds.length > 0
    ? (await (await clerkClient()).users.getUserList({ userId: ownerIds, limit: 500 })).data
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  searchResult.records = rows.map(({ study: row }) => {
    const owner = userMap.get(row.owner ?? '');
    return {
      id: row.id,
      name: row.name ?? '',
      owner: row.owner ?? undefined,
      ownerDisplayName: row.owner === viewer.id
        ? 'me'
        : [owner?.firstName, owner?.lastName].filter(Boolean).join(' ') || 'Unknown',
      ownerAvatarUrl: owner?.imageUrl,
      book: row.book ?? '',
      passage: row.passage ?? '',
      public: row.public ?? false,
      lastUpdated: row.updatedAt ? new Date(row.updatedAt) : undefined,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      metadata: row.metadata as StudyMetadata,
      notes: '',
    };
  });
  searchResult.totalPages = Math.ceil(totalCount / PAGINATION_SIZE);
  return searchResult;
}

async function ownedStudyFlags(viewer: Viewer, studyId: string) {
  const [row] = await db
    .select({ owner: study.owner, public: study.public, model: study.model, scriptura: study.scriptura })
    .from(study)
    .where(eq(study.id, studyId))
    .limit(1);
  return row && row.owner === viewer.id ? row : null;
}

export async function fetchStudySharing(studyId: string): Promise<StudySharing | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const flags = await ownedStudyFlags(viewer, studyId);
  if (!flags) return null;

  const [rooms, sharedRows] = await Promise.all([
    db
      .select({ id: classroom.id, name: classroom.name })
      .from(classroom)
      .where(memberOf(viewer))
      .orderBy(asc(classroom.name)),
    db
      .select({ classroomId: classroomStudy.classroomId })
      .from(classroomStudy)
      .where(eq(classroomStudy.studyId, studyId)),
  ]);
  const shared = new Set(sharedRows.map((r) => r.classroomId));
  return {
    isSysAdmin: viewer.isSysAdmin,
    public: !!flags.public,
    model: !!flags.model,
    scriptura: !!flags.scriptura,
    classrooms: rooms.map((r) => ({ id: r.id, name: r.name, canManage: false, shared: shared.has(r.id) })),
  };
}

/*
  Saves the share dialog for one of the viewer's own studies:
    - public: any owner may set it.
    - model / scriptura (Pre-Marked / Scriptura Studies): only a sys_admin;
      ignored for anyone else.
    - classroomIds: the study ends up shared to exactly these among the
      classrooms the viewer belongs to; links to other classrooms are left alone.
*/
export async function updateStudySharing(studyId: string, update: StudySharingUpdate): Promise<{ message?: string }> {
  const viewer = await getViewer();
  if (!viewer || !(await ownedStudyFlags(viewer, studyId))) {
    return { message: 'Unauthorized: You can only share your own studies.' };
  }

  const mine = (await db.select({ id: classroom.id }).from(classroom).where(memberOf(viewer))).map((r) => r.id);
  const wanted = update.classroomIds.filter((id) => mine.includes(id));
  const unwanted = mine.filter((id) => !wanted.includes(id));

  const flags: { public: boolean; model?: boolean; scriptura?: boolean } = { public: !!update.public };
  if (viewer.isSysAdmin) {
    if (typeof update.model === 'boolean') flags.model = update.model;
    if (typeof update.scriptura === 'boolean') flags.scriptura = update.scriptura;
  }

  try {
    await db.update(study).set(flags).where(eq(study.id, studyId));
    if (unwanted.length > 0) {
      await db
        .delete(classroomStudy)
        .where(and(eq(classroomStudy.studyId, studyId), inArray(classroomStudy.classroomId, unwanted)));
    }
    if (wanted.length > 0) {
      await db
        .insert(classroomStudy)
        .values(wanted.map((classroomId) => ({
          classroomId,
          studyId,
          sharedBy: viewer.id,
          createdAt: new Date().toISOString(),
        })))
        .onConflictDoNothing();
    }
    return {};
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to update sharing.' };
  }
}

// True when the current user belongs to a classroom this study is shared to
// (for a sys_admin: when it is shared to any classroom).
export async function canViewStudyViaClassroom(studyId: string): Promise<boolean> {
  const viewer = await getViewer();
  if (!viewer) return false;
  try {
    const [row] = await db
      .select({ id: classroom.id })
      .from(classroomStudy)
      .innerJoin(classroom, eq(classroom.id, classroomStudy.classroomId))
      .where(and(eq(classroomStudy.studyId, studyId), viewer.isSysAdmin ? undefined : memberOf(viewer)))
      .limit(1);
    return !!row;
  } catch (error) {
    // Tables not migrated yet, or a transient error: fall back to no access.
    console.error('Classroom access check failed:', (error as Error).message);
    return false;
  }
}
