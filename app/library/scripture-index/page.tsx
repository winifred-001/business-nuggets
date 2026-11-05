import { redirect } from "next/navigation";

export default function ScriptureIndexPage() {
  redirect("/library?tab=Scripture+Matrix");
}