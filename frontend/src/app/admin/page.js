'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import styles from './admin.module.css';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('opentap_token');
    const name = localStorage.getItem('opentap_name');
    if (token) {
      setAuthed(true);
      setUserName(name || '');
      loadData();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const result = await api.login(loginForm.email, loginForm.password);
      localStorage.setItem('opentap_token', result.access_token);
      localStorage.setItem('opentap_name', result.name);
      setAuthed(true);
      setUserName(result.name);
      loadData();
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password');
    }
  };

  const loadData = async () => {
    try {
      const [statsData, reportsData] = await Promise.all([
        api.getDashboard(),
        api.getAdminReports({ limit: 50 }),
      ]);
      setStats(statsData);
      setReports(reportsData);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      await api.updateReportStatus(reportId, newStatus);
      loadData();
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('opentap_token');
    localStorage.removeItem('opentap_name');
    setAuthed(false);
    setStats(null);
    setReports([]);
  };

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  const statusActions = {
    reported: ['acknowledged'],
    acknowledged: ['in_progress', 'resolved'],
    in_progress: ['resolved'],
    stale: ['acknowledged', 'resolved'],
  };

  const statusLabels = {
    reported: 'Reported', acknowledged: 'Acknowledged',
    in_progress: 'In progress', resolved: 'Resolved', stale: 'Stale',
  };

  const issueLabels = {
    broken: 'Broken', pressure: 'Low pressure', dirty: 'Dirty',
    smell: 'Bad taste/smell', missing: 'Missing', inaccessible: 'Inaccessible',
  };

  // LOGIN SCREEN
  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <form className={styles.loginCard} onSubmit={handleLogin}>
          <h1>Admin login</h1>
          <p>Sign in to manage reports for your city.</p>
          {loginError && <div className={styles.error}>{loginError}</div>}
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email" required autoFocus
              value={loginForm.email}
              onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password" required
              value={loginForm.password}
              onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <button type="submit" className={styles.loginBtn}>Sign in</button>
        </form>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className={styles.dashboard}>
      <div className={styles.dashHeader}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {userName}</p>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>Sign out</button>
      </div>

      {stats && (
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.total_fountains.toLocaleString()}</span>
            <span className={styles.statLabel}>Total fountains</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.open_reports}</span>
            <span className={styles.statLabel}>Open reports</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.resolved_reports}</span>
            <span className={styles.statLabel}>Resolved</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.stale_reports}</span>
            <span className={styles.statLabel}>Stale</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.avg_resolution_hours ? `${Math.round(stats.avg_resolution_hours)}h` : '—'}</span>
            <span className={styles.statLabel}>Avg resolution</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.reports_this_month}</span>
            <span className={styles.statLabel}>This month</span>
          </div>
        </div>
      )}

      <div className={styles.reportsSection}>
        <div className={styles.reportsHeader}>
          <h2>Reports</h2>
          <div className={styles.filters}>
            {['all', 'reported', 'acknowledged', 'in_progress', 'stale', 'resolved'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : statusLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className={styles.empty}>No reports found.</div>
        ) : (
          <div className={styles.reportList}>
            {filteredReports.map(report => (
              <div key={report.id} className={styles.reportRow}>
                <div className={styles.reportMain}>
                  <span className={`status-badge status-${report.status}`}>
                    {statusLabels[report.status]}
                  </span>
                  <span className={styles.reportType}>{issueLabels[report.issue_type] || report.issue_type}</span>
                  {report.severity === 'high' && (
                    <span className={styles.highSev}>High severity</span>
                  )}
                  <span className={styles.reportDate}>
                    {new Date(report.reported_at).toLocaleDateString()}
                  </span>
                  <span className={styles.reportChannel}>{report.reporter_channel}</span>
                </div>
                {statusActions[report.status] && (
                  <div className={styles.reportActions}>
                    {statusActions[report.status].map(action => (
                      <button
                        key={action}
                        className={styles.actionBtn}
                        onClick={() => handleStatusUpdate(report.id, action)}
                      >
                        {statusLabels[action]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
