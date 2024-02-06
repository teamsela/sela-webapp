import { SignUp } from '@clerk/nextjs';

export default function Page() {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <img src="/images/digging-for-gems.png" width="40%" style={{marginRight: 100}} />
        <div className="flex w-full flex-1 flex-col justify-center gap-2 px-8 sm:max-w-md">
          <SignUp />
        </div>
      </div>
    );
}