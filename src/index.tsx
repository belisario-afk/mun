import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles.css';
import { routes } from './app/routes';
import { AppProviders } from './app/providers/AppProviders';
import { spotifyHandleRedirect } from './audio/spotify/spotify';

async function bootstrap() {
  // Handle Spotify redirect before render to clean the URL and store tokens
  await spotifyHandleRedirect().catch(() => {});
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AppProviders>
        <RouterProvider router={routes} />
      </AppProviders>
    </React.StrictMode>,
  );
}
bootstrap();