import { useId, useRef } from "react";
import { IconX } from "@tabler/icons-react";
import InfoButton from "../common/InfoButton";

const PersonGenderNumberInfo = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <InfoButton
        label="About Person, Gender, Number"
        onClick={() => dialogRef.current?.showModal()}
      />
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="ClickBlock max-h-[85vh] w-[calc(100%_-_2rem)] max-w-xl rounded-2xl bg-white p-0 text-gray-700 shadow-2xl backdrop:bg-black/60 dark:bg-gray-900 dark:text-gray-300"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="relative p-6">
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 focus-visible:outline-primary dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
          <h2 id={titleId} className="pr-10 text-lg font-bold">
            Person, Gender, Number
          </h2>
          <h3 className="mt-4 font-semibold">Overview</h3>
          <p className="mt-2 text-sm leading-relaxed">
            This tool highlights every word carrying grammatical person (verb conjugation, imperative,
            pronominal suffix, or independent pronoun) to surface person and number shifts,
            a structural device in Hebrew poetry that often marks strophe and stanza boundaries.
            Common patterns include address shifting between speaker and community
            (&quot;I will praise&quot; to &quot;let us praise&quot;), and address to YHWH shifting
            from direct (&quot;you&quot;) to descriptive (&quot;he&quot;), a classic hymnic pivot.
          </p>
          <h3 className="mt-4 font-semibold">Legend</h3>
          <div className="mt-2 space-y-1 text-sm leading-relaxed">
            <p>Each code is Person, Gender, Number.</p>
            <p>Person: 1st (speaker), 2nd (addressee), 3rd (other)</p>
            <p>Gender: m (masculine), f (feminine), c (common, unmarked for gender)</p>
            <p>Number: s (singular), p (plural)</p>
            <p>
              For example, 2ms means 2nd person, masculine, singular:
              &quot;you,&quot; addressing one person.
            </p>
          </div>
          <h3 className="mt-4 font-semibold">Disclaimer</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed">
            <li>
              Imperatives are included under 2nd person, since commands always address
              &quot;you&quot; (e.g., Imp-ms appears under 2ms).
            </li>
            <li>
              3cp (3rd person common plural, used in perfect verbs) is grouped with 3mp
              and may include feminine subjects.
            </li>
            <li>
              When a verb or imperative also carries a pronominal object suffix
              (e.g., &quot;he will bless us,&quot; &quot;praise him&quot;), the smart highlighter
              colors the word by subject only, to reflect who is acting rather than
              who is receiving the action.
            </li>
          </ul>
        </div>
      </dialog>
    </>
  );
};

export default PersonGenderNumberInfo;
