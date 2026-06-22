'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  id: number; name: string; email: string; plan: string;
  full_name: string | null; phone: string | null; city: string | null;
  email_verified: boolean; created_at: string; last_login_at: string | null;
}

function AccountContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then((d: { success: boolean; user?: UserData }) => {
      if (d.success && d.user) {
        setUser(d.user);
        setFullName(d.user.full_name || d.user.name || '');
        setPhone(d.user.phone || '');
        setCity(d.user.city || '');
      } else router.push('/login');
    }).catch(() => router.push('/login')).finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const v = searchParams.get('verify');
    if (v === 'success') setVerifyMsg('Email verified successfully!');
    else if (v === 'expired') setVerifyMsg('Verification link expired. Please resend.');
    else if (v === 'invalid' || v === 'error') setVerifyMsg('Invalid verification link.');
  }, [searchParams]);

  const saveProfile = useCallback(async () => {
    setProfileMsg('');
    const res = await fetch('/api/account/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, phone, city }),
    });
    const d = await res.json() as { success: boolean; error?: string };
    setProfileMsg(d.success ? 'Profile updated.' : (d.error || 'Failed.'));
  }, [fullName, phone, city]);

  const changePw = useCallback(async () => {
    setPwMsg('');
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match.'); return; }
    const res = await fetch('/api/account/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: curPw, new_password: newPw }),
    });
    const d = await res.json() as { success: boolean; error?: string };
    if (d.success) { setPwMsg('Password changed.'); setCurPw(''); setNewPw(''); setConfirmPw(''); }
    else setPwMsg(d.error || 'Failed.');
  }, [curPw, newPw, confirmPw]);

  const resendVerify = useCallback(async () => {
    setVerifyMsg('');
    const res = await fetch('/api/account/resend-verification', { method: 'POST' });
    const d = await res.json() as { success: boolean; error?: string };
    setVerifyMsg(d.success ? 'Verification email sent. Check your inbox.' : (d.error || 'Failed.'));
  }, []);

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!user) return <div />;

  return (
    <>
      {verifyMsg && <div className="mb-4 p-3 rounded-lg bg-teal-50 text-teal-800 text-sm">{verifyMsg}</div>}

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="flex items-center gap-2">
              <input value={user.email} disabled className="input-field bg-gray-50 flex-1" />
              {user.email_verified
                ? <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Verified</span>
                : <><span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Not verified</span>
                    <button onClick={() => void resendVerify()} className="text-xs text-primary hover:underline">Resend</button></>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={city} onChange={e => setCity(e.target.value)} className="input-field" placeholder="Optional" />
            </div>
          </div>
          {profileMsg && <p className={`text-sm ${profileMsg.includes('updated') ? 'text-green-700' : 'text-red-600'}`}>{profileMsg}</p>}
          <button onClick={() => void saveProfile()} className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <div className="space-y-4 max-w-md">
          <input type="password" placeholder="Current password" value={curPw} onChange={e => setCurPw(e.target.value)} className="input-field" />
          <input type="password" placeholder="New password (min 8 chars)" value={newPw} onChange={e => setNewPw(e.target.value)} className="input-field" />
          <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="input-field" />
          {pwMsg && <p className={`text-sm ${pwMsg.includes('changed') ? 'text-green-700' : 'text-red-600'}`}>{pwMsg}</p>}
          <button onClick={() => void changePw()} className="btn-primary">Update Password</button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Account Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Plan:</span> <span className="font-medium">{user.plan === 'premium' ? 'Premium' : 'Free'}</span></div>
          <div><span className="text-gray-500">Member since:</span> <span className="font-medium">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : 'N/A'}</span></div>
          <div><span className="text-gray-500">Last login:</span> <span className="font-medium">{user.last_login_at ? new Date(user.last_login_at).toLocaleString('en-IN') : 'N/A'}</span></div>
        </div>
      </div>
    </>
  );
}

export default function AccountPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
        <span>/</span><span className="text-gray-900">Account</span>
      </div>
      <h1 className="heading-1 mb-6">My Account</h1>
      <Suspense fallback={<p className="text-center text-gray-500">Loading...</p>}>
        <AccountContent />
      </Suspense>
    </div>
  );
}
