import type {
  BibleSection,
  Collection,
  Nugget,
} from "../types/nugget";

export type { Nugget } from "../types/nugget";

// This is the single shared list of nuggets.
// Dates and challenge assignments are sample values.
export const nuggets: Nugget[] = [
  {
    id: "nugget-14",
    slug: "law-of-just-balances",
    number: 14,
    title: "The Law of Just Balances in Corporate Negotiation",
    topic: "Integrity & Character",
    tag: "Integrity & Character",
    scriptureRef: "Proverbs 11:1",
    scriptureText:
      "A false balance is an abomination to the Lord, but a just weight is his delight.",
    image: "/images/nuggetCard.png",
    keyPrinciple:
      "In classical Near Eastern commerce, merchants used physical balances to determine price. A dishonest merchant used double standards—heavier weights for buying, lighter weights for selling. Today, this manifests as asymmetric information disclosure, hidden corporate traps, and misleading contract phrasing. The Principle of Just Balances asserts that absolute pricing and negotiation transparency is not a moral concession; it is a foundational framework for sustainable marketplace dominion.",
    marketplaceApplication:
      "Establish negotiations where both parties can audit the metrics of exchange. When you draft standard vendor agreements, ensure both sides operate reciprocally. Over-disclosing hidden risks upfront establishes a premium brand of character that commands long-term respect and client loyalty.",
    practicalActionPlan: [
      "Audit your current contracts for asymmetric terms.",
      "Standardize disclosure clauses across vendor agreements.",
      "Train negotiation leads on transparent pricing frameworks.",
    ],
    duration: "06:42",
    isGold: false,
    book: "Proverbs",
    bibleSection: "Wisdom Literature",
    challenges: ["Negotiation & Contracts"],
    publishedAt: "2026-09-01",
  },

  {
    id: "nugget-15",
    slug: "hazard-of-swift-assent",
    number: 15,
    title: "The Hazard of Swift Assent in Partnerships",
    topic: "Integrity & Character",
    tag: "Stewardship",
    scriptureRef: "Proverbs 6:1-5",
    scriptureText:
      "My son, if you have put up security for your neighbor... deliver yourself.",
    image: "/images/nuggetCard.png",
    keyPrinciple:
      "Quick commitments made under social pressure often bypass proper due diligence.",
    marketplaceApplication:
      "Build a mandatory cooling-off period into partnership and guarantee agreements.",
    practicalActionPlan: [
      "Introduce a 48-hour review window before signing.",
      "Require a second signatory on any guarantee.",
    ],
    duration: "05:10",
    isGold: false,
    book: "Proverbs",
    bibleSection: "Wisdom Literature",
    challenges: ["Strategic Decisions"],
    publishedAt: "2026-09-02",
  },

  {
    id: "nugget-16",
    slug: "integrity-premium",
    number: 16,
    title: "The Integrity Premium: Upholding Product Standards",
    topic: "Integrity & Character",
    tag: "Character",
    scriptureRef: "Leviticus 19:35-36",
    scriptureText:
      "You shall do no wrong in judgment, in measures of length, weight, or quantity.",
    image: "/images/nuggetCard.png",
    keyPrinciple:
      "Consistent product standards, even when unobserved, compound into brand equity.",
    marketplaceApplication:
      "Resist the temptation to quietly downgrade quality when margins tighten.",
    practicalActionPlan: [
      "Set a non-negotiable quality floor documented company-wide.",
      "Audit output quarterly against that floor.",
    ],
    duration: "07:20",
    isGold: true,
    book: "Leviticus",
    bibleSection: "The Pentateuch",
    challenges: ["Negotiation & Contracts"],
    publishedAt: "2026-09-03",
  },

  {
    id: "nugget-17",
    slug: "solomon-audit",
    number: 17,
    title: "The Solomon Audit: Evaluating Partnerships",
    topic: "Strategy & Planning",
    tag: "Strategy",
    scriptureRef: "1 Kings 3:16-28",
    scriptureText:
      "Give the living child to her, and by no means kill it; she is its mother.",
    image: "/images/nuggetCard.png",
    keyPrinciple:
      "Discernment separates true commitment from convenient claims.",
    marketplaceApplication:
      "Design partnership vetting that tests real skin in the game.",
    practicalActionPlan: [
      "Add a discernment stage to due diligence.",
      "Weight commitment signals over stated intent.",
    ],
    duration: "08:05",
    isGold: false,
    book: "1 Kings",
    bibleSection: "History & Leadership",
    challenges: ["Strategic Decisions"],
    publishedAt: "2026-09-04",
  },

  {
    id: "nugget-2",
    slug: "josephs-seven-year-reserve",
    number: 2,
    title:
      "The Joseph Storage Blueprint: Seven Years of Strategic Reserves",
    topic: "Money & Stewardship",
    tag: "Strategic Planning",
    scriptureRef: "Genesis 41:34-36",
    scriptureText:
      "And let them gather all the food of those good years that are coming, and store up grain under the authority of Pharaoh, and let food be as a reserve for the land against the seven years of famine.",
    image: "/images/nuggetCard.png",
    keyPrinciple:
      "Faced with a macroeconomic projection of absolute volatility—seven years of extreme harvest followed by seven years of total collapse—Joseph does not panic. He proposes a rigorous national capital preservation program. He mandates a 20% flat tax on the harvest surplus during the bounty years to build a strategic physical reserve.",
    marketplaceApplication:
      'When your enterprise is swimming in heavy liquidity, do not raise your burn rate proportionally. The temptation during "market abundance" is to hire aggressively and acquire unnecessary space. True stewards build a dedicated liquidity vault. Keep your capital reserves in high-grade assets to absorb dry cycles without defaulting on vendor trust or resorting to panic debt.',
    practicalActionPlan: [
      'Establish an "Abundance Vault"—a separate account holding 6 months of absolute operational overhead.',
      "During profitable quarters, automatically route 15% of EBITDA directly into this reserve.",
      "Avoid scaling fixed costs until the reserve targets are fully actualized.",
    ],
    duration: "08:24",
    isGold: false,
    book: "Genesis",
    bibleSection: "The Pentateuch",
    challenges: ["Money & Cashflow"],
    publishedAt: "2026-09-05",
  },

  {
    id: "nugget-18",
    slug: "delegation-infrastructure",
    number: 18,
    title: "Delegation Infrastructure & Sovereign Accountability",
    topic: "Leadership & Governance",
    tag: "Governance",
    scriptureRef: "Exodus 18:13-26",
    scriptureText:
      "Choose able men from all the people... and place such men over the people as officials.",
    image: "/images/nuggetCard.png",
    keyPrinciple:
      "Sustainable leadership distributes judgment, not just tasks.",
    marketplaceApplication:
      "Build a tiered escalation structure before you hit burnout.",
    practicalActionPlan: [
      "Map decisions that must stay with you vs. delegate-safe ones.",
      "Appoint tier leads with clear authority limits.",
    ],
    duration: "06:55",
    isGold: false,
    book: "Exodus",
    bibleSection: "The Pentateuch",
    challenges: ["Managing People"],
    publishedAt: "2026-09-06",
  },

  {
    id: "nugget-19",
    slug: "nehemiahs-architectural-integrity",
    number: 19,
    title: "Nehemiah's Architectural Integrity",
    topic: "Leadership & Governance",
    tag: "Governance",
    scriptureRef: "Nehemiah 4:1-6",
    scriptureText:
      "So we built the wall... for the people had a mind to work.",
    image: "/images/nuggetCard.png",
    keyPrinciple:
      "Vision under opposition still requires visible structural progress.",
    marketplaceApplication:
      "Communicate milestones publicly to sustain morale under pressure.",
    practicalActionPlan: [
      "Publish a visible progress tracker to your team.",
      "Address opposition directly instead of ignoring it.",
    ],
    duration: "05:47",
    isGold: false,
    book: "Nehemiah",
    bibleSection: "History & Leadership",
    challenges: ["Starting a Business", "Managing People"],
    publishedAt: "2026-09-07",
  },

  {
    id: "nugget-20",
    slug: "negotiation-integrity-genesis-23",
    number: 20,
    title: "Negotiation Integrity: Genesis 23 Land Purchase",
    topic: "Integrity & Character",
    tag: "Negotiation",
    scriptureRef: "Genesis 23",
    scriptureText:
      "Abraham weighed out for Ephron the silver... at the price current among the merchants.",
    image: "/images/nuggetCard.png",
    keyPrinciple:
      "Abraham's insistence on paying full price for real estate to establish long-term marketplace credibility.",
    marketplaceApplication:
      "Overpaying strategically can be an investment in reputational capital.",
    practicalActionPlan: [
      "Identify deals where fair-market overpayment buys long-term trust.",
      "Document the rationale so it isn't repeated as a norm.",
    ],
    duration: "04:58",
    isGold: false,
    book: "Genesis",
    bibleSection: "The Pentateuch",
    challenges: ["Negotiation & Contracts"],
    publishedAt: "2026-09-08",
  },

  // This title existed in the other nugget list.
  // Its full article text has not been supplied yet.
  {
    id: "nugget-21",
    slug: "masters-return-asset-allocation",
    number: 21,
    title: "The Master's Return: Asset Allocation Under Pressure",
    topic: "Money & Stewardship",
    tag: "Stewardship",
    scriptureRef: "Matthew 25:9",
    scriptureText: "",
    image: "/images/nuggetCard.png",
    keyPrinciple: "",
    marketplaceApplication: "",
    practicalActionPlan: [],
    duration: "00:00",
    isGold: false,
    book: "Matthew",
    bibleSection: "New Testament",
    challenges: ["Money & Cashflow"],
    publishedAt: "2026-09-09",
  },
];

// Create the topic list from the articles.
export const topics = [
  ...new Set(nuggets.map((nugget) => nugget.topic)),
];

// Create the challenge list from the articles.
export const challenges = [
  ...new Set(nuggets.flatMap((nugget) => nugget.challenges)),
];

// Create the Bible-book list from the articles.
export const books = [...new Set(nuggets.map((n) => n.book))].sort(
  (a, b) => a.localeCompare(b, "en", { numeric: true }),
);

export const bibleSections: BibleSection[] = [
  "The Pentateuch",
  "History & Leadership",
  "Wisdom Literature",
  "The Prophets",
  "New Testament",
];

// Turn a name into a name suitable for a page address.
// Example: "Money & Stewardship" becomes "money-stewardship".
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// These connect older article addresses to the current articles.
const aliases: Record<string, string> = {
  "hazard-of-swift-ascent": "hazard-of-swift-assent",
  "hazard-of-early-suretyship": "hazard-of-swift-assent",
  "integrity-premium-product-standards": "integrity-premium",
  "solomon-audit-costly-decisions": "solomon-audit",
  "joseph-storage-infrastructure": "josephs-seven-year-reserve",
  "joseph-storage-blueprint": "josephs-seven-year-reserve",
  "delegation-infrastructure-architecture":
    "delegation-infrastructure",
  "law-of-just-balances-corporate-negotiation":
    "law-of-just-balances",
};

// Find one article using its slug, ID, or number.
export function getNuggetBySlug(value: string) {
  const slug = aliases[value] ?? value;

  return nuggets.find(
    (nugget) =>
      nugget.slug === slug ||
      nugget.id === value ||
      String(nugget.number) === value,
  );
}

// Find all articles belonging to a topic.
export function getNuggetsByTopic(topic: string) {
  return nuggets.filter((nugget) => nugget.topic === topic);
}

// Find articles using a list of their slugs.
export function getNuggetsBySlugs(slugs: string[]) {
  return slugs.flatMap((slug) => {
    const nugget = getNuggetBySlug(slug);
    return nugget ? [nugget] : [];
  });
}

// Sample collections group articles from the same shared list.
export const collections: Collection[] = [
  {
    slug: "starting-your-business-gods-way",
    title: "Starting Your Business God's Way",
    description:
      "A sample pathway through planning, delegation, integrity, and building under pressure.",
    nuggetSlugs: [
      "josephs-seven-year-reserve",
      "delegation-infrastructure",
      "law-of-just-balances",
      "nehemiahs-architectural-integrity",
    ],
  },
  {
    slug: "capital-stewardship-debt",
    title: "Capital Stewardship & Debt",
    description:
      "Sample teachings on reserves and careful commitments.",
    nuggetSlugs: [
      "josephs-seven-year-reserve",
      "hazard-of-swift-assent",
    ],
  },
  {
    slug: "integrity-as-a-premium-brand",
    title: "Integrity As A Premium Brand",
    description:
      "A sample pathway through transparency, standards, and fair negotiation.",
    nuggetSlugs: [
      "law-of-just-balances",
      "integrity-premium",
      "negotiation-integrity-genesis-23",
    ],
  },
];

export function getCollectionBySlug(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

// Convert a duration into seconds.
// Example: "06:42" becomes 402.
export function durationSeconds(duration: string) {
  const [minutes, seconds] = duration.split(":").map(Number);
  return minutes * 60 + seconds;
}

// The choices someone can use to search or filter.
export type CatalogFilters = {
  query?: string;
  topics?: string[];
  sections?: string[];
  challenge?: string;
  book?: string;
  tag?: string;
  sort?: string;
};

// Make searches ignore capital letters and punctuation.
function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Search, filter, and arrange articles.
// This leaves the original shared list unchanged.
export function filterNuggets(
  filters: CatalogFilters = {},
  source: Nugget[] = nuggets,
) {
  const words = normalize(filters.query ?? "")
    .split(/\s+/)
    .filter(Boolean);

  const results = source.filter((nugget) => {
    const searchableText = normalize(
      [
        nugget.title,
        nugget.topic,
        nugget.tag,
        nugget.scriptureRef,
        nugget.scriptureText,
        nugget.keyPrinciple,
        nugget.marketplaceApplication,
        ...nugget.practicalActionPlan,
        ...nugget.challenges,
      ].join(" "),
    );

    const matchesSearch = words.every((word) =>
      searchableText.includes(word),
    );

    const matchesTopic =
      !filters.topics?.length ||
      filters.topics.includes(nugget.topic);

    const matchesSection =
      !filters.sections?.length ||
      filters.sections.includes(nugget.bibleSection);

    const matchesChallenge =
      !filters.challenge ||
      nugget.challenges.includes(filters.challenge);

    const matchesBook =
      !filters.book || nugget.book === filters.book;

    const matchesTag =
      !filters.tag || nugget.tag === filters.tag;

    return (
      matchesSearch &&
      matchesTopic &&
      matchesSection &&
      matchesChallenge &&
      matchesBook &&
      matchesTag
    );
  });

  return results.sort((first, second) => {
    if (filters.sort === "az") {
      return first.title.localeCompare(second.title);
    }

    if (filters.sort === "oldest") {
      return first.publishedAt.localeCompare(second.publishedAt);
    }

    return second.publishedAt.localeCompare(first.publishedAt);
  });
}