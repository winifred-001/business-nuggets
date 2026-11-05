"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/visitor-home.module.css";

export default function VisitorNuggetCounter({ totalCount }: { totalCount: number | null }) {
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = numberRef.current;
    if (!element || totalCount === null) return;
    let frame = 0;
    let started = false;
    const finish = () => { element.textContent = totalCount.toLocaleString(); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    element.textContent = "0";
    function start() {
      if (started) return;
      started = true;
      let startTime: number | undefined;
      function tick(time: number) {
        startTime ??= time;
        const progress = Math.min((time - startTime) / 1400, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element!.textContent = Math.round(totalCount! * eased).toLocaleString();
        if (progress < 1) frame = requestAnimationFrame(tick);
        else finish();
      }
      frame = requestAnimationFrame(tick);
    }
    if (!("IntersectionObserver" in window)) {
      start();
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        start();
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [totalCount]);

  if (totalCount === null) {
    return <p className={styles.nuggetCount}>Nugget count temporarily unavailable</p>;
  }
  const label = `published ${totalCount === 1 ? "Nugget" : "Nuggets"} available`;
  return (
    <p className={styles.nuggetCount}>
      <span className="sr-only">{totalCount.toLocaleString()} {label}</span>
      <span ref={numberRef} className={styles.counterNumber} aria-hidden="true">0</span>
      <span aria-hidden="true">{label}</span>
    </p>
  );
}
