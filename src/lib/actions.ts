'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getXataClient } from '@/xata';


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

export async function updateStudyName(
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