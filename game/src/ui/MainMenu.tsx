import { readBest } from '../game/engine';
import { THEME_LIST } from '../game/themes';
import type { ThemeConfig, ThemeId } from '../game/types';

interface Props {
  onSelect: (id: ThemeId) => void;
}

export default function MainMenu({ onSelect }: Props) {
  return (
    <div className="menu">
      <div className="menu__sky" aria-hidden>
        <span className="menu__sun" />
        <span className="menu__dune menu__dune--far" />
        <span className="menu__dune menu__dune--near" />
      </div>

      <div className="menu__content">
        <header className="menu__head">
          <p className="menu__eyebrow">bir kayış oyunu</p>
          <h1 className="menu__title">GLIDE</h1>
          <p className="menu__subtitle">
            Sol yarıda joystick, sağ yarıda hareketler. Doksan saniye boyunca ışığı topla.
          </p>
        </header>

        <div className="menu__grid">
          {THEME_LIST.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} onSelect={onSelect} />
          ))}
        </div>

        <section className="menu__help">
          <h2>Nasıl oynanır</h2>
          <ul>
            <li>
              <b>Hareket</b> — ekranın sol yarısına bas ve sürükle; joystick parmağının indiği yerde belirir.
            </li>
            <li>
              <b>Komutlar</b> — sağ yarıda <b>çift dokun</b>, <b>kaydır</b>, <b>basılı tut</b>. Her tema bu üç
              hareketi farklı yeteneklere bağlar. İkisini aynı anda kullanabilirsin.
            </li>
            <li>
              <b>Amaç</b> — ışıkları topla, komboyu büyüt, anıtlara çarpma. Rüzgâr halkaları seni fırlatır.
            </li>
            <li>
              <b>Klavye</b> — WASD veya ok tuşları, <b>Boşluk</b> çift dokunma, <b>Shift</b> kaydırma,{' '}
              <b>E</b> basılı tutma.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function ThemeCard({ theme, onSelect }: { theme: ThemeConfig; onSelect: (id: ThemeId) => void }) {
  const best = readBest(theme.id);
  const pal = theme.palette;
  const style = {
    '--c-wash-top': pal.washTop,
    '--c-wash-bottom': pal.washBottom,
    '--c-ground': pal.ground,
    '--c-glow': pal.glow,
    '--c-face-lit': pal.faceLit,
    '--c-face-dark': pal.faceDark,
    '--c-ui': pal.ui,
    '--c-ui-soft': pal.uiSoft,
    '--c-body': pal.body,
  } as React.CSSProperties;

  return (
    <button className="card" style={style} onClick={() => onSelect(theme.id)}>
      <span className="card__art" aria-hidden>
        <span className="card__sun" />
        <span className="card__mono card__mono--a" />
        <span className="card__mono card__mono--b" />
        <span className="card__ground" />
        <span className="card__figure" />
      </span>
      <span className="card__body">
        <span className="card__name">{theme.name}</span>
        <span className="card__tagline">{theme.tagline}</span>
        <span className="card__abilities">
          <span>{theme.abilities.doubleTap.hint} · {theme.abilities.doubleTap.label}</span>
          <span>{theme.abilities.swipe.hint} · {theme.abilities.swipe.label}</span>
          <span>{theme.abilities.hold.hint} · {theme.abilities.hold.label}</span>
        </span>
        <span className="card__best">{best > 0 ? `en iyi ${best}` : 'henüz oynanmadı'}</span>
      </span>
    </button>
  );
}
