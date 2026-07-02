import { APP_VERSION, LABS_URL } from '../config/appMeta';

/** Site footer with Labs attribution and published app version. */
export function AppFooter() {
  return (
    <footer className="app-footer">
      <p className="app-footer__labs">
        An{' '}
        <a href={LABS_URL} target="_blank" rel="noopener noreferrer">
          AI Native School Labs
        </a>{' '}
        project
      </p>
      <p className="app-footer__version">v{APP_VERSION}</p>
    </footer>
  );
}
