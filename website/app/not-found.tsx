import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 grid place-items-center px-6">
      <section className="max-w-md text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-lg bg-teal-600 text-white grid place-items-center">
          <Home className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Page not found</h1>
          <p className="mt-2 text-slate-600">This MedHome page does not exist or has moved.</p>
        </div>
        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link href="/">Back to MedHome</Link>
        </Button>
      </section>
    </main>
  );
}
