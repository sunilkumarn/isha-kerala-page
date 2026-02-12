import Link from "next/link";
import type { ReactNode } from "react";

function SocialIcon({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={title}
      title={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-[#1F2A63]"
    >
      {children}
    </a>
  );
}

export default function PublicFooter() {
  return (
    <footer className="bg-[#1F2A63] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="text-base font-semibold">Isha Kerala</div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Sadhguru has often said that “society is overripe for a spiritual process.” His fundamental vision is to offer the science of inner wellbeing to every human being – a science that helps a person realize the ultimate potential within. From this vision stem a multitude of projects, programs, and methods, all towards the same aim: to raise every human being to the peak of their potential, so that they are exuberant, all-inclusive, and in harmony within themselves and the world.
            </p>
          </div>

          <nav aria-label="Footer quick links" className="md:justify-self-center">
            <div className="text-sm font-semibold text-white/90">Quick Links</div>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li>
                <a
                  className="transition hover:text-white"
                  href="https://isha.sadhguru.org/us/en/sadhguru/about-sadhguru"
                  target="_blank"
                  rel="noreferrer"
                >
                  About Sadhguru
                </a>
              </li>
              <li>
                <a
                  className="transition hover:text-white"
                  href="https://isha.sadhguru.org/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Isha Foundation
                </a>
              </li>
              <li>
                <a
                  className="transition hover:text-white"
                  href="https://consciousplanet.org/en"
                  target="_blank"
                  rel="noreferrer"
                >
                  Isha Outreach
                </a>
              </li>
              <li>
                <a
                  className="transition hover:text-white"
                  href="https://isha.sadhguru.org/us/en/wisdom"
                  target="_blank"
                  rel="noreferrer"
                >
                  Sadhguru Wisdom
                </a>
              </li>
            </ul>
          </nav>

          <div className="md:justify-self-end">
            <div className="text-sm font-semibold text-white/90">Follow Us</div>
            <div className="mt-5 flex items-center gap-3">
              <SocialIcon title="Instagram" href="https://www.instagram.com/ishafoundation/">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M17.5 6.5h.01" />
                </svg>
              </SocialIcon>

              <SocialIcon title="Facebook" href="https://www.facebook.com/ishafoundation/">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5"
                  fill="currentColor"
                >
                  <path d="M13.5 22v-8h2.7l.4-3H13.5V9.1c0-.9.3-1.6 1.7-1.6H16.7V4.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.5v3h2.5v8h3.5z" />
                </svg>
              </SocialIcon>

              <SocialIcon title="YouTube" href="https://www.youtube.com/@sadhguru">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5"
                  fill="currentColor"
                >
                  <path d="M21.6 7.1a3 3 0 0 0-2.1-2.1C17.7 4.5 12 4.5 12 4.5s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.1 31.7 31.7 0 0 0 2 12a31.7 31.7 0 0 0 .4 4.9 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.7 31.7 0 0 0 22 12a31.7 31.7 0 0 0-.4-4.9ZM10 15.5v-7l6 3.5-6 3.5Z" />
                </svg>
              </SocialIcon>

              <SocialIcon title="Website" href="https://isha.sadhguru.org/">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18" />
                  <path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9Z" />
                </svg>
              </SocialIcon>
            </div>

            <div className="mt-6 text-sm text-white/70">
              <Link href="/programs" className="transition hover:text-white">
                Browse Programs
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Isha Foundation. All rights reserved.
        </div>
      </div>
    </footer>
  );
}


