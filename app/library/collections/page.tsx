import { redirect } from "next/navigation";

export default function CollectionsPage() {
  redirect("/library?tab=Collections");
}