import {
  Suspense,
} from "react";
import {
  LoaderCircle,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import PaymentCallbackContent from "@/components/PaymentCallbackContent";

export default function PaymentCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col bn-cream-page bg-[#F5F0E8] text-[#211E19]">
      <Navbar />

      <Suspense
        fallback={
          <main className="mx-auto flex w-full max-w-[760px] flex-1 items-center justify-center px-5 py-16">
            <LoaderCircle
              size={34}
              className="animate-spin text-[#E28906]"
            />
          </main>
        }
      >
        <PaymentCallbackContent />
      </Suspense>

      <Footer />
    </div>
  );
}
