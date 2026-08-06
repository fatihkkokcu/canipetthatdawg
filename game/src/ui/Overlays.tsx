import type { RunResult, ThemeConfig } from '../game/types';

interface PauseProps {
  theme: ThemeConfig;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function PauseOverlay({ theme, onResume, onRestart, onExit }: PauseProps) {
  return (
    <div className="overlay">
      <div className="panel" style={{ '--accent': theme.palette.ui } as React.CSSProperties}>
        <h2 className="panel__title">Duraklatıldı</h2>
        <p className="panel__text">{theme.name}</p>
        <div className="panel__hints">
          <span>{theme.abilities.doubleTap.hint} → {theme.abilities.doubleTap.label}</span>
          <span>{theme.abilities.swipe.hint} → {theme.abilities.swipe.label}</span>
          <span>{theme.abilities.hold.hint} → {theme.abilities.hold.label}</span>
        </div>
        <div className="panel__actions">
          <button className="btn btn--primary" onClick={onResume}>
            Devam et
          </button>
          <button className="btn" onClick={onRestart}>
            Baştan
          </button>
          <button className="btn" onClick={onExit}>
            Tema seç
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResultProps {
  theme: ThemeConfig;
  result: RunResult;
  onRestart: () => void;
  onExit: () => void;
}

export function ResultOverlay({ theme, result, onRestart, onExit }: ResultProps) {
  return (
    <div className="overlay">
      <div className="panel" style={{ '--accent': theme.palette.ui } as React.CSSProperties}>
        <h2 className="panel__title">Süre doldu</h2>
        <div className="panel__score">{result.score}</div>
        {result.isNewBest && <div className="panel__badge">Yeni rekor!</div>}
        <dl className="panel__stats">
          <div>
            <dt>Toplanan {theme.collectibleName}</dt>
            <dd>{result.collected}</dd>
          </div>
          <div>
            <dt>En iyi kombo</dt>
            <dd>×{result.bestCombo}</dd>
          </div>
          <div>
            <dt>Çarpışma</dt>
            <dd>{result.crashes}</dd>
          </div>
        </dl>
        <div className="panel__actions">
          <button className="btn btn--primary" onClick={onRestart}>
            Tekrar oyna
          </button>
          <button className="btn" onClick={onExit}>
            Tema seç
          </button>
        </div>
      </div>
    </div>
  );
}
