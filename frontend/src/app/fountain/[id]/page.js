'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './fountain.module.css';

export default function FountainPage() {
  const params = useParams();
  const [fountain, setFountain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getFountain(params.id);
        setFountain(data);
      } catch (e) {
        setError('Fountain not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!fountain) return null;

  const statusLabels = {
    working: 'Working', issue: 'Reported issue',
    broken: 'Broken', unknown: 'Unknown status',
  };
  const typeLabels = {
    fountain: 'Drinking fountain', bottle_filler: 'Bottle filler',
    tap: 'Water tap', spigot: 'Spigot', other: 'Water source',
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>Back to map</Link>

        <div className={styles.card}>
          <div className={styles.header}>
            <div>
              <h1>{typeLabels[fountain.type] || 'Water fountain'}</h1>
              <span className={`status-badge status-${fountain.status}`}>
                {statusLabels[fountain.status] || fountain.status}
              </span>
            </div>
            <Link
              href={`/report?fountain_id=${fountain.id}&lat=${fountain.latitude || ''}&lng=${fountain.longitude || ''}`}
              className={styles.reportBtn}
            >
              Report a problem
            </Link>
          </div>

          <div className={styles.details}>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Source</span>
              <span className={styles.detailValue}>
                {fountain.source === 'osm' ? 'OpenStreetMap' : fountain.source === 'citizen' ? 'Citizen report' : fountain.source}
              </span>
            </div>
            {fountain.last_verified && (
              <div className={styles.detail}>
                <span className={styles.detailLabel}>Last verified</span>
                <span className={styles.detailValue}>
                  {new Date(fountain.last_verified).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Added</span>
              <span className={styles.detailValue}>
                {new Date(fountain.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
