'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function UnsubContent(): React.ReactElement {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'done' | 'invalid'>('loading');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    fetch('/api/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(r => setStatus(r.ok ? 'done' : 'invalid'))
      .catch(() => setStatus('invalid'));
  }, [token]);

  if (status === 'loading') return <p className="text-gray-500">Processing...</p>;
  if (status === 'invalid') return <p className="text-red-600">Invalid or expired unsubscribe link.</p>;
  return <p className="text-green-700">You have been unsubscribed. You will no longer receive newsletter emails from Paisa Reality.</p>;
}

export default function UnsubscribePage(): React.ReactElement {
  return (
    <div className="container-main py-12 max-w-md mx-auto text-center">
      <h1 className="heading-1 mb-6">Unsubscribe</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <UnsubContent />
      </Suspense>
    </div>
  );
}
