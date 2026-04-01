'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './ReportForm.module.css';
import imageCompression from 'browser-image-compression';

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
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

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
  const [locationText, setLocationText] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

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

  const lookUpLocation = async () => {
    if (!locationText) return;
    setLookingUp(true);
    setError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'OpenTap/0.1' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        setForm(f => ({
          ...f,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          description: `Location: ${locationText}`,
        }));
        setLocationStatus('set');
      } else {
        setError('Could not find that location. Try a more specific address or place name.');
      }
    } catch {
      setError('Could not look up location. Check your connection and try again.');
    } finally {
      setLookingUp(false);
    }
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
                <button onClick={() => { setLocationStatus('idle'); setForm(f => ({ ...f, latitude: null, longitude: null })); }} className={styles.linkBtn}>Change</button>
              </div>
            )}

            {locationStatus === 'error' && (
              <div className={styles.locationError}>
                <p>Could not detect your location automatically. Type an address or place name below instead.</p>
              </div>
            )}

            {locationStatus === 'idle' && (
              <button onClick={detectLocation} className={styles.btnSecondary} style={{ width: '100%' }}>
                Use my current location
              </button>
            )}

            {locationStatus !== 'set' && (
              <div className={styles.manualLocation}>
                <label className={styles.label}>Or type a place name or address</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder='e.g. "Purcell Park, Harrisonburg VA"'
                    className={styles.input}
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); lookUpLocation(); } }}
                  />
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    style={{ whiteSpace: 'nowrap' }}
                    disabled={!locationText || lookingUp}
                    onClick={lookUpLocation}
                  >
                    {lookingUp ? '...' : 'Look up'}
                  </button>
                </div>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <button
              className={styles.btnPrimary}
              disabled={!form.latitude}
              onClick={() => { setError(''); setStep(2); }}
              style={{ marginTop: '16px' }}
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
            <h2 className={styles.stepTitle}>Additional details</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>Photo</label>
              <p className={styles.hint}>Reports with photos are resolved faster.</p>

              {!photoPreview ? (
                <div>
                  <label className={styles.photoUploadBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    Add a photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          const compressed = await imageCompression(file, {
                            maxSizeMB: 0.3,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                          });
                          setPhotoFile(compressed);
                          setPhotoPreview(URL.createObjectURL(compressed));
                        } catch (err) {
                          console.error('Compression failed:', err);
                          setError('Could not process that image. Try a different photo.');
                        }
                      }}
                    />
                  </label>
                  <div className={styles.photoTips}>
                    <span>Tips for a good photo:</span>
                    <span>Press the button so we can see the water flow</span>
                    <span>Include the full fountain in the frame</span>
                    <span>Show the surrounding area so we can find it</span>
                  </div>
                </div>
              ) : (
                <div className={styles.photoPreview}>
                  <img src={photoPreview} alt="Preview" />
                  <button
                    type="button"
                    className={styles.photoRemove}
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  >
                    Remove photo
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description (optional)</label>
              <textarea
                placeholder="Any details that might help — what's wrong, how long it's been like this..."
                className={styles.textarea}
                value={form.description || ''}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email or phone (optional)</label>
              <p className={styles.hint}>We&apos;ll notify you when the status changes. Encrypted and never shared.</p>
              <input
                type="text"
                placeholder="email@example.com or +1 555-123-4567"
                className={styles.input}
                value={form.reporter_contact || ''}
                onChange={(e) => setForm(f => ({ ...f, reporter_contact: e.target.value }))}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.stepActions}>
              <button onClick={() => { setError(''); setStep(2); }} className={styles.btnBack}>Back</button>
              <button
                className={styles.btnPrimary}
                disabled={uploading}
                onClick={async () => {
                  setError('');
                  setUploading(true);
                  try {
                    let photoUrl = null;
                    if (photoFile) {
                      // Get pre-signed URL
                      const urlRes = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/upload-url?content_type=${encodeURIComponent(photoFile.type || 'image/jpeg')}`
                      );
                      if (!urlRes.ok) throw new Error('Could not get upload URL');
                      const { upload_url, public_url } = await urlRes.json();

                      // Upload directly to R2
                      const uploadRes = await fetch(upload_url, {
                        method: 'PUT',
                        headers: { 'Content-Type': photoFile.type || 'image/jpeg' },
                        body: photoFile,
                      });
                      if (!uploadRes.ok) throw new Error('Photo upload failed');
                      photoUrl = public_url;
                    }

                    // Submit report
                    const reportData = { ...form };
                    if (photoUrl) reportData.photo_url = photoUrl;
                    const report = await api.createReport(reportData);
                    setReportId(report.id);
                    setSubmitted(true);
                  } catch (err) {
                    console.error('Submit error:', err);
                    setError(err.message || 'Failed to submit report. Please try again.');
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                {uploading ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
