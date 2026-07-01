import type { ReactNode } from 'react';
import './ScreenHeader.css';

interface ScreenHeaderProps {
  title: string;
  actions?: ReactNode;
}

/** Top app bar used on main tab screens (WhatsApp-style). */
export function ScreenHeader({ title, actions }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <h1 className="screen-header__title">{title}</h1>
      {actions && <div className="screen-header__actions">{actions}</div>}
    </header>
  );
}
