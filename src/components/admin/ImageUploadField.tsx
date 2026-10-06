'use client';

import { useId, useRef, useState } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

/** Image field for the admin: paste a link or upload a file. Either way the value is a URL. */
export default function ImageUploadField({ label, value, onChange, placeholder }: Props): React.ReactElement {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File): Promise<void> {
    setError('');
    if (file.size > 4 * 1024 * 1024) { setError('Image is larger than 4 MB. Compress it and try again.'); return; }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/uploads', { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && data.url) onChange(data.url);
      else setError(data.error || (res.status === 413 ? 'Image is too large.' : 'Upload failed.'));
    } catch {
      setError('Network error during upload.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field flex-1"
          placeholder={placeholder || 'https://.../image.jpg, or upload a file'}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          aria-label={`Upload file for ${label}`}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-secondary whitespace-nowrap disabled:opacity-60"
        >
          {uploading ? 'Uploading...' : 'Upload image'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-sm text-red-600 hover:underline">
            Remove
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">PNG, JPEG, WebP or GIF, up to 4 MB.</p>
      {error && <p role="alert" className="text-sm text-red-600 mt-1">{error}</p>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Selected image preview" className="mt-2 max-h-40 rounded border border-gray-200" />
      )}
    </div>
  );
}
