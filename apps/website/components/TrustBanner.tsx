import React from "react";
import { TRUST_INVARIANTS } from "@/lib/data";
import { ShieldAlert, Lock, Globe, Cpu } from "lucide-react";

export function TrustBanner() {
  const iconMap: Record<string, React.ReactNode> = {
    ShieldAlert: <ShieldAlert className="w-5 h-5 text-[#16181B]" />,
    Lock: <Lock className="w-5 h-5 text-[#E57E25]" />,
    Globe: <Globe className="w-5 h-5 text-[#16181B]" />,
    Cpu: <Cpu className="w-5 h-5 text-[#E57E25]" />,
  };

  return (
    <section className="bg-[#FAF9F6] py-16 border-b border-[#E2DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_INVARIANTS.map((item) => (
            <div
              key={item.title}
              className="bg-[#FFFFFF] border border-[#E2DFD7] p-6 shadow-sharp-sand"
            >
              <div className="mb-3">{iconMap[item.iconName]}</div>
              <h4 className="font-mono text-sm font-bold text-[#111316] mb-2 uppercase tracking-tight">
                {item.title}
              </h4>
              <p className="text-xs text-[#5A5D64] leading-relaxed font-sans">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
