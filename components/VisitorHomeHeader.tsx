"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "@/app/visitor-home.module.css";

export default function VisitorHomeHeader() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <div className={styles.topline} />
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.nav}`}>
          <Link href="/" className={styles.brand} aria-label="Business Nuggets home" onClick={closeMenu}>
            <div className={styles.brandmark}>B</div>
            <div className={styles.brandtext}>
              <strong>BUSINESS NUGGETS</strong>
              <em>from the Bible</em>
            </div>
          </Link>

          <nav className={`${styles.navlinks} ${open ? styles.navlinksOpen : ""}`} aria-label="Visitor navigation">
            <Link href="/" className={styles.active} onClick={closeMenu}>Home</Link>
            <Link href="/library" onClick={closeMenu}>The Library</Link>
            <a href="#approach" onClick={closeMenu}>Our Approach</a>
            <Link href="/library?tab=Topics+Index" onClick={closeMenu}>Explore Topics</Link>
          </nav>

          <div className={styles.navright}>
            <Link href="/library" className={`${styles.login} ${styles.muted}`}>Explore</Link>
            <Link href="/library" className={`${styles.btn} ${styles.signup}`}>Start Reading →</Link>
            <button
              type="button"
              className={styles.menu}
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
