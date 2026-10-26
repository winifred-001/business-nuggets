import Link from "next/link";
import InformationLayout from "@/components/InformationLayout";

const questions = [
  ["What is Business Nuggets?", "Business Nuggets from the Bible brings together biblical principles and practical business commentary for personal study and reflection."],
  ["How do I find a nugget?", "Open The Library to browse nuggets, topics, challenges, Scripture Index and collections. Use the search and filters to find a subject or passage."],
  ["Why should I create an account?", "An account gives you access to your personal workspace, where you can organize saved nuggets, playlists and notes."],
  ["How do I reset my password?", "Choose Forgot password on the Login page and follow the instructions sent to your email address."],
  ["Where do I manage my profile?", "Sign in and open Account Settings from the account menu to manage your profile and available account preferences."],
  ["Is all content free?", "Some content may require a membership. Check the access requirements and current plan details before subscribing."],
  ["Where can I read the privacy policy and terms?", "Use the Privacy Policy and Terms of Use links in the footer. These pages explain the platform’s published policies."],
];
export default function FAQsPage() {
  return (
    <InformationLayout title="Frequently Asked Questions" introduction="A few answers to help you find your way around Business Nuggets.">
      <div className="space-y-4">
        {questions.map(([question, answer]) => <details key={question} className="rounded-lg border border-[#ead2a0]/20 bg-[#191b18] p-5 sm:p-6"><summary className="cursor-pointer font-semibold text-[#ead2a0]">{question}</summary><p className="mt-4 max-w-3xl leading-7 text-[#b4b2ab]">{answer}</p></details>)}
      </div>
      <p className="mt-8 text-[#b4b2ab]">Still need help? <Link href="/contact" className="text-[#ead2a0] underline">Contact us</Link>.</p>
    </InformationLayout>
  );
}
