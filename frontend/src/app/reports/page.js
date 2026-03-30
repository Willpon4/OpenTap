'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './reports.module.css';

const STATUS_LABELS = {
  reported: 'Reported', acknowledged: 'Acknowledged',
  in_progress: 'In progress', resolved: 'Resolved', stale: 'Stale',
};
const ISSUE_LABELS = {
  broken: 'Broken', pressure: 'Low pressure', dirty: 'Dirty',
  smell: 'Bad taste/smell', missing: 'Missing', inaccessible: 'Inaccessible',
};

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');
  const [citySearch, setCitySearch] = useState('');
  const [cityInput, setCityInput] = useState('');

  useEffect(() => {
    loadReports();
  }, [filter, issueFilter, citySearch]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (issueFilter !== 'all') params.issue_type = issueFilter;
      if (citySearch) params.city = citySearch;
      const data = await api.getReports(params);
      setReports(data);
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = (e) => {
    e.preventDefault();
    setCitySearch(cityInput);
  };

  const clearCity = () => {
    setCityInput('');
    setCitySearch('');
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Feed</h1>
            <p>{reports.length} report{reports.length !== 1 ? 's' : ''}{citySearch ? ` in "${citySearch}"` : ''}</p>
          </div>
          <Link href="/report" className={styles.reportBtn}>Report a problem</Link>
        </div>

        <form onSubmit={handleCitySearch} className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by city (e.g. Harrisonburg, Washington)..."
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>Search</button>
          {citySearch && (
            <button type="button" onClick={clearCity} className={styles.clearBtn}>Clear</button>
          )}
        </form>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            {['all', 'reported', 'acknowledged', 'in_progress', 'resolved', 'stale'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Issue</span>
            {['all', 'broken', 'pressure', 'dirty', 'smell', 'missing', 'inaccessible'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${issueFilter === f ? styles.filterActive : ''}`}
                onClick={() => setIssueFilter(f)}
              >
                {f === 'all' ? 'All' : ISSUE_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className={styles.empty}>
            <p>No reports found{citySearch ? ` in "${citySearch}"` : ''}.</p>
            <Link href="/report">Be the first to report a fountain issue.</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {reports.map(report => (
              <Link href={`/report/${report.id}`} key={report.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={`status-badge status-${report.status}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                  {report.severity === 'high' && (
                    <span className={styles.highSev}>High severity</span>
                  )}
                  <span className={styles.time}>{timeAgo(report.reported_at)}</span>
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.issueType}>{ISSUE_LABELS[report.issue_type] || report.issue_type}</span>
                  <span className={styles.coords}>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.channel}>via {report.reporter_channel}</span>
                  <span className={styles.viewLink}>View details</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}