
import { IconPlus } from '@tabler/icons-react';
import Link from "next/link";

const CreateStudy = () => {

  return (
    <Link href=""
      className="inline-flex justify-left gap-3 rounded-full mx-8 bg-primary py-4 px-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
    >
    <span><IconPlus/></span>
    New Study
    </Link>
  );
}

export default CreateStudy;

