'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './ReportForm.module.css';

const ISSUE_TYPES = [
  { value: 'broken', label: 'Broken or not working', desc: 'No water comes out at all' },
  { value: 'pressure', label: 'Low or no water pressure', desc: 'Water barely trickles' },
  { value: 'dirty', label: 'Dirty or unsanitary', desc: 'Visible dirt, mold, or debris' },
  { value: 'smell', label: 'Bad taste, color, or smell', desc: 'Possible contamination' },
  { value: 'missing', label: 'Missing or removed', desc: 'Fountain was here but is gone' },
  { value: 'inaccessible', label: 'Inaccessible', desc: 'Blocked, locked, or hard to reach' },
];

export default function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    latitude: parseFloat(searchParams.get('lat')) || null,
    longitude: parseFloat(searchParams.get('lng')) || null,
    fountain_id: searchParams.get('fountain_id') || null,
    issue_type: '',
    severity: 'low',
    description: '',
    reporter_contact: '',
    reporter_channel: searchParams.get('fountain_id') ? 'qr' : 'web',
  });

  const [locationStatus, setLocationStatus] = useState(
    form.latitude ? 'set' : 'idle'
  );

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          latitude: Math.round(pos.coords.latitude * 1000000) / 1000000,
          longitude: Math.round(pos.coords.longitude * 1000000) / 1000000,
        }));
        setLocationStatus('set');
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!form.latitude) detectLocation();
  }, []);

  const handleSubmit = async () => {
    if (!form.latitude || !form.longitude || !form.issue_type) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.createReport(form);
      setReportId(result.id);
      setSubmitted(true);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.success}>
          <div className={styles.successIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2>Report submitted</h2>
          <p>Thank you. Your report is now on the public map and will be tracked until it&apos;s resolved.</p>
          <div className={styles.successActions}>
            <a href={`/report/${reportId}`} className={styles.btnPrimary}>View your report</a>
            <a href="/reports" className={styles.btnSecondary}>See all reports</a>
            <a href="/" className={styles.btnLink}>Back to map</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <h1>Report a problem</h1>
          <p>Takes less than 60 seconds. No account needed.</p>
        </div>

        {/* Progress */}
        <div className={styles.steps}>
          {[1, 2, 3].map(s => (
            <div key={s} className={`${styles.stepDot} ${step >= s ? styles.stepActive : ''}`}>
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Location */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Where is the fountain?</h2>

            {locationStatus === 'detecting' && (
              <div className={styles.locationDetecting}>
                <div className={styles.spinnerSmall} />
                Detecting your location...
              </div>
            )}

            {locationStatus === 'set' && (
              <div className={styles.locationSet}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Location set: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</span>
                <button onClick={detectLocation} className={styles.linkBtn}>Update</button>
              </div>
            )}

            {locationStatus === 'error' && (
              <div className={styles.locationError}>
                <p>Could not detect location. Please enter coordinates or describe where the fountain is.</p>
                <button onClick={detectLocation} className={styles.linkBtn}>Try again</button>
              </div>
            )}

            {locationStatus === 'idle' && (
              <button onClick={detectLocation} className={styles.btnSecondary} style={{ width: '100%' }}>
                Use my current location
              </button>
            )}

            <div className={styles.manualLocation}>
              <label className={styles.label}>Or describe the location</label>
              <input
                type="text"
                placeholder='e.g. "Purcell Park, Harrisonburg VA"'
                className={styles.input}
                onChange={(e) => {
                  if (e.target.value) {
                    setForm(f => ({ ...f, description: `Location: ${e.target.value}` }));
                  }
                }}
              />
            </div>

            <button
              className={styles.btnPrimary}
              disabled={!form.latitude && !form.description}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Issue type */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>What&apos;s the problem?</h2>
            <div className={styles.issueGrid}>
              {ISSUE_TYPES.map(issue => (
                <button
                  key={issue.value}
                  className={`${styles.issueCard} ${form.issue_type === issue.value ? styles.issueCardSelected : ''}`}
                  onClick={() => setForm(f => ({ ...f, issue_type: issue.value }))}
                >
                  <span className={styles.issueLabel}>{issue.label}</span>
                  <span className={styles.issueDesc}>{issue.desc}</span>
                </button>
              ))}
            </div>

            <div className={styles.severitySection}>
              <label className={styles.label}>How bad is it?</label>
              <div className={styles.severityToggle}>
                <button
                  className={`${styles.sevBtn} ${form.severity === 'low' ? styles.sevBtnActive : ''}`}
                  onClick={() => setForm(f => ({ ...f, severity: 'low' }))}
                >
                  There are other fountains nearby
                </button>
                <button
                  className={`${styles.sevBtn} ${form.severity === 'high' ? styles.sevBtnActive : ''}`}
                  onClick={() => setForm(f => ({ ...f, severity: 'high' }))}
                >
                  This is the only water source in this area
                </button>
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.btnSecondary} onClick={() => setStep(1)}>Back</button>
              <button className={styles.btnPrimary} disabled={!form.issue_type} onClick={() => setStep(3)}>Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Optional details + submit */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Anything else? (optional)</h2>

            <div className={styles.field}>
              <label className={styles.label}>Additional details</label>
              <textarea
                className={styles.textarea}
                placeholder="Describe the problem in more detail..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Your email or phone (optional)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="For updates on your report — never shared publicly"
                value={form.reporter_contact}
                onChange={(e) => setForm(f => ({ ...f, reporter_contact: e.target.value }))}
              />
              <span className={styles.hint}>We&apos;ll only use this to notify you when the status changes.</span>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.btnRow}>
              <button className={styles.btnSecondary} onClick={() => setStep(2)}>Back</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
