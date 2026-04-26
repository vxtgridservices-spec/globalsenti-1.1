import { ShieldCheck, Lock, CheckCircle2, Scale } from "lucide-react";

const trustItems = [
  { label: "International Compliance Standards", icon: Scale },
  { label: "Secure & Confidential Transactions", icon: Lock },
  { label: "Verified Supply Chains", icon: CheckCircle2 },
  { label: "Regulatory Alignment", icon: ShieldCheck },
];

export function TrustStrip() {
  return (
    <div className="bg-gold py-8 w-full">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 justify-center md:justify-start">
              <item.icon className="text-background w-6 h-6 shrink-0" />
              <span className="text-background font-bold text-xs md:text-sm uppercase tracking-wider leading-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
