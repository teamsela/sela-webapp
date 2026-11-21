import CopyrightLinks from "./CopyrightLinks";

export const FooterComponent = ({ className }: { className?: string }) => (
  <footer className={className ?? "px-5 py-2 text-sm text-body"}>
    <CopyrightLinks />
  </footer>
);

export default FooterComponent;
