import { ROUND_TIME } from '../game/engine';
import type { GestureName, HudState, ThemeConfig } from '../game/types';

interface Props {
  theme: ThemeConfig;
  hud: HudState;
  onPause: () => void;
  onFullscreen: () => void;
  showHints: boolean;
}

const SLOTS: GestureName[] = ['doubleTap', 'swipe', 'hold'];

export default function Hud({ theme, hud, onPause, onFullscreen, showHints }: Props) {
  const timePct = Math.max(0, Math.min(1, hud.timeLeft / ROUND_TIME));
  const seconds = Math.ceil(hud.timeLeft);
  const style = {
    '--accent': theme.palette.ui,
    '--accent2': theme.palette.uiSoft,
  } as React.CSSProperties;

  return (
    <div className="hud" style={style}>
      <div className="hud__top">
        <div className="hud__scoreblock">
          <div className="hud__score">{hud.score}</div>
          <div className="hud__best">Rekor {hud.best}</div>
        </div>
        <div className="hud__timer">
          <div className="hud__timerText" data-low={seconds <= 10 ? 'true' : 'false'}>
            {seconds}s
          </div>
          <div className="hud__timerTrack">
            <div className="hud__timerFill" style={{ width: `${timePct * 100}%` }} />
          </div>
        </div>
        <div className="hud__buttons">
          <button className="hud__iconBtn" onClick={onFullscreen} aria-label="Tam ekran">
            ⛶
          </button>
          <button className="hud__iconBtn" onClick={onPause} aria-label="Duraklat">
            ❚❚
          </button>
        </div>
      </div>

      {hud.combo > 1 && (
        <div className="hud__combo">
          <span>KOMBO ×{hud.combo}</span>
        </div>
      )}
      {hud.lastAction && (
        <div className="hud__action">
          <span>{hud.lastAction}</span>
        </div>
      )}

      {showHints && (
        <div className="hud__abilities">
          {SLOTS.map((slot) => {
            const ability = theme.abilities[slot];
            const cd = hud.cooldowns[slot];
            const ready = cd <= 0;
            const pct = ability.cooldown > 0 ? 1 - cd / ability.cooldown : 1;
            return (
              <div key={slot} className="ability" data-ready={ready ? 'true' : 'false'}>
                <span className="ability__label">{ability.label}</span>
                <span className="ability__hint">{ability.hint}</span>
                {!ready && <span className="ability__cd" style={{ width: `${pct * 100}%` }} />}
              </div>
            );
          })}
        </div>
      )}

      {showHints && !hud.running && !hud.paused && !hud.finished && (
        <div className="hud__stickHint">Joystick için sol yarıya dokun</div>
      )}
    </div>
  );
}
