import Link from "next/link";
import { DM_Sans, Manrope, Playfair_Display } from "next/font/google";

import VisitorOnly from "@/components/VisitorOnly";
import VisitorHomeHeader from "@/components/VisitorHomeHeader";
import VisitorHomeLibrary from "@/components/VisitorHomeLibrary";
import { getPublishedNuggets } from "@/lib/nuggets-api";
import type { Nugget } from "@/types/nugget";
import styles from "./visitor-home.module.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--visitor-dm",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--visitor-manrope",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--visitor-playfair",
});

const sampleNuggets = [
  {
    slug: "integrity-is-a-leadership-advantage",
    number: 1,
    title: "Integrity Is a Leadership Advantage",
    topic: "Leadership & Integrity",
    tag: "leadership",
    scriptureRef: "PROVERBS 11:3",
    keyPrinciple:
      "Trust is an asset no balance sheet can fully capture. Consider how honest decisions shape sustainable influence.",
    marketplaceApplication: "",
  },
  {
    slug: "count-the-cost-before-you-build",
    number: 2,
    title: "Count the Cost Before You Build",
    topic: "Stewardship & Finance",
    tag: "finance",
    scriptureRef: "LUKE 14:28",
    keyPrinciple:
      "A compelling vision deserves a practical plan. Learn the value of preparing responsibly before committing resources.",
    marketplaceApplication: "",
  },
  {
    slug: "the-quiet-power-of-diligent-planning",
    number: 3,
    title: "The Quiet Power of Diligent Planning",
    topic: "Vision & Execution",
    tag: "strategy",
    scriptureRef: "PROVERBS 21:5",
    keyPrinciple:
      "Consistency, clarity and deliberate action often matter more than dramatic moves in building lasting enterprises.",
    marketplaceApplication: "",
  },
  {
    slug: "listen-before-you-lead",
    number: 4,
    title: "Listen Before You Lead",
    topic: "People & Leadership",
    tag: "leadership",
    scriptureRef: "JAMES 1:19",
    keyPrinciple:
      "Sound judgment starts with attention. Listening well is a disciplined leadership practice.",
    marketplaceApplication: "",
  },
  {
    slug: "build-with-patient-consistency",
    number: 5,
    title: "Build With Patient Consistency",
    topic: "Enterprise & Growth",
    tag: "growth",
    scriptureRef: "ECCLESIASTES 11:6",
    keyPrinciple:
      "Faithfulness in daily action invites a long-term perspective on effort, opportunity and uncertainty.",
    marketplaceApplication: "",
  },
  {
    slug: "understand-the-weight-of-debt",
    number: 6,
    title: "Understand the Weight of Debt",
    topic: "Finance & Responsibility",
    tag: "finance",
    scriptureRef: "PROVERBS 22:7",
    keyPrinciple:
      "Borrowing decisions carry responsibilities. Consider the cost of leverage and the importance of financial resilience.",
    marketplaceApplication: "",
  },
];

export default async function HomePage() {
  let nuggets: Nugget[] = [];

  try {
    nuggets = (await getPublishedNuggets()) as Nugget[];
  } catch (error) {
    console.error("Failed to load visitor homepage Nuggets:", error);
  }

  const homeNuggets =
    nuggets.length > 0
      ? nuggets.slice(0, 6).map((nugget) => ({
          slug: nugget.slug,
          number: nugget.number,
          title: nugget.title,
          topic: nugget.topic,
          tag: nugget.tag,
          scriptureRef: nugget.scriptureRef,
          keyPrinciple: nugget.keyPrinciple,
          marketplaceApplication: nugget.marketplaceApplication,
        }))
      : sampleNuggets;

  const year = new Date().getFullYear();

  return (
    <VisitorOnly>
      <div
        className={`${styles.page} ${dmSans.variable} ${manrope.variable} ${playfair.variable}`}
      >
        <VisitorHomeHeader />

        <main>
          <section className={styles.hero} id="home">
            <div className={`${styles.container} ${styles.heroInner}`}>
              <div>
                <div className={styles.eyebrow}>Faith. Wisdom. Enterprise.</div>

                <h1>
                  Ancient Wisdom.
                  <br />
                  <span>Extraordinary</span>
                  <br />
                  Business Insight.
                </h1>

                <p>
                  Discover timeless principles from Scripture to help you lead
                  with integrity, make wiser decisions, and build a business
                  rooted in purpose.
                </p>

                <div className={styles.actions}>
                  <a href="#library" className={styles.btn}>
                    Explore the Nuggets <span>↗</span>
                  </a>
                  <a href="#approach" className={`${styles.btn} ${styles.btnOutline}`}>
                    Discover Our Vision <span>↗</span>
                  </a>
                </div>

                <div className={styles.micro}>
                  <b>Scripture-rooted</b>
                  <i />
                  Practical insights
                  <i />
                  Everyday leadership
                </div>
              </div>

              <aside className={styles.verseCard}>
                <small>A SCRIPTURE TO LEAD BY</small>
                <div className={styles.quote}>
                  “Commit thy works unto the LORD, and thy thoughts shall be
                  established.”
                </div>
                <div className={styles.scripture}>PROVERBS 16:3 · KJV</div>
              </aside>
            </div>
          </section>

          <div className={styles.stats}>
            <div className={`${styles.container} ${styles.statsInner}`}>
              <div className={styles.stat}>
                <strong>Faith &amp; Enterprise</strong>
                <span>Where principles meet practice</span>
              </div>
              <div className={styles.stat}>
                <strong>Biblical Perspective</strong>
                <span>Rooted in timeless Scripture</span>
              </div>
              <div className={styles.stat}>
                <strong>Purposeful Growth</strong>
                <span>For leaders and entrepreneurs</span>
              </div>
            </div>
          </div>

          <section className={`${styles.section} ${styles.light}`} id="library">
            <div className={styles.container}>
              <div className={styles.sectiontop}>
                <div>
                  <div className={styles.kicker}>The wisdom library</div>
                  <h2>
                    Find insight for every
                    <br />
                    business decision.
                  </h2>
                </div>

                <p className={styles.intro}>
                  Explore thoughtful, practical reflections on leadership,
                  stewardship, diligence, money, vision and the demands of the
                  marketplace.
                </p>
              </div>

              <div id="discover">
                <VisitorHomeLibrary nuggets={homeNuggets} />
              </div>

              {nuggets.length === 0 && (
                <p className={styles.previewNote}>
                  Preview content: sample nuggets shown for design demonstration.
                  Connect to your published library for production.
                </p>
              )}
            </div>
          </section>

          <section className={styles.section} id="approach">
            <div className={`${styles.container} ${styles.features}`}>
              <div
                className={styles.photo}
                role="img"
                aria-label="Contemporary professional workspace"
              >
                <div />
              </div>

              <div>
                <div className={styles.kicker}>The philosophy behind the platform</div>
                <h2>
                  Build with conviction.
                  <br />
                  Lead with wisdom.
                </h2>
                <p>
                  Business Nuggets from the Bible brings the enduring wisdom of
                  Scripture into the real decisions entrepreneurs, professionals
                  and leaders face every day.
                </p>
                <ul>
                  <li>Understand the biblical principle in context</li>
                  <li>Translate wisdom into ethical business practice</li>
                  <li>Reflect, apply and grow with intention</li>
                </ul>
                <a href="#library" className={styles.btn}>
                  Begin Your Discovery ↗
                </a>
              </div>
            </div>
          </section>

          <section className={styles.banner}>
            <div className={`${styles.container} ${styles.bannerInner}`}>
              <div>
                <h2>Better decisions begin with wisdom.</h2>
                <p>
                  Explore timeless biblical insight for today&apos;s changing
                  marketplace.
                </p>
              </div>
              <a href="#library" className={styles.btn}>
                Explore the Library ↗
              </a>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <div className={styles.container}>
            <div className={styles.footerInner}>
              <div>
                <Link href="/" className={styles.brand}>
                  <div className={styles.brandmark}>B</div>
                  <div className={styles.brandtext}>
                    <strong>BUSINESS NUGGETS</strong>
                    <em>from the Bible</em>
                  </div>
                </Link>
                <p>Biblical principles. Practical wisdom. Purposeful enterprise.</p>
              </div>

              <div className={styles.footerLinks}>
                <Link href="/">Home</Link>
                <Link href="/library">Library</Link>
                <a href="#approach">Our Approach</a>
                <a href="#discover">Explore</a>
              </div>
            </div>

            <div className={styles.bottom}>
              <span>© {year} Business Nuggets from the Bible. All rights reserved.</span>
              <span>Faith • Wisdom • Enterprise</span>
            </div>
          </div>
        </footer>
      </div>
    </VisitorOnly>
  );
}
