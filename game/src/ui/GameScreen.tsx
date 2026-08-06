import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine, ROUND_TIME } from '../game/engine';
import type { HudState, RunResult, ThemeConfig } from '../game/types';
import Hud from './Hud';
import { PauseOverlay, ResultOverlay } from './Overlays';

interface Props {
  theme: ThemeConfig;
  onExit: () => void;
}

const EMPTY_HUD: HudState = {
  score: 0,
  best: 0,
  combo: 1,
  timeLeft: ROUND_TIME,
  collected: 0,
  running: false,
  paused: false,
  finished: false,
  lastAction: null,
  cooldowns: { doubleTap: 0, swipe: 0, hold: 0 },
};

export default function GameScreen({ theme, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new GameEngine(theme, {
      onHud: setHud,
      onFinish: setResult,
    });
    engineRef.current = engine;
    engine.mount(canvas);

    const onHidden = () => {
      if (document.hidden) engine.pause();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      engine.unmount();
      engineRef.current = null;
    };
  }, [theme]);

  const togglePause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.isPaused) engine.resume();
    else engine.pause();
  }, []);

  const restart = useCallback(() => {
    setResult(null);
    engineRef.current?.restart();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  return (
    <div className="game" style={{ background: theme.palette.floor }}>
      <canvas ref={canvasRef} className="game__canvas" />
      <Hud
        theme={theme}
        hud={hud}
        onPause={togglePause}
        onFullscreen={toggleFullscreen}
        showHints={!result}
      />
      {hud.paused && !result && (
        <PauseOverlay theme={theme} onResume={togglePause} onRestart={restart} onExit={onExit} />
      )}
      {result && <ResultOverlay theme={theme} result={result} onRestart={restart} onExit={onExit} />}
    </div>
  );
}
