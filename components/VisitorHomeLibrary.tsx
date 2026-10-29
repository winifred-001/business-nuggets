"use client";

import Link from "next/link";
import { nuggetExcerpt } from "@/lib/nugget-text";
import { useMemo, useState } from "react";
import styles from "@/app/visitor-home.module.css";

type HomeNugget = {
  slug: string;
  number: number;
  title: string;
  topic: string;
  tag: string;
  scriptureRef: string;
  keyPrinciple: string;
  marketplaceApplication: string;
};

const filters = [
  { label: "All Nuggets", value: "all" },
  { label: "Leadership", value: "leadership" },
  { label: "Money & Stewardship", value: "finance" },
  { label: "Strategy", value: "strategy" },
  { label: "Character", value: "character" },
  { label: "Growth", value: "growth" },
];

function matchesFilter(nugget: HomeNugget, filter: string) {
  if (filter === "all") return true;
  const haystack = `${nugget.topic} ${nugget.tag} ${nugget.title}`.toLowerCase();

  if (filter === "finance") {
    return /finance|money|steward|wealth|debt|invest/.test(haystack);
  }

  if (filter === "strategy") {
    return /strategy|planning|vision|decision|execution/.test(haystack);
  }

  if (filter === "character") {
    return /character|integrity|trust|honest|ethic/.test(haystack);
  }

  if (filter === "growth") {
    return /growth|enterprise|entrepreneur|innovation|diligence/.test(haystack);
  }

  return haystack.includes(filter);
}

export default function VisitorHomeLibrary({ nuggets, totalCount }: { nuggets: HomeNugget[]; totalCount: number | null }) {
  const [filter, setFilter] = useState("all");
  const [term, setTerm] = useState("");

  const visible = useMemo(() => {
    const query = term.trim().toLowerCase();

    return nuggets.filter((nugget) => {
      const matchesTopic = matchesFilter(nugget, filter);
      const haystack = `${nugget.title} ${nugget.topic} ${nugget.tag} ${nugget.scriptureRef} ${nugget.keyPrinciple} ${nugget.marketplaceApplication}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesTopic && matchesSearch;
    });
  }, [filter, nuggets, term]);

  return (
    <>
      <p className={styles.nuggetCount} aria-live="polite">
        {totalCount === null ? "Nugget count temporarily unavailable" : `${totalCount.toLocaleString()} published ${totalCount === 1 ? "Nugget" : "Nuggets"} available`}
      </p>
      <div className={styles.searchbox}>
        <span className={styles.searchIcon} aria-hidden="true">⌕</span>
        <input
          type="search"
          aria-label="Search nuggets"
          placeholder="Search leadership, finance, Proverbs, vision..."
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
        <Link href="/library" className={`bn-button ${styles.btn}`}>
          Open Library ↗
        </Link>
      </div>

      <div className={styles.pills} role="group" aria-label="Filter by topic">
        {filters.map((item) => (
          <button
            type="button"
            key={item.value}
            className={`${styles.pill} ${filter === item.value ? styles.pillSelected : ""}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className={styles.cards} id="visitor-home-cards">
          {visible.slice(0, 9).map((nugget) => (
            <article className={styles.card} key={nugget.slug}>
              <div className={styles.cardtop}>
                <span className={styles.cardtag}>{nugget.topic || nugget.tag}</span>
                <span className={styles.cardnum}>{String(nugget.number).padStart(2, "0")}</span>
              </div>

              <h3>{nugget.title}</h3>
              <p className={styles.cardExcerpt}>{nuggetExcerpt(nugget.keyPrinciple || nugget.marketplaceApplication)}</p>

              <div className={styles.cardfoot}>
                <span>{nugget.scriptureRef}</span>
                <Link href="/library">Read insight ↗</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No nuggets match your search. Try another keyword or topic.</p>
      )}
    </>
  );
}
