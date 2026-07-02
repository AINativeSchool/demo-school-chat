import type { ReactNode } from 'react';
import { AppFooter } from './AppFooter';
import { AppShowcase } from './AppShowcase';
import { AuthLandingInfo } from './AuthLandingInfo';

interface AuthPageShellProps {
  children: ReactNode;
  /** Hide the mobile register CTA when already on the register page. */
  showRegisterLink?: boolean;
}

/** Shared auth page layout: info + form on top, screen previews at the bottom. */
export function AuthPageShell({ children, showRegisterLink = true }: AuthPageShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-page-top">
        <AuthLandingInfo showRegisterLink={showRegisterLink} />
        <div className="auth-card-wrap">{children}</div>
      </div>
      <AppShowcase />
      <AppFooter />
    </div>
  );
}
