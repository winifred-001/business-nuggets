import Link from "next/link";

import styles from "@/app/visitor-home.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerInner}>
          <div>
            <Link href="/" className={styles.brand} aria-label="Business Nuggets home">
              <div className={styles.brandmark}>B</div>
              <div className={styles.brandtext}>
                <strong>BUSINESS NUGGETS</strong>
                <em>from the Bible</em>
              </div>
            </Link>
            <p>Biblical principles. Practical wisdom. Purposeful enterprise.</p>
          </div>

          <nav className={styles.footerLinks} aria-label="Footer navigation">
            <Link href="/">Home</Link>
            <Link href="/library">Library</Link>
            <Link href="/#approach">Our Approach</Link>
            <Link href="/library?tab=Topics+Index">Explore</Link>
          </nav>
        </div>

        <div className={styles.bottom}>
          <span>© {year} Business Nuggets from the Bible. All rights reserved.</span>
          <span>Faith • Wisdom • Enterprise</span>
        </div>
      </div>
    </footer>
  );
}
