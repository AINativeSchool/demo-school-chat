import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/** Main app shell with bottom navigation. */
export function AppLayout() {
  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
