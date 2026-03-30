'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8 7 4 10 4 14a8 8 0 0 0 16 0c0-4-4-7-8-12z" />
          </svg>
          <span>OpenTap</span>
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <Link href="/map" className={styles.navLink} onClick={() => setMenuOpen(false)}>Map</Link>
          <Link href="/reports" className={styles.navLink} onClick={() => setMenuOpen(false)}>Feed</Link>
          <Link href="/about" className={styles.navLink} onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="/report" className={styles.reportBtn} onClick={() => setMenuOpen(false)}>
            Report a problem
          </Link>
        </nav>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.menuIcon} ${menuOpen ? styles.menuIconOpen : ''}`} />
        </button>
      </div>
    </header>
  );
}
