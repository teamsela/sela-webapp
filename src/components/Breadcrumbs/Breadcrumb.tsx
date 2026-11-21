import Link from "next/link";
interface BreadcrumbProps {
  pageName: string;
}
const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-[28px] font-bold leading-9 text-black dark:text-white sm:text-title-md2 sm:font-semibold">
        {pageName}
      </h2>

      <nav className="hidden sm:block">
        <ol className="flex items-center gap-2">
          <li>
            <Link className="font-medium" href="/">
              Dashboard /
            </Link>
          </li>
          <li className="font-medium text-primary">{pageName}</li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
