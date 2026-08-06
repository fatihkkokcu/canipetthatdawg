import { readBest } from '../game/engine';
import { THEME_LIST } from '../game/themes';
import type { ThemeConfig, ThemeId } from '../game/types';

interface Props {
  onSelect: (id: ThemeId) => void;
}

export default function MainMenu({ onSelect }: Props) {
  return (
    <div className="menu">
      <header className="menu__head">
        <h1 className="menu__title">GLIDE ARENA</h1>
        <p className="menu__subtitle">
          Sol yarıda sanal joystick, sağ yarıda hareket komutları. 90 saniyede en yüksek skoru topla.
        </p>
      </header>

      <div className="menu__grid">
        {THEME_LIST.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} onSelect={onSelect} />
        ))}
      </div>

      <section className="menu__help">
        <h2>Nasıl oynanır?</h2>
        <ul>
          <li>
            <b>Hareket:</b> Ekranın sol yarısına parmağını bas ve sürükle — joystick dokunduğun yerde belirir.
          </li>
          <li>
            <b>Komutlar:</b> Sağ yarıda <b>çift dokun</b>, <b>kaydır</b> ve <b>basılı tut</b>. Her tema bu üç
            hareketi farklı yeteneklere bağlar.
          </li>
          <li>
            <b>Amaç:</b> Toplanabilirleri topla, kombo çarpanını büyüt, engellere çarpma. Hız rampaları seni
            fırlatır.
          </li>
          <li>
            <b>Klavye (test için):</b> WASD/ok tuşları, <b>Boşluk</b> = çift dokunma, <b>Shift</b> = kaydırma,
            <b> E</b> = basılı tutma.
          </li>
        </ul>
      </section>
    </div>
  );
}

function ThemeCard({ theme, onSelect }: { theme: ThemeConfig; onSelect: (id: ThemeId) => void }) {
  const best = readBest(theme.id);
  const style = {
    '--card-accent': theme.palette.accent,
    '--card-accent2': theme.palette.accent2,
    '--card-floor': theme.palette.floor,
    '--card-body': theme.palette.body,
  } as React.CSSProperties;

  return (
    <button className="card" style={style} onClick={() => onSelect(theme.id)}>
      <span className="card__emoji" aria-hidden>
        {theme.emoji}
      </span>
      <span className="card__name">{theme.name}</span>
      <span className="card__tagline">{theme.tagline}</span>
      <span className="card__abilities">
        <span>{theme.abilities.doubleTap.hint} → {theme.abilities.doubleTap.label}</span>
        <span>{theme.abilities.swipe.hint} → {theme.abilities.swipe.label}</span>
        <span>{theme.abilities.hold.hint} → {theme.abilities.hold.label}</span>
      </span>
      <span className="card__best">{best > 0 ? `Rekor: ${best}` : 'Henüz oynanmadı'}</span>
    </button>
  );
}
