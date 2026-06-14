'use client';

import { useState } from 'react';
import { Ic, Btn, EchoLogo } from './ui';
import { useEcho, displayName } from '@/lib/store';

const RATING_LABEL = ['', 'Not great', 'Meh', 'Okay', 'Good', 'Love it'];

export function FeedbackButton({ screen }: { screen?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="fb-fab" onClick={() => setOpen(true)} aria-label="Share feedback" title="Share feedback">
        <Ic name="chat" size={22} stroke="var(--ink)" />
        <span className="fb-fab-label">Feedback</span>
      </button>
      {open && <FeedbackModal screen={screen} onClose={() => setOpen(false)} />}
    </>
  );
}

function FeedbackModal({ screen, onClose }: { screen?: string; onClose: () => void }) {
  const name = useEcho(s => s.name);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (sending || (!message.trim() && !rating)) return;
    setSending(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, message, contact, screen, name: name?.trim() ? displayName(name) : undefined }),
      });
    } catch { /* thank them anyway */ }
    setSending(false);
    setDone(true);
    setTimeout(onClose, 1700);
  };

  const shown = hover || rating;
  return (
    <div className="fb-overlay" onClick={onClose}>
      <div className="fb-card" onClick={(e) => e.stopPropagation()}>
        <button className="fb-x" onClick={onClose} aria-label="Close"><Ic name="x" size={16} /></button>

        {done ? (
          <div className="fb-done">
            <EchoLogo size={52} />
            <div className="display" style={{ fontSize: 24 }}>Thank you 💛</div>
            <p className="muted" style={{ fontWeight: 600, margin: 0 }}>Your words help Echo get better.</p>
          </div>
        ) : (
          <>
            <div className="fb-head">
              <div className="fb-head-ic"><Ic name="chat" size={24} /></div>
              <div>
                <div className="display" style={{ fontSize: 20, lineHeight: 1.1 }}>Tell us how it felt</div>
                <div className="muted" style={{ fontWeight: 600, fontSize: 13 }}>A few words help more than you&apos;d think.</div>
              </div>
            </div>

            {name?.trim() && (
              <div className="fb-as"><Ic name="heart" size={13} stroke="var(--rose-deep)" fill="var(--rose)" /> Sending as <b>{displayName(name)}</b></div>
            )}

            <div className="fb-stars" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={'fb-star' + (n <= shown ? ' on' : '')}
                  onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                  <Ic name="star" size={34} sw={2.2} stroke="var(--ink)" fill={n <= shown ? 'var(--sun)' : 'var(--cream-3)'} />
                </button>
              ))}
              <span className="fb-rate-label">{RATING_LABEL[shown]}</span>
            </div>

            <textarea className="fb-text" value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="What did you love? What felt off? Anything you wish it did…" rows={4} maxLength={2000} autoFocus />

            <input className="fb-contact" value={contact} onChange={(e) => setContact(e.target.value)}
              placeholder="Email or handle (optional — if you want a reply)" maxLength={200} />

            <Btn variant="primary" block icon={sending ? 'spark' : 'arrowR'} onClick={submit}
              disabled={sending || (!message.trim() && !rating)}>
              {sending ? 'Sending…' : 'Send feedback'}
            </Btn>
            <div className="muted tc" style={{ fontWeight: 600, fontSize: 11.5, marginTop: 10 }}>
              Private — only the Echo team sees this.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
