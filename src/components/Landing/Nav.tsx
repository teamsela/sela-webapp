'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FaYoutube, FaInstagram, FaFacebookF, FaLinkedinIn } from "react-icons/fa";
import { HiMenu, HiX } from "react-icons/hi";

const navLinks = [
  { label: "Home", href: "https://www.biblepoetry.org", external: true, active: false },
  { label: "Web App", href: "/", external: false, active: true },
  { label: "Content", href: "https://www.biblepoetry.org/content", external: true, active: false },
  { label: "Our Story", href: "https://www.biblepoetry.org/story", external: true, active: false },
  { label: "Donate", href: "https://www.biblepoetry.org/donate", external: true, active: false },
  { label: "Contact", href: "https://www.biblepoetry.org/contact", external: true, active: false },
];

const socialLinks = [
  { Icon: FaYoutube, href: "https://www.youtube.com/@Biblepoetry", label: "YouTube" },
  { Icon: FaInstagram, href: "https://instagram.com/explorebiblepoetry", label: "Instagram" },
  { Icon: FaFacebookF, href: "https://facebook.com/biblepoetry", label: "Facebook" },
  { Icon: FaLinkedinIn, href: "https://www.linkedin.com/company/biblepoetry-association", label: "LinkedIn" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stroke font-quicksand">
      <div className="w-full box-border px-[4vw] py-[1.4vw]">
        <div className="flex w-full items-center">
          <Link href="/" className="flex items-center lg:mr-[2.4vw]">
            <Image
              src="/images/landing/logo-no-background.webp"
              alt="Bible Poetry"
              width={342}
              height={100}
              priority
              style={{ width: "342.44px", height: "99.99px" }}
            />
          </Link>

          <nav className="ml-auto hidden items-center lg:flex lg:pl-[2.4vw]">
            {navLinks.map(({ label, href, external, active }, idx) => {
              const linkClass = `text-lg tracking-wide text-black-2 hover:text-[#FFBF00] ${active ? "underline underline-offset-[6px]" : ""} ${idx !== 0 ? "ml-[1.8vw]" : ""}`;
              return external ? (
                <a key={label} href={href} className={linkClass}>
                  {label}
                </a>
              ) : (
                <Link key={label} href={href} className={linkClass}>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center lg:flex lg:ml-[2.4vw]">
            {socialLinks.map(({ Icon, href, label }, idx) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noreferrer noopener"
                className={`text-black-2 hover:text-[#FFBF00] ${idx !== 0 ? "ml-[1.8vw]" : ""}`}
              >
                <Icon className="h-[25px] w-[25px]" />
              </a>
            ))}
          </div>

          <button
            className="ml-auto lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-stroke bg-white lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4">
            {navLinks.map(({ label, href, external, active }) => {
              const mobileClass = `text-base font-medium uppercase tracking-wide ${active ? "underline underline-offset-[6px]" : ""}`;
              return external ? (
                <a key={label} href={href} className={mobileClass}>
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  href={href}
                  className={mobileClass}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
            <div className="flex items-center gap-5 pt-2">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
