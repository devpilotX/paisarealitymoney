import Link from 'next/link';

export default function NotFound(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center px-6">
        <p className="text-8xl font-bold text-primary/20 mb-4">404</p>
        <h1 className="font-serif text-3xl font-bold text-navy mb-3">Page Not Found</h1>
        <p className="text-muted mb-8 max-w-md mx-auto">
          The page you are looking for does not exist or has been moved. Try checking the URL
          or go back to the homepage.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go to Homepage
          </Link>
          <Link href="/schemes" className="btn-secondary">
            Find Schemes
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap gap-3 justify-center text-sm">
          <Link href="/gold-rate" className="text-navy hover:text-brand-red">
            Gold Rate
          </Link>
          <Link href="/silver-rate" className="text-navy hover:text-brand-red">
            Silver Rate
          </Link>
          <Link href="/petrol-price" className="text-navy hover:text-brand-red">
            Petrol Price
          </Link>
          <Link href="/calculators" className="text-navy hover:text-brand-red">
            Calculators
          </Link>
          <Link href="/bank-rates" className="text-navy hover:text-brand-red">
            Bank Rates
          </Link>
        </div>
      </div>
    </div>
  );
}
