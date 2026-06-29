import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import medTrackIcon from '@/assets/MedTrack-Ai-icon.png';
import authReferenceBg from '@/assets/auth-reference-bg.png';
import authLeftPanelArt from '@/assets/auth-left-panel-art.png';

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
};

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps) {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-surface bg-cover bg-center px-4 py-6 sm:px-6 lg:flex lg:h-screen lg:min-h-0 lg:items-center lg:justify-center lg:p-0"
      style={{ backgroundImage: `url(${authReferenceBg})` }}
    >
      <section className="relative z-10 mx-auto grid w-full max-w-[1128px] overflow-hidden rounded-[12px] border border-border bg-surface shadow-[0_18px_55px_rgba(15,23,42,0.10)] lg:mx-0 lg:min-h-[704px] lg:grid-cols-[524px_1fr]">
        <aside className="border-b border-border bg-[#EFF6FF]/95 px-6 py-5 sm:px-8 lg:flex lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:px-[44px] lg:py-[46px]">
          <div>
            <Link to="/" className="inline-flex items-center gap-4">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[10px] border border-primary/10 bg-white p-1.5 shadow-soft">
                <img src={medTrackIcon} alt="MedTrack AI" className="h-full w-full object-contain" />
              </span>
              <span className="text-lg font-semibold text-textPrimary">MedTrack AI</span>
            </Link>

            <div className="mt-10 max-w-[430px] lg:mt-[76px]">
              <p className="text-base font-semibold text-primary lg:text-[16px]">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-textPrimary sm:text-4xl lg:text-[31px] lg:leading-[1.22]">
                Simple medicine tracking,
                <br />
                ready when you are.
              </h1>
              <p className="mt-5 text-base leading-7 text-textSecondary lg:text-[16px]">
                Keep your medicine list, expiry dates, and AI assistant
                <br className="hidden lg:block" />
                in one clear workspace.
              </p>
            </div>

            <img
              src={authLeftPanelArt}
              alt=""
              aria-hidden="true"
              className="mt-6 hidden w-full max-w-[438px] select-none lg:block"
              draggable={false}
            />
          </div>

          <div className="mt-8 hidden max-w-[420px] text-sm text-textSecondary lg:block">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary/10 text-secondary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-base font-semibold text-textPrimary">Private by default</p>
            <p className="mt-1 text-[15px] leading-6">Your account keeps health reminders organized and easy to revisit.</p>
          </div>
        </aside>

        <div className="flex items-center justify-center px-6 py-8 sm:px-10 lg:px-0 lg:py-0">
          <div className="w-full max-w-[454px]">
            <div className="mb-9">
              <p className="text-sm font-medium text-primary lg:hidden">{eyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-textPrimary sm:text-3xl lg:mt-0 lg:text-[27px]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-textSecondary sm:text-base lg:text-[16px]">{description}</p>
            </div>

            {children}

            <p className="mt-7 text-center text-sm text-textSecondary lg:text-[16px]">
              {footerText}{' '}
              <Link to={footerLinkTo} className="font-semibold text-primary hover:underline">
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
