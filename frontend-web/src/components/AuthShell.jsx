import { Link } from 'react-router-dom';

const points = [
  'Verifikasi foto lahan berbasis GPS, maks. 50 m',
  'Dua lapis pemeriksaan: sistem & petugas',
  'Insentif transparan bagi petani tanpa bakar',
];

export default function AuthShell({ children, maxWidth = 'max-w-md' }) {
  return (
    <div className="auth-shell font-sans">
      <aside className="auth-brand-panel relative hidden shrink-0 overflow-hidden bg-forest text-forest-foreground lg:block">
        <img
          src="/images/hero-rice-field.jpg"
          alt="Petani menabur benih di sawah"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/80 to-forest/40" />
        <div className="auth-aside-content relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex w-fit items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-forest-foreground/10 font-display text-lg">
              Z
            </span>
            <span>
              <span className="block font-display text-xl leading-none">Zero Burning</span>
              <span className="mt-1 block text-xs uppercase tracking-[0.2em] text-forest-foreground/60">
                Portal insentif
              </span>
            </span>
          </Link>

          <div className="rise max-w-lg">
            <p className="inline-flex items-center gap-2 rounded-full border border-forest-foreground/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-forest-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" /> Program insentif petani
            </p>
            <h1 className="auth-aside-title mt-6 font-display text-5xl leading-[1.05]">
              Olah lahan <em className="text-ember">tanpa</em> membakar, raih insentif nyata.
            </h1>
            <ul className="auth-aside-points mt-10 space-y-4">
              {points.map((point, index) => (
                <li key={point} className="flex items-center gap-4 text-forest-foreground/85">
                  <span className="font-display text-2xl text-ember">0{index + 1}</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-forest-foreground/60">© 2026 Zero Burning · Indonesia</p>
        </div>
      </aside>

      <main className="auth-panel relative bg-background">
        <div className="auth-panel-inner flex min-h-full w-full flex-col items-center justify-center px-6 py-10 lg:px-10">
          <div className="auth-mobile-brand mb-8 flex w-full items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">
                Z
              </span>
              <span className="font-display text-xl text-foreground">Zero Burning</span>
            </Link>
            <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              ← Kembali
            </Link>
          </div>

          <div className={`auth-card rise w-full ${maxWidth}`}>{children}</div>

          <p className="auth-footer mt-10 text-xs text-muted-foreground">
            Bersama menjaga lahan tanpa membakar
          </p>
        </div>
      </main>
    </div>
  );
}
