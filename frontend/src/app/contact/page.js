import styles from './contact.module.css';

export const metadata = {
  title: 'Contact — OpenTap',
  description: 'Get in touch with the OpenTap team.',
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>Get in touch</h1>
        <p className={styles.subtitle}>
          Whether you&apos;re a city official, a civic tech volunteer, a journalist, or
          just someone who cares about clean water access — we&apos;d love to hear from you.
        </p>

        <div className={styles.cards}>
          <div className={styles.card}>
            <h2>City officials & government</h2>
            <p>
              Want to see what OpenTap can do for your city? We offer free dashboards
              for city staff to manage fountain reports. No cost, no contracts, no strings attached.
            </p>
            <a href="mailto:ponczawm@dukes.jmu.edu" className={styles.cardLink}>
              ponczawm@dukes.jmu.edu
            </a>
          </div>

          <div className={styles.card}>
            <h2>General inquiries</h2>
            <p>
              Questions, feedback, ideas, or just want to say hello. We read every message.
            </p>
            <a href="mailto:ponczawm@dukes.jmu.edu" className={styles.cardLink}>
              ponczawm@dukes.jmu.edu
            </a>
          </div>

          <div className={styles.card}>
            <h2>Developers & contributors</h2>
            <p>
              OpenTap is open source under the MIT license. Check out the code,
              open an issue, or submit a pull request.
            </p>
            <a href="https://github.com/Willpon4/OpenTap" className={styles.cardLink} target="_blank" rel="noopener noreferrer">
              GitHub repository
            </a>
          </div>

          <div className={styles.card}>
            <h2>Report a problem</h2>
            <p>
              See a broken fountain? You don&apos;t need to contact us — report it
              directly and it&apos;ll appear on the map immediately.
            </p>
            <a href="/report" className={styles.cardLink}>
              Submit a report
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}