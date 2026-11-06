import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturesExplainer } from "@/components/FeaturesExplainer";
import { WhatWeOffer } from "@/components/WhatWeOffer";
import { HowItWorks } from "@/components/HowItWorks";
import { TrustBanner } from "@/components/TrustBanner";
import { Guarantees } from "@/components/Guarantees";
import { ChoosePath } from "@/components/ChoosePath";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeaturesExplainer />
        <WhatWeOffer />
        <HowItWorks />
        <TrustBanner />
        <Guarantees />
        <ChoosePath />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
