import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import medTrackIcon from '@/assets/MedTrack-Ai-icon.png';

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
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[12px] border border-border bg-surface shadow-soft lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="border-b border-border bg-primary-light px-6 py-5 sm:px-8 lg:flex lg:min-h-[620px] lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-primary/10 bg-white p-1.5 shadow-soft">
                  <img src={medTrackIcon} alt="MedTrack AI" className="h-full w-full object-contain" />
                </span>
                <span className="text-base font-semibold text-textPrimary">MedTrack AI</span>
              </Link>

              <div className="mt-16 hidden max-w-sm lg:block">
                <p className="text-sm font-medium text-primary">{eyebrow}</p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight text-textPrimary sm:text-4xl">
                  Simple medicine tracking, ready when you are.
                </h1>
                <p className="mt-4 text-base leading-7 text-textSecondary">
                  Keep your medicine list, expiry dates, and AI assistant in one clear workspace.
                </p>
              </div>
            </div>

            <div className="mt-8 hidden text-sm text-textSecondary lg:block">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary/10 text-secondary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="font-medium text-textPrimary">Private by default</p>
              <p className="mt-1 leading-6">Your account keeps health reminders organized and easy to revisit.</p>
            </div>
          </aside>

          <div className="flex items-center justify-center px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
            <div className="w-full max-w-[420px]">
              <div className="mb-8">
                <p className="text-sm font-medium text-primary lg:hidden">{eyebrow}</p>
                <h2 className="mt-2 text-2xl font-semibold text-textPrimary sm:text-3xl">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-textSecondary sm:text-base">{description}</p>
              </div>

              {children}

              <p className="mt-6 text-center text-sm text-textSecondary">
                {footerText}{' '}
                <Link to={footerLinkTo} className="font-medium text-primary hover:underline">
                  {footerLinkText}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
