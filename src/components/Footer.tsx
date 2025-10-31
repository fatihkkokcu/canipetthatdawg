import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-50 pt-32" role="contentinfo">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="pb-8 text-xs text-gray-600 space-y-2 text-center">
          <li className="text-sm">
            © {new Date().getFullYear()} CanIPetThatDawg. All rights reserved.
          </li>
          <li className="flex items-center justify-center gap-3">
            <span className="sr-only">Tenor</span>
            <a
              href="https://tenor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
              aria-label="Tenor"
            >
              <img
                src="/tenor.svg"
                alt="Tenor logo"
                className="h-4 w-auto opacity-80 hover:opacity-100 transition"
                loading="lazy"
              />
            </a>
            <span aria-hidden className="text-gray-400">•</span>
            <a
              href="https://giphy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
              aria-label="GIPHY"
            >
              <img
                src="/giphy.png"
                alt="GIPHY logo"
                className="h-6 w-auto opacity-80 hover:opacity-100 transition"
                loading="lazy"
              />
            </a>
          </li>
          <li>
            All emojis designed by{' '}
            <a
              href="https://openmoji.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              OpenMoji
            </a>{' '}
            – the open-source emoji and icon project. License:{' '}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/#"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              CC BY-SA 4.0
            </a>
          </li>
          <li>
            Icon made by{' '}
            <a
              href="https://www.flaticon.com/authors/freepik"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Freepik
            </a>{' '}
            from{' '}
            <a
              href="https://www.flaticon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              www.flaticon.com
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
};
