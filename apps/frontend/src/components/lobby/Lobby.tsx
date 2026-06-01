'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { vars } from '@/styles/theme.css';
import { Toast } from '@/components/ui/toast';
import {
  GAMES,
  SLIDES,
  CHIPS,
  CAT_LABELS,
  matchCat,
  type GameItem,
  type Slide,
} from '@/lib/lobby-data';
import * as s from './lobby.css';

function CoverArt({ g }: { g: GameItem }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(150deg, ${g.c1}, ${g.c2})` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 80% 0%, rgba(255,255,255,.28), transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 78, lineHeight: 1, color: 'rgba(255,255,255,.92)', textShadow: '0 6px 24px rgba(0,0,0,.35)', transform: 'translateY(-6px)' }}>
          {g.glyph}
        </span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', background: 'linear-gradient(180deg, transparent, rgba(0,0,0,.62))' }} />
    </div>
  );
}

function Badge({ kind }: { kind: 'live' | 'hot' | 'new' }) {
  const map = {
    live: { t: 'Live', bg: vars.color.win, fg: '#03140c' },
    hot: { t: 'Hot', bg: vars.color.seven, fg: '#fff' },
    new: { t: 'New', bg: vars.color.action, fg: vars.color.actionInk },
  } as const;
  const m = map[kind];
  return <span className={s.badge} style={{ background: m.bg, color: m.fg }}>{m.t}</span>;
}

function GameCard({ g, grid }: { g: GameItem; grid?: boolean }) {
  const live = g.status === 'live';
  const className = `${grid ? s.cardGrid : s.card}${live ? '' : ` ${s.cardSoon}`}`;
  const inner = (
    <>
      <CoverArt g={g} />
      <div className={s.cardBadges}>
        {live && <Badge kind="live" />}
        {g.hot && <Badge kind="hot" />}
        {g.isNew && <Badge kind="new" />}
        {!live && <span className={s.soonTag}>Soon</span>}
      </div>
      {live && (
        <div className={s.playFab}>
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: vars.color.action, color: vars.color.actionInk, display: 'grid', placeItems: 'center', fontSize: 18, boxShadow: `0 8px 22px -6px ${vars.color.glow}` }}>
            ▶
          </span>
        </div>
      )}
      <div className={s.cardTitle}>
        <div className={s.cardName}>{g.name}</div>
        <div className={s.cardProv}>{g.provider}</div>
      </div>
    </>
  );

  if (live && g.href) {
    return (
      <Link href={g.href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={className} onClick={() => Toast.info(`${g.name} — coming soon.`)}>
      {inner}
    </div>
  );
}

function Rail({ title, icon, items, onShowAll }: { title: string; icon: string; items: GameItem[]; onShowAll: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const by = (d: number) => ref.current?.scrollBy({ left: d * Math.max(280, ref.current.clientWidth * 0.78), behavior: 'smooth' });
  return (
    <section className={s.rail}>
      <div className={s.railHead}>
        <h2 className={s.railTitle}>
          <span style={{ color: vars.color.goldSoft }}>{icon}</span>
          {title}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onShowAll} style={btnLink}>Show all</button>
          <button onClick={() => by(-1)} style={btnArrow} aria-label="Scroll left">‹</button>
          <button onClick={() => by(1)} style={btnArrow} aria-label="Scroll right">›</button>
        </div>
      </div>
      <div className={s.railTrack} ref={ref}>
        {items.map((g) => <GameCard key={g.id} g={g} />)}
      </div>
    </section>
  );
}

const btnLink = {
  background: 'none',
  border: 'none',
  color: vars.color.goldSoft,
  fontFamily: 'var(--font-ui)',
  fontSize: 13,
  cursor: 'pointer',
} as const;

const btnArrow = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: `1px solid ${vars.color.line}`,
  background: vars.color.surface2,
  color: vars.color.text,
  cursor: 'pointer',
} as const;

function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);
  return (
    <div className={s.hero}>
      <div className={s.heroTrack} style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((sl, k) => (
          <div key={k} className={s.heroSlide} style={{ background: `linear-gradient(115deg, ${sl.c1}, ${sl.c2})` }}>
            <span className={s.heroGlyph}>{sl.glyph}</span>
            <div>
              <span className={s.heroKicker}>{sl.kicker}</span>
              <h2 className={s.heroTitle}>{sl.title}</h2>
              <p className={s.heroSub}>{sl.sub}</p>
              {sl.href.startsWith('/') ? (
                <Link href={sl.href} className={s.heroCta}>{sl.cta} →</Link>
              ) : (
                <a href={sl.href} className={s.heroCta}>{sl.cta} →</a>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={s.heroDots}>
        {slides.map((_, k) => (
          <button key={k} aria-label={`Slide ${k + 1}`} data-on={k === i} className={s.heroDot} onClick={() => setI(k)} />
        ))}
      </div>
    </div>
  );
}

export function Lobby() {
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtering = cat !== 'all' || q.length > 0;
  const results = GAMES.filter((g) => matchCat(g, cat) && (!q || g.name.toLowerCase().includes(q)));

  const popular = ['sugar', 'sevens', 'crash', 'wheel', 'fortune88', 'plinko', 'dice', 'blackjack', 'mines']
    .map((id) => GAMES.find((g) => g.id === id))
    .filter((g): g is GameItem => Boolean(g));
  const news = GAMES.filter((g) => g.isNew);

  return (
    <div className={s.wrap}>
      <HeroCarousel slides={SLIDES} />

      <div className={s.subbar} id="games">
        <div className={s.searchbar}>
          <span className={s.searchIc}>⌕</span>
          <input
            className={s.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games"
            aria-label="Search games"
          />
        </div>
        <div className={s.chips}>
          {CHIPS.map((c) => (
            <button key={c.key} className={s.chip} data-on={cat === c.key} onClick={() => setCat(c.key)}>
              <span>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {filtering ? (
        <section style={{ marginTop: 16 }}>
          <div className={s.railHead}>
            <h2 className={s.railTitle}>{q ? `Results for “${query}”` : CAT_LABELS[cat] ?? cat}</h2>
            <button onClick={() => { setCat('all'); setQuery(''); }} style={btnLink}>Clear</button>
          </div>
          {results.length ? (
            <div className={s.grid}>{results.map((g) => <GameCard key={g.id} g={g} grid />)}</div>
          ) : (
            <p style={{ color: vars.color.textDim, fontFamily: 'var(--font-ui)' }}>No games match. Try another search.</p>
          )}
        </section>
      ) : (
        <>
          <Rail title="Popular this week" icon="★" items={popular} onShowAll={() => setCat('all')} />
          <Rail title="Slots" icon="▦" items={GAMES.filter((g) => g.cat === 'Slots')} onShowAll={() => setCat('Slots')} />
          <Rail title="Instant wins" icon="✦" items={GAMES.filter((g) => g.cat === 'Instant')} onShowAll={() => setCat('Instant')} />
          <Rail title="Table games" icon="♠" items={GAMES.filter((g) => g.cat === 'Table')} onShowAll={() => setCat('Table')} />
          <Rail title="Live casino" icon="◉" items={GAMES.filter((g) => g.cat === 'Live')} onShowAll={() => setCat('Live')} />
          <Rail title="New releases" icon="✧" items={news} onShowAll={() => setCat('new')} />
        </>
      )}
    </div>
  );
}
