import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
      <span className="text-xs uppercase tracking-widest text-[#E57E25] font-semibold mb-3">
        404 // Protocol Route
      </span>
      <h1 className="font-editorial text-4xl sm:text-5xl text-[#111316] font-normal tracking-tight mb-4">
        Page Not Found
      </h1>
      <p className="text-sm text-[#5A5D64] max-w-md mb-8">
        The requested documentation route or page does not exist on this network.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#16181B] text-[#FAF9F6] text-xs font-bold uppercase tracking-wider hover:bg-[#333333] transition-colors shadow-sharp-solid"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
