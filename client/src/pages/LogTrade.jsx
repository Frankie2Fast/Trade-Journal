import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addTrade } from '../utils/storage.js';

const SESSIONS = ['London', 'New York', 'Asian', 'London/NY Overlap'];
const EMOTIONS = ['Disciplined', 'Confident', 'Hesitant', 'FOMO', 'Revenge', 'Anxious', 'Neutral'];
const GRADES = ['A', 'B', 'C'];
const MISTAKE_OPTIONS = [
  'Chased entry', 'Sized too big', 'Moved stop loss', 'Took profit too early',
  'Ignored trade plan', 'Overtraded', 'Revenge traded', 'Missed entry'
];

export default function LogTrade() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    symbol: '',
    direction: 'LONG',
    quantity: '',
    pnl: '',
    date: new Date().toISOString().slice(0, 10),
    session: '',
    setup: '',
    risk_amount: '',
    emotion: '',
    grade: '',
    mistakes: [],
    notes: ''
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const quantity = form.quantity ? parseFloat(form.quantity) : null;
    const pnl = form.pnl !== '' ? parseFloat(form.pnl) : null;

    const trade = {
      id: Date.now().toString(),
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      quantity,
      pnl,
      date: form.date,
      session: form.session,
      setup: form.setup,
      risk_amount: form.risk_amount ? parseFloat(form.risk_amount) : null,
      emotion: form.emotion,
      grade: form.grade,
      mistakes: form.mistakes,
      notes: form.notes,
      images: [],
      created_at: new Date().toISOString()
    };

    addTrade(trade);
    navigate(`/trades/${trade.id}`);
  };

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1 className="page-title">Log Trade</h1>
        <p className="page-subtitle">Record a new trade entry</p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--text-muted)' }}>Trade Details</h3>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Symbol *</label>
              <input
                className="form-input"
                value={form.symbol}
                onChange={e => set('symbol', e.target.value.toUpperCase())}
                placeholder="AAPL, BTC, EUR/USD"
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Direction *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['LONG', 'SHORT'].map(dir => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => set('direction', dir)}
                    className="btn flex-1"
                    style={{
                      justifyContent: 'center',
                      background: form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green-dim)' : 'var(--red-dim)')
                        : 'var(--bg-input)',
                      border: `1px solid ${form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green)' : 'var(--red)')
                        : 'var(--border)'}`,
                      color: form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green)' : 'var(--red)')
                        : 'var(--text-muted)'
                    }}
                  >
                    {dir === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">P&L ($) *</label>
              <input
                type="number"
                className="form-input"
                value={form.pnl}
                onChange={e => set('pnl', e.target.value)}
                placeholder="e.g. 250 or -100"
                step="any"
                required
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-input"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                placeholder="Shares / contracts"
                step="any"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Session</label>
              <select
                className="form-select"
                value={form.session}
                onChange={e => set('session', e.target.value)}
              >
                <option value="">— Select —</option>
                {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Risk Amount ($)</label>
              <input
                type="number"
                className="form-input"
                value={form.risk_amount}
                onChange={e => set('risk_amount', e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Setup</label>
            <input
              className="form-input"
              value={form.setup}
              onChange={e => set('setup', e.target.value)}
              placeholder="e.g. BOS + Order Block retest, FVG fill, VWAP rejection..."
            />
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Emotion</label>
              <select className="form-select" value={form.emotion} onChange={e => set('emotion', e.target.value)}>
                <option value="">— Select —</option>
                {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trade Grade</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {GRADES.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set('grade', form.grade === g ? '' : g)}
                    className="btn flex-1"
                    style={{
                      justifyContent: 'center', fontWeight: 700,
                      background: form.grade === g ? (g === 'A' ? 'var(--green-dim)' : g === 'B' ? 'rgba(255,165,0,0.15)' : 'var(--red-dim)') : 'var(--bg-input)',
                      border: `1px solid ${form.grade === g ? (g === 'A' ? 'var(--green)' : g === 'B' ? 'orange' : 'var(--red)') : 'var(--border)'}`,
                      color: form.grade === g ? (g === 'A' ? 'var(--green)' : g === 'B' ? 'orange' : 'var(--red)') : 'var(--text-muted)'
                    }}
                  >{g}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Mistakes</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MISTAKE_OPTIONS.map(m => {
                const active = form.mistakes.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('mistakes', active ? form.mistakes.filter(x => x !== m) : [...form.mistakes, m])}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`,
                      background: active ? 'var(--red-dim)' : 'var(--bg-input)',
                      color: active ? 'var(--red)' : 'var(--text-muted)',
                      transition: 'all 0.15s'
                    }}
                  >{m}</button>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="What did you see? Execution thoughts, lessons learned..."
              rows={3}
            />
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/trades')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Log Trade
          </button>
        </div>
      </form>
    </div>
  );
}
