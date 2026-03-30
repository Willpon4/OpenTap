'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './reportDetail.module.css';

export default function ReportDetailPage() {
  const params = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getReport(params.id);
        setReport(data);
      } catch (e) {
        setError('Report not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) return <div className={styles.loading}>Loading report...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!report) return null;

  const statusLabels = {
    reported: 'Reported', acknowledged: 'Acknowledged',
    in_progress: 'In progress', resolved: 'Resolved', stale: 'Stale',
  };
  const issueLabels = {
    broken: 'Broken or not working', pressure: 'Low or no water pressure',
    dirty: 'Dirty or unsanitary', smell: 'Bad taste, color, or smell',
    missing: 'Missing or removed', inaccessible: 'Inaccessible',
  };

  const lifecycleSteps = ['reported', 'acknowledged', 'in_progress', 'resolved'];
  const currentIdx = lifecycleSteps.indexOf(report.status);
  const isStale = report.status === 'stale';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>Back to map</Link>

        <div className={styles.card}>
          <div className={styles.header}>
            <h1>Report</h1>
            <span className={`status-badge status-${report.status}`}>
              {statusLabels[report.status] || report.status}
            </span>
          </div>

          {/* Lifecycle progress */}
          {!isStale && (
            <div className={styles.lifecycle}>
              {lifecycleSteps.map((step, i) => (
                <div key={step} className={styles.lcStep}>
                  <div className={`${styles.lcDot} ${i <= currentIdx ? styles.lcDotActive : ''}`}>
                    {i < currentIdx ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : null}
                  </div>
                  {i < lifecycleSteps.length - 1 && (
                    <div className={`${styles.lcLine} ${i < currentIdx ? styles.lcLineActive : ''}`} />
                  )}
                  <span className={`${styles.lcLabel} ${i <= currentIdx ? styles.lcLabelActive : ''}`}>
                    {statusLabels[step]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isStale && (
            <div className={styles.staleWarning}>
              This report has not received a response and has been escalated.
            </div>
          )}

          {/* Details */}
          <div className={styles.details}>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Issue</span>
              <span className={styles.detailValue}>{issueLabels[report.issue_type] || report.issue_type}</span>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Severity</span>
              <span className={styles.detailValue}>
                {report.severity === 'high' ? 'High — only water source in area' : 'Normal — other fountains nearby'}
              </span>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Reported via</span>
              <span className={styles.detailValue} style={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {report.reporter_channel}
              </span>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Date reported</span>
              <span className={styles.detailValue}>
                {new Date(report.reported_at).toLocaleString()}
              </span>
            </div>
            {report.description && (
              <div className={styles.detail}>
                <span className={styles.detailLabel}>Description</span>
                <span className={styles.detailValue}>{report.description}</span>
              </div>
            )}
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Location</span>
              <span className={styles.detailValue}>
                {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
              </span>
            </div>
            {report.fountain_id && (
              <div className={styles.detail}>
                <span className={styles.detailLabel}>Fountain</span>
                <Link href={`/fountain/${report.fountain_id}`} className={styles.detailLink}>
                  View fountain details
                </Link>
              </div>
            )}
          </div>

          {/* Status history */}
          {report.status_history && report.status_history.length > 0 && (
            <div className={styles.history}>
              <h2>Timeline</h2>
              <div className={styles.timeline}>
                {report.status_history.map((entry, i) => (
                  <div key={i} className={styles.timelineEntry}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <span className={styles.timelineStatus}>
                        {entry.old_status ? `${statusLabels[entry.old_status] || entry.old_status} → ` : ''}
                        {statusLabels[entry.new_status] || entry.new_status}
                      </span>
                      {entry.notes && <p className={styles.timelineNotes}>{entry.notes}</p>}
                      <span className={styles.timelineDate}>
                        {new Date(entry.changed_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
