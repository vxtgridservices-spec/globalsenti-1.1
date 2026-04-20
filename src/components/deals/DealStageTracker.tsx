import * as React from "react";
import { Check, Dot, AlertCircle } from "lucide-react";

export const DEAL_STAGES = [
  "interest",
  "review",
  "qualified",
  "negotiation",
  "due_diligence",
  "terms_agreed",
  "contract_issued",
  "escrow",
  "shipment",
  "closed",
  "rejected"
] as const;

export type DealStage = typeof DEAL_STAGES[number];

export const STAGE_LABELS: Record<DealStage, string> = {
  interest: "Expression of Interest",
  review: "Under Review",
  qualified: "Prospect Qualified",
  negotiation: "Deal Negotiation",
  due_diligence: "Due Diligence",
  terms_agreed: "Terms Agreed",
  contract_issued: "Contract Issued",
  escrow: "Execution & Escrow",
  shipment: "Global Logistics",
  closed: "Deal Closed",
  rejected: "Transaction Rejected"
};

export const ALLOWED_TRANSITIONS: Record<DealStage, DealStage[]> = {
  interest: ["review", "rejected"],
  review: ["qualified", "rejected"],
  qualified: ["negotiation", "rejected"],
  negotiation: ["due_diligence", "rejected"],
  due_diligence: ["terms_agreed", "rejected"],
  terms_agreed: ["contract_issued", "rejected"],
  contract_issued: ["escrow", "rejected"],
  escrow: ["shipment", "rejected"],
  shipment: ["closed", "rejected"],
  closed: [],
  rejected: ["interest"] // Allow resetting for retries
};

export const ROLE_PERMISSIONS: Record<string, DealStage[]> = {
  admin: [
    "interest",
    "review",
    "qualified",
    "negotiation",
    "due_diligence",
    "terms_agreed",
    "contract_issued",
    "escrow",
    "shipment",
    "closed",
    "rejected"
  ],
  broker: ["negotiation", "due_diligence", "terms_agreed", "shipment", "rejected"], // Allowed to advance to/reject at specific stages
  buyer: [] // Cannot change stage
};

interface DealStageTrackerProps {
  currentStage?: string;
  isAdmin?: boolean;
  onUpdateStage?: (stage: DealStage) => void;
}

export function DealStageTracker({ currentStage = "interest", isAdmin = false, onUpdateStage }: DealStageTrackerProps) {
  const currentIndex = DEAL_STAGES.indexOf(currentStage as DealStage) === -1 
    ? 0 
    : DEAL_STAGES.indexOf(currentStage as DealStage);

  return (
    <div className="w-full bg-secondary/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-xl mb-8 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-serif text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            Transaction Status
          </h3>
          <p className="text-sm text-gold font-bold uppercase tracking-widest mt-1">
            {STAGE_LABELS[currentStage as DealStage] || "Processing"}
          </p>
        </div>
        
        {isAdmin && onUpdateStage && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Admin Control</span>
            <select 
              value={currentStage}
              onChange={(e) => onUpdateStage(e.target.value as DealStage)}
              className="bg-black/40 border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg px-4 py-2 focus:ring-1 focus:ring-gold outline-none"
            >
              {DEAL_STAGES.map(stage => (
                <option key={stage} value={stage} className="bg-black text-white">
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white/5 -translate-y-1/2 z-0 hidden md:block" />
        <div 
          className="absolute top-1/2 left-4 h-[2px] bg-gold -translate-y-1/2 z-0 hidden md:block transition-all duration-500 ease-out" 
          style={{ width: `calc(${(currentIndex / (DEAL_STAGES.length - 1)) * 100}% - 32px)` }} 
        />
        
        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-6 md:gap-0">
          {DEAL_STAGES.map((stage, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;

            return (
              <div key={stage} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1">
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isPassed 
                      ? "bg-gold border-gold text-black" 
                      : isCurrent
                        ? "bg-black border-gold text-gold shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-110"
                        : "bg-black border-white/10 text-white/20"
                  }`}
                >
                  {isPassed ? <Check className="w-4 h-4 font-bold" /> : <Dot className="w-4 h-4" />}
                </div>
                <div className={`text-left md:text-center transition-colors duration-300 ${
                  isPassed ? "text-white" : isCurrent ? "text-gold font-bold" : "text-white/30"
                }`}>
                  <div className="text-[10px] uppercase tracking-widest leading-tight w-full md:mt-2">
                    {STAGE_LABELS[stage]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
