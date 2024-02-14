import { StudyRecord, getXataClient } from '@/xata';
import { currentUser } from '@clerk/nextjs';
import { revalidatePath } from 'next/cache';
import { redirect } from "next/navigation"

const xataClient = getXataClient();

async function createStudy(name: string, passage: string) {
  "use server";

  try {
    const record = await xataClient.db.study.create({ name: name, passage: passage});
    redirect('/studies/' + record.id + '/edit');
} catch (error) {
    return { message: 'Database Error: Failed to Create Study.' };
  }
}

const StudyForm = () => {
    return (
        <>
          {/* <!-- Sign Up Form --> */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Select a passage to study
              </h3>
            </div>
            <form action="#">
              <div className="p-6.5">
                <div className="mb-4.5">
                  <input
                    type="text"
                    placeholder="Psalm 3:1-4"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <button className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
                  Create
                </button>
              </div>
            </form>
          </div>
        </>
    );
  };
  
  export default StudyForm;
  