import { MdInfoOutline } from "react-icons/md";

const InfoButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    aria-label={label}
    aria-haspopup="dialog"
    className="ClickBlock inline-flex shrink-0 items-center justify-center text-primary transition hover:opacity-80 focus-visible:outline-primary"
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
  >
    <MdInfoOutline size="18px" />
  </button>
);

export default InfoButton;
