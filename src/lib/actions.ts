'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getXataClient } from '@/xata';
import { currentUser } from '@clerk/nextjs';
import { StudyRecord } from '@/xata.js';

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

const UpdateStudyName = RenameFormSchema.omit({ id: true });

export async function updateStudyNameWithForm(
  id: string,
  prevState: State,
  formData: FormData,
  ) {

  const validatedFields = UpdateStudyName.safeParse({
    studyName: formData.get('name'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Study.',
    };
  }
  const { studyName } = validatedFields.data;

  console.log("Updating study id: " + id + " with new name (" + studyName + ")");

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.updateOrThrow({ id: id, name: studyName});
  } catch (error) {
    return { message: 'Database Error: Failed to Update Study.' };
  }
  redirect('/dashboard/home');
}

export async function updateStudyName(id: string, studyName: string) {
  "use server";

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.updateOrThrow({ id: id, name: studyName});
  } catch (error) {
    return { message: 'Database Error: Failed to Update Study.' };
  }

  revalidatePath('/');
}

export async function updatePublic(studyId: string, publicAccess: boolean) {
  "use server";

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.updateOrThrow({ id: studyId, public: publicAccess});
  } catch (error) {
    return { message: 'Database Error: Failed to Update Study.' };
  }
  revalidatePath('/');
}

export async function deleteStudy(studyId: string) {
  "use server";

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.deleteOrThrow({ id: studyId });
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Study.' };
  }
  revalidatePath('/');   
}

export async function updateStar(studyId: string, isStarred: boolean) {
  "use server";

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.updateOrThrow({ id: studyId, starred: isStarred });
  } catch (error) {
    return { message: 'Database Error: Failed to Update Study.' };
  }
  revalidatePath('/');   
}

export async function createStudy(passage: string) {
  "use server";
  console.log("Creating a new study (" + passage + ")");

  const user = await currentUser();

  if (user)
  {
    var record : StudyRecord;
    const xataClient = getXataClient();
    try {
      record = await xataClient.db.study.create({ name: "Untitled Study", passage: passage, owner: user.id });
    } catch (error) {
      return { message: 'Database Error: Failed to Create Study.' };
    }
    if (record)
      redirect('/study/' + record.id.replace("rec_", "") + '/edit');
  }
}