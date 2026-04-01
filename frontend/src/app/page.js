'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  const [stats, setStats] = useState({ fountain_count: 0, city_count: 0, report_count: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/fountains/stats/summary`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Failed to load stats:', e);
      }
    };
    loadStats();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.badge}>Free &amp; open source</div>
        <h1 className={styles.title}>
          Every public water fountain,<br />tracked and accountable.
        </h1>
        <p className={styles.subtitle}>
          OpenTap makes it easy to report broken or unsafe public drinking fountains
          and holds cities accountable for fixing them. No app to download. No account needed.
        </p>
        <div className={styles.actions}>
          <Link href="/map" className={styles.primaryBtn}>
            Explore the map
          </Link>
          <Link href="/report" className={styles.secondaryBtn}>
            Report a fountain
          </Link>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.fountain_count}</span>
            <span className={styles.statLabel}>Fountains mapped</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.city_count}</span>
            <span className={styles.statLabel}>Cities</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>60s</span>
            <span className={styles.statLabel}>To report</span>
          </div>
        </div>
      </div>
      <footer className={styles.footer}>
        <p>No ads. No paid features. No data sales. Just clean water.</p>
      </footer>
    </div>
  );
}