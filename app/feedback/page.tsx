'use client';

import { useEffect, useState } from 'react';
import { Ic, EchoLogo } from '@/components/ui';

interface Feedback { rating: number; message: string; name?: string; contact?: string; screen?: string; at: string }

export default function FeedbackViewer() {
  const [key, setKey] = useState('');
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Allow ?key=... in the URL so a bookmark just works.
  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get('key');
    if (k) { setKey(k); load(k); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(k: string) {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/feedback?key=${encodeURIComponent(k)}`);
      if (res.status === 401) { setError('Wrong key.'); setItems(null); setLoading(false); return; }
      const data = await res.json();
      setConfigured(data.configured !== false);
      setItems(data.items ?? []);
    } catch { setError('Could not load.'); }
    setLoading(false);
  }

  const avg = items && items.length
    ? (items.reduce((s, i) => s + (i.rating || 0), 0) / items.filter(i => i.rating).length || 0)
    : 0;

  return (
    <div className="fbv-page">
      <div className="fbv-wrap">
        <div className="fbv-top">
          <EchoLogo size={40} />
          <div>
            <div className="display" style={{ fontSize: 24 }}>Feedback</div>
            <div className="muted" style={{ fontWeight: 600, fontSize: 13 }}>What people are saying about Echo</div>
          </div>
        </div>

        {items === null ? (
          <div className="fbv-gate">
            <p className="muted" style={{ fontWeight: 600 }}>Enter your owner key to view feedback.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="fbv-key" value={key} onChange={(e) => setKey(e.target.value)}
                placeholder="owner key" onKeyDown={(e) => e.key === 'Enter' && load(key)} />
              <button className="fbv-btn" onClick={() => load(key)} disabled={loading || !key}>
                {loading ? '…' : 'View'}
              </button>
            </div>
            {error && <div style={{ color: 'var(--rose-deep)', fontWeight: 700, fontSize: 13 }}>{error}</div>}
          </div>
        ) : (
          <>
            <div className="fbv-stats">
              <div className="fbv-stat"><b>{items.length}</b><span>responses</span></div>
              <div className="fbv-stat"><b>{avg ? avg.toFixed(1) : '—'}</b><span>avg rating</span></div>
            </div>
            {!configured && (
              <div className="fbv-note">
                <Ic name="bell" size={15} /> The feedback store isn&apos;t connected yet — add the KV integration in Vercel to start collecting.
              </div>
            )}
            {items.length === 0 && configured && <p className="muted" style={{ fontWeight: 600 }}>No feedback yet.</p>}
            <div className="fbv-list">
              {items.map((f, i) => (
                <div key={i} className="fbv-item">
                  <div className="fbv-item-top">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                      <span className="fbv-rate">{'★'.repeat(f.rating)}<span style={{ opacity: .25 }}>{'★'.repeat(5 - f.rating)}</span></span>
                      {f.name && <b style={{ fontFamily: 'var(--display)', fontSize: 15 }}>{f.name}</b>}
                    </span>
                    <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>
                      {new Date(f.at).toLocaleString()}{f.screen ? ` · ${f.screen}` : ''}
                    </span>
                  </div>
                  {f.message && <p className="fbv-msg">{f.message}</p>}
                  {f.contact && <div className="fbv-contact"><Ic name="chat" size={13} /> {f.contact}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
