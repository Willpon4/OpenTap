import styles from './about.module.css';

export const metadata = {
  title: 'About — OpenTap',
  description: 'OpenTap is a free, open-source platform for reporting and fixing broken public water fountains.',
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1>Clean water access is a right, not a privilege.</h1>
          <p>
            OpenTap is a free, open-source platform that makes it easy for anyone to report
            broken public water fountains — and holds cities accountable for fixing them.
          </p>
        </div>

        <section className={styles.section}>
          <h2>The problem</h2>
          <p>
            Public drinking water fountains across the country are broken, disappearing, and
            in some cases delivering water contaminated with lead. There is no federal requirement
            to test or maintain them, no unified way for citizens to report problems, and no
            accountability mechanism to ensure repairs happen.
          </p>
          <p>
            The people who suffer most are those who can least afford bottled water: people
            experiencing homelessness, children in underfunded schools, outdoor workers, and
            low-income communities.
          </p>
        </section>

        <section className={styles.section}>
          <h2>How OpenTap works</h2>
          <div className={styles.steps}>
            <div className={styles.stepCard}>
              <div className={styles.stepNum}>1</div>
              <h3>Report</h3>
              <p>See a broken fountain? Report it in under 60 seconds via our website, text message, or by scanning a QR code.</p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNum}>2</div>
              <h3>Track</h3>
              <p>Every report appears on the public map and is tracked through a lifecycle: reported, acknowledged, in progress, resolved.</p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNum}>3</div>
              <h3>Fix</h3>
              <p>Cities get free dashboards to manage repairs. If they don&apos;t respond, the report escalates and becomes visible to journalists and council members.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>What makes us different</h2>
          <p>
            Every fountain-finder app before us focused on discovery: &ldquo;find a fountain near you.&rdquo;
            OpenTap focuses on accountability: &ldquo;this fountain is broken, who is responsible,
            and how long has it been broken?&rdquo; Discovery apps die when data goes stale.
            Accountability platforms stay alive because there&apos;s always something to report
            and always pressure to fix it.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Our commitments</h2>
          <div className={styles.commitments}>
            <div className={styles.commitment}>
              <h3>Free forever</h3>
              <p>No ads, no paid features, no premium tiers. OpenTap is a public good, not a product.</p>
            </div>
            <div className={styles.commitment}>
              <h3>Open source</h3>
              <p>All code is public on GitHub under the MIT license. Anyone can contribute, audit, or fork it.</p>
            </div>
            <div className={styles.commitment}>
              <h3>Open data</h3>
              <p>All fountain and report data is available via our public API. Journalists, researchers, and developers can build on it.</p>
            </div>
            <div className={styles.commitment}>
              <h3>Your data is yours</h3>
              <p>We never sell data, share it with advertisers, or monetize user information in any way.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Get involved</h2>
          <p>
            OpenTap is built by volunteers who believe clean water access shouldn&apos;t depend
            on your zip code. Whether you&apos;re a developer, designer, civic tech advocate, or
            just someone who cares — there&apos;s a way to help.
          </p>
          <div className={styles.links}>
            <a href="https://github.com" className={styles.linkCard} target="_blank" rel="noopener noreferrer">
              <h3>Contribute code</h3>
              <p>Check out our GitHub repo for open issues and contribution guidelines.</p>
            </a>
            <a href="/report" className={styles.linkCard}>
              <h3>Report a fountain</h3>
              <p>The simplest way to help: report a broken fountain in your neighborhood.</p>
            </a>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>
            The ultimate measure of success: did a real person get access to clean drinking
            water that they would not have had without this platform?
          </p>
          <p style={{ marginTop: '12px' }}>
            <a href="/privacy" style={{ fontSize: '0.82rem', color: '#a8a7a2' }}>Privacy policy & terms of use</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
