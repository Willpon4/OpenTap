import styles from './privacy.module.css';

export const metadata = {
  title: 'Privacy & Terms — OpenTap',
  description: 'How OpenTap handles your data and terms of use.',
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>Privacy policy & terms of use</h1>
        <p className={styles.updated}>Last updated: March 30, 2026</p>

        <section className={styles.section}>
          <h2>The short version</h2>
          <p>
            OpenTap is free, open source, and funded out of pocket. We don&apos;t run ads.
            We don&apos;t sell data. We don&apos;t track you across the web. We collect the
            minimum information needed to make the platform work, and nothing more.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What we collect</h2>

          <h3>When you submit a report</h3>
          <p>
            We collect the location of the fountain (GPS coordinates or a geocoded address),
            the issue type and severity you select, any description you write, and optionally
            a photo. If you choose to provide your email or phone number for status updates,
            that information is encrypted before it is stored in our database. We cannot read
            it in plain text.
          </p>

          <h3>Contact information</h3>
          <p>
            Providing your email or phone number is completely optional. If you do provide it,
            we use it only to notify you when your report&apos;s status changes. We never share
            it with third parties, advertisers, or city staff. It is encrypted at rest using
            AES-128 encryption.
          </p>

          <h3>IP addresses</h3>
          <p>
            We log IP addresses to prevent abuse of the platform, such as spam reports or
            automated submissions. We do not use IP addresses to identify you personally.
            IP logs are not shared with anyone.
          </p>

          <h3>What we do NOT collect</h3>
          <p>
            We do not use cookies for tracking. We do not use analytics services that track
            you across websites. We do not collect your name, age, gender, or any demographic
            information. We do not require an account to submit a report.
          </p>
        </section>

        <section className={styles.section}>
          <h2>How we use your data</h2>
          <p>
            Report data (location, issue type, severity, description, photos) is public. It
            appears on the OpenTap map and feed so that citizens and city staff can see what
            has been reported. This public visibility is the core of how OpenTap creates
            accountability for repairs.
          </p>
          <p>
            Your contact information, if provided, is never made public. It is used only to
            send you notifications about your report.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Open data</h2>
          <p>
            All fountain and report data (excluding contact information) is available through
            our public API. This means journalists, researchers, advocacy organizations, and
            developers can access and build on the data. This is intentional — open data
            drives accountability and better outcomes for public water access.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Third-party services</h2>
          <p>
            OpenTap uses the following third-party services to operate:
          </p>
          <p>
            Vercel (frontend hosting), Railway (backend hosting), Neon (database hosting),
            and OpenStreetMap (map tiles and geocoding). Each of these services has its own
            privacy policy. We do not send your personal data to any of these services beyond
            what is necessary to operate the platform.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Terms of use</h2>

          <h3>What OpenTap is</h3>
          <p>
            OpenTap is a civic reporting tool that helps citizens report problems with public
            drinking water fountains. It is a community project, not a government service.
          </p>

          <h3>Data accuracy</h3>
          <p>
            OpenTap provides information as-is. We do not guarantee the accuracy of fountain
            locations, water quality information, or report statuses. Fountain data comes from
            a combination of public sources (OpenStreetMap), city data where available, and
            citizen reports. Any of these may contain errors.
          </p>
          <p>
            OpenTap is not a substitute for official water quality testing. If you have concerns
            about the safety of your drinking water, contact your local water utility or health
            department.
          </p>

          <h3>Report accuracy</h3>
          <p>
            Reports are submitted by members of the public and are not verified by OpenTap
            before appearing on the platform. We do not guarantee that every report is
            accurate. City staff and community members can help verify reports through the
            platform.
          </p>

          <h3>No warranties</h3>
          <p>
            OpenTap is provided &ldquo