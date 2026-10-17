import { db } from "../prisma/db";

const nuggets = [
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
    status: "published",
    featured: false,
    audioUrl: null,
    publishedAt: "2026-09-02T00:00:00.000Z",
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
    status: "published",
    featured: false,
    audioUrl: null,
    publishedAt: "2026-09-03T00:00:00.000Z",
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
    status: "published",
    featured: false,
    audioUrl: null,
    publishedAt: "2026-09-04T00:00:00.000Z",
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
    status: "published",
    featured: false,
    audioUrl: null,
    publishedAt: "2026-09-05T00:00:00.000Z",
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
    status: "published",
    featured: false,
    audioUrl: null,
    publishedAt: "2026-09-06T00:00:00.000Z",
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
    status: "published",
    featured: false,
    audioUrl: null,
    publishedAt: "2026-09-07T00:00:00.000Z",
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
    status: "published",
    featured: false,
    audioUrl: null,
    publishedAt: "2026-09-08T00:00:00.000Z",
  },

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
    status: "draft",
    featured: false,
    audioUrl: null,
    publishedAt: null,
  },
];

async function seedNuggets() {
  console.log("Starting Nugget migration...");

  for (const nugget of nuggets) {
    const existing = await db.orm.public.Nugget
      .where({ id: nugget.id })
      .first();

    if (existing) {
      console.log(`Skipped ${nugget.id} - already exists`);
      continue;
    }

    await db.orm.public.Nugget.create(nugget);

    console.log(`Created ${nugget.id} - ${nugget.title}`);
  }

  console.log("Nugget migration complete.");
}

seedNuggets().catch((error) => {
  console.error("Nugget migration failed:", error);
  process.exit(1);
});