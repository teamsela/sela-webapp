import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { isAnonymousOwner } from "@/lib/anonymous";

type DropdownUserProps = {
  studyId: string;
  owner: string;
};

const DropdownUser = ({ studyId, owner }: DropdownUserProps) => {
  const isTrialStudy = isAnonymousOwner(owner);
  const studyIdParam = studyId.replace(/^rec_/, "");
  const redirectUrl = `/auth/complete?studyId=${studyIdParam}`;

  return (
    <div className="relative flex items-center gap-2">
      <SignedOut>
        {isTrialStudy && (
          <>
            <SignInButton mode="modal" forceRedirectUrl={redirectUrl}>
              <button className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl={redirectUrl}>
              <button className="rounded bg-primary px-3 py-1 text-sm font-semibold text-black hover:opacity-90">
                Create account
              </button>
            </SignUpButton>
          </>
        )}
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
};

export default DropdownUser;
