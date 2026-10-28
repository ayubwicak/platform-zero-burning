import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BackToHome({ className = '' }) {
  return (
    <Link
      to="/"
      aria-label="Kembali ke beranda"
      data-testid="back-to-home"
      className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80 hover:underline active:text-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      Kembali ke beranda
    </Link>
  );
}
