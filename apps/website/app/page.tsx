import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
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
        <HowItWorks />
        <ChoosePath />
        <Guarantees />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
