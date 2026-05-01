import { FaYoutube, FaInstagram, FaFacebookF, FaLinkedinIn } from "react-icons/fa";

const socialLinks = [
  { Icon: FaYoutube, href: "https://www.youtube.com/@Biblepoetry", label: "YouTube" },
  { Icon: FaInstagram, href: "https://instagram.com/explorebiblepoetry", label: "Instagram" },
  { Icon: FaFacebookF, href: "https://facebook.com/biblepoetry", label: "Facebook" },
  { Icon: FaLinkedinIn, href: "https://www.linkedin.com/company/biblepoetry-association", label: "LinkedIn" },
];

export default function FooterBar() {
  return (
    <footer className="border-t border-stroke bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
        <p className="text-sm text-body">© {new Date().getFullYear()} Bible Poetry</p>
        <div className="flex items-center gap-5">
          {socialLinks.map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target="_blank"
              rel="noreferrer noopener"
              className="text-body hover:text-[#FFBF00]"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
