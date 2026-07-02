const SPLASH_ID = 'boot-splash';

/** Removes the static HTML splash once React has mounted successfully. */
export function dismissBootSplash(): void {
  document.getElementById(SPLASH_ID)?.remove();
}

/** Updates the splash when JS fails before React can render. */
export function showBootSplashError(message: string): void {
  const splash = document.getElementById(SPLASH_ID);
  if (!splash) return;

  const paragraph = splash.querySelector('p');
  if (paragraph) {
    paragraph.textContent = message;
  }

  if (splash.querySelector('button')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Refresh';
  button.addEventListener('click', () => window.location.reload());
  splash.appendChild(button);
}
