import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bnb-site-footer">
      <div className="bnb-footer-container">
        <div className="bnb-footer-main">
          <div>
            <Link
              href="/home"
              className="bnb-footer-brand"
              aria-label="Business Nuggets home"
            >
              <span className="bnb-footer-mark">B</span>

              <span>
                <strong>BUSINESS NUGGETS</strong>
                <em>from the Bible</em>
              </span>
            </Link>

            <p className="bnb-footer-copy">
              Biblical principles. Practical wisdom. Purposeful enterprise.
            </p>
          </div>

          <nav className="bnb-footer-links" aria-label="Footer navigation">
            <Link href="/home">Home</Link>
            <Link href="/library">Library</Link>
            <Link href="/#approach">Our Approach</Link>
            <Link href="/library?tab=Topics+Index">Explore</Link>
            <Link href="/terms-of-use">Terms of Use</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
          </nav>
        </div>

        <div className="bnb-footer-bottom">
          <span>© 2026 Business Nuggets from the Bible. All rights reserved.</span>
          <span>Faith • Wisdom • Enterprise</span>
        </div>
      </div>
    </footer>
  );
}
