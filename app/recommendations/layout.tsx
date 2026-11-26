import type { ReactNode } from "react";

import styles from "../personalization-typography.module.css";

export default function RecommendationsLayout({ children }: { children: ReactNode }) {
  return <div className={styles.screen}>{children}</div>;
}
