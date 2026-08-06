import { useState } from 'react';
import GameScreen from './ui/GameScreen';
import MainMenu from './ui/MainMenu';
import { THEMES } from './game/themes';
import type { ThemeId } from './game/types';

export default function App() {
  const [themeId, setThemeId] = useState<ThemeId | null>(null);

  if (!themeId) {
    return <MainMenu onSelect={setThemeId} />;
  }
  return (
    <GameScreen
      key={themeId}
      theme={THEMES[themeId]}
      onExit={() => setThemeId(null)}
    />
  );
}
