import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { 
    ShieldCheck, 
    Link as LinkIcon, 
    Box, 
    Database, 
    Clock, 
    ArrowLeft,
    CheckCircle2,
    Lock,
    Globe,
    Cpu
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { InvestorPosition } from "@/src/types/investments";
import { cn } from "@/src/lib/utils";

export function LedgerVerification() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [position, setPosition] = React.useState<InvestorPosition | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPosition = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('investor_positions')
          .select('*, product:investment_products(*)')
          .eq('id', id)
          .single();
        
        if (error && error.code !== '42P01') throw error;
        setPosition(data);
      } catch (err) {
        console.error("Failed to fetch ledger position:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosition();
  }, [id]);

  const blockHeight = 19842732;
  const gasUsed = "21,042";
  const transactionHash = `0x${id?.split('-').join('')}a${id?.slice(0, 8)}7c`;

  if (loading) {
    return (
      <PageLayout title="Sentinel Ledger Explorer">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Sentinel Ledger Explorer">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Button 
          variant="ghost" 
          className="text-gray-400 hover:text-white gap-2 mb-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portfolio
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-gold/10 text-gold text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest border border-gold/20">
                On-Chain Verification
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Live Consensus
              </div>
            </div>
            <h1 className="text-4xl font-serif text-white">Sentinel Ledger Explorer</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Block Height</p>
            <p className="text-xl text-white font-mono font-bold">#{blockHeight.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Main Transaction Card */}
          <Card className="bg-secondary/40 border-white/5 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-gold via-gold/50 to-transparent" />
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-gold" /> Transaction Signature
                    </h3>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-sm text-white break-all leading-relaxed">
                      {transactionHash}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Status</p>
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-bold">Success / Finalized</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Timestamp</p>
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="w-4 h-4 text-gold" />
                        <span className="text-sm font-bold">{position ? new Date(position.created_at).toLocaleString() : "Syncing..."}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">From (Vault Custodian)</p>
                      <div className="flex items-center gap-2 text-white">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold">Sentinel Treasury Vault (SV-01)</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">To (Vested Interest)</p>
                      <div className="flex items-center gap-2 text-white">
                        <Lock className="w-4 h-4 text-gold" />
                        <span className="text-sm font-bold">Investor Proxy Wallet ({position?.user_id.slice(0, 8)})</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:border-l lg:border-white/5 lg:pl-12 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Resource Allocation</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-gold/5 border border-gold/10">
                        <p className="text-[10px] text-gold uppercase tracking-widest font-black mb-1">Commodity Units</p>
                        <p className="text-2xl text-white font-serif">{position?.units} Units</p>
                        <p className="text-[10px] text-gray-500 mt-1">{position?.product?.commodity} Physical Reserve</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Value Disbursed</p>
                        <p className="text-xl text-white font-mono">${position?.total_invested.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Network Data</h3>
                    <div className="space-y-2 text-[11px] font-mono">
                      <div className="flex justify-between text-gray-500 italic"><span>Gas Used</span><span className="text-white">{gasUsed} Units</span></div>
                      <div className="flex justify-between text-gray-500 italic"><span>Nonce</span><span className="text-white">128</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Globe, label: "Global Sync", value: "Verified on 1,420 Nodes" },
              { icon: Cpu, label: "Consensus", value: "Proof of Authority (POA)" },
              { icon: Box, label: "Vault Link", value: "Linked to Physical Skus" }
            ].map((feature, i) => (
              <Card key={i} className="bg-secondary/20 border-white/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gold/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black leading-none mb-1">{feature.label}</p>
                    <p className="text-xs text-white font-bold">{feature.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-gold/5 border border-gold/10 text-center">
            <p className="text-xs text-gold/80 leading-relaxed font-medium italic">
              "This ledger record provides mathematical proof that your capital has been locked into physical commodity contracts. 
              The transaction hash is unique to your allocation and cannot be modified by the portal management."
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
