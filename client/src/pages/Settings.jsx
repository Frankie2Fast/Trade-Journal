import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createCheckoutSession, createPortalSession } from '../utils/storage.js';

function Section({ title, sub, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 4 }}>{title}</h3>
        {sub && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, autoComplete }) {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="form-input"
          type={isPw ? (showPw ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{ paddingRight: isPw ? 42 : undefined }}
        />
        {isPw && (
          <button type="button" onClick={() => setShowPw(v => !v)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex'
          }}>
            {showPw
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

function SuccessMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'rgba(5,216,144,0.08)', border: '1px solid rgba(5,216,144,0.25)',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: 'var(--green)',
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      {msg}
    </div>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.25)',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: 'var(--red)',
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16
    }}>
      <span>&#9888;</span> {msg}
    </div>
  );
}

export default function Settings() {
  const { user, getUsername, changeCredentials, refreshPlan } = useAuth();
  const currentUsername = getUsername();
  const [searchParams, setSearchParams] = useSearchParams();

  // On redirect back from Stripe with ?upgraded=1, refresh the plan
  useEffect(() => {
    if (searchParams.get('upgraded') === '1') {
      refreshPlan();
      setSearchParams({}, { replace: true });
    }
  }, []);

  // Change username form
  const [newUsername, setNewUsername]       = useState('');
  const [unCurrentPw, setUnCurrentPw]       = useState('');
  const [unError, setUnError]               = useState('');
  const [unSuccess, setUnSuccess]           = useState('');
  const [unLoading, setUnLoading]           = useState(false);

  // Change password form
  const [pwCurrent, setPwCurrent]           = useState('');
  const [pwNew, setPwNew]                   = useState('');
  const [pwConfirm, setPwConfirm]           = useState('');
  const [pwError, setPwError]               = useState('');
  const [pwSuccess, setPwSuccess]           = useState('');
  const [pwLoading, setPwLoading]           = useState(false);

  // Billing
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError]     = useState('');

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    setUnError(''); setUnSuccess('');
    if (!newUsername.trim()) { setUnError('Please enter a new username.'); return; }
    if (newUsername.trim() === currentUsername) { setUnError('That is already your username.'); return; }
    setUnLoading(true);
    try {
      await changeCredentials(unCurrentPw, { newUsername: newUsername.trim() });
      setUnSuccess(`Username changed to "${newUsername.trim()}".`);
      setNewUsername(''); setUnCurrentPw('');
    } catch (err) {
      setUnError(err.message);
    } finally {
      setUnLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (!pwNew) { setPwError('Please enter a new password.'); return; }
    if (pwNew.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await changeCredentials(pwCurrent, { newPassword: pwNew });
      setPwSuccess('Password updated successfully.');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setBillingError(''); setBillingLoading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setBillingError(err.message);
      setBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setBillingError(''); setBillingLoading(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      setBillingError(err.message);
      setBillingLoading(false);
    }
  };

  const isPro = user?.plan === 'pro';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and subscription</p>
      </div>

      {/* Current account info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
        marginBottom: 24
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(5,216,144,0.12)', border: '1px solid rgba(5,216,144,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', fontWeight: 700, color: 'var(--green)'
        }}>
          {currentUsername.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{currentUsername}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {isPro ? 'Pro Plan' : 'Free Plan'} &middot; Trade Journal
          </p>
        </div>
        {isPro && (
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              background: 'linear-gradient(135deg, rgba(5,216,144,0.15), rgba(5,216,144,0.05))',
              border: '1px solid rgba(5,216,144,0.3)', borderRadius: 20,
              padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--green)'
            }}>PRO</span>
          </div>
        )}
      </div>

      {/* Subscription */}
      <Section
        title="Subscription"
        sub="Manage your Edgeflow plan."
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              {isPro
                ? 'Unlimited trades, full analytics, and priority support.'
                : 'Limited to 50 trades. Upgrade for unlimited access and full analytics.'}
            </p>
          </div>
          {isPro ? (
            <button className="btn" onClick={handleManageBilling} disabled={billingLoading} style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)',
              padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 500, flexShrink: 0
            }}>
              {billingLoading ? 'Loading...' : 'Manage Billing'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleUpgrade} disabled={billingLoading} style={{ flexShrink: 0 }}>
              {billingLoading ? 'Loading...' : 'Upgrade to Pro'}
            </button>
          )}
        </div>
        {billingError && <div style={{ marginTop: 12 }}><ErrorMsg msg={billingError} /></div>}
      </Section>

      {/* Change Username */}
      <Section
        title="Change Username"
        sub="Your username is used to sign in. Requires your current password to confirm."
      >
        <form onSubmit={handleChangeUsername}>
          <SuccessMsg msg={unSuccess} />
          <ErrorMsg msg={unError} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field
              label="New Username"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              autoComplete="off"
            />
            <Field
              label="Current Password"
              value={unCurrentPw}
              onChange={e => setUnCurrentPw(e.target.value)}
              type="password"
              placeholder="Confirm with password"
              autoComplete="current-password"
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={unLoading}>
              {unLoading ? 'Updating...' : 'Update Username'}
            </button>
          </div>
        </form>
      </Section>

      {/* Change Password */}
      <Section
        title="Change Password"
        sub="Choose a strong password with at least 6 characters."
      >
        <form onSubmit={handleChangePassword}>
          <SuccessMsg msg={pwSuccess} />
          <ErrorMsg msg={pwError} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field
              label="Current Password"
              value={pwCurrent}
              onChange={e => setPwCurrent(e.target.value)}
              type="password"
              placeholder="Current password"
              autoComplete="current-password"
            />
            <Field
              label="New Password"
              value={pwNew}
              onChange={e => setPwNew(e.target.value)}
              type="password"
              placeholder="New password"
              autoComplete="new-password"
            />
            <Field
              label="Confirm New Password"
              value={pwConfirm}
              onChange={e => setPwConfirm(e.target.value)}
              type="password"
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}
