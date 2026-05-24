import React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { History, ArrowDownCircle, ArrowUpCircle, Banknote, DollarSign, Download } from "lucide-react";
import { InvestorTransaction, RedemptionRequest } from "@/src/types/investments";
import { supabase } from "@/src/lib/supabase";
import { cn } from "@/src/lib/utils";
import { jsPDF } from "jspdf";
import { Button } from "@/src/components/ui/button";

export function TransactionsHistory() {
  const [transactions, setTransactions] = React.useState<InvestorTransaction[]>([]);
  const [redemptions, setRedemptions] = React.useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
     const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [txRes, redRes, profileRes] = await Promise.all([
                supabase.from('investor_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('redemption_requests').select('*').eq('user_id', user.id),
                supabase.from('profiles').select('*').eq('id', user.id).single()
            ]);

            if (txRes.error) throw txRes.error;
            if (redRes.error) throw redRes.error;
            
            setTransactions(txRes.data as InvestorTransaction[] || []);
            setRedemptions(redRes.data as RedemptionRequest[] || []);
            setProfile(profileRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
     };

     fetchData();
  }, []);

  const handleDownload = () => {
      const pdf = new jsPDF();
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, 210, 297, "F"); 
      pdf.setFillColor(212, 175, 55);
      pdf.rect(0, 0, 210, 10, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.text("GLOBAL SENTINEL GROUP", 105, 20, { align: "center" });
      
      pdf.setFontSize(10);
      pdf.setTextColor(200, 200, 200);
      pdf.text("Asset Management Division", 105, 26, { align: "center" });
      
      pdf.setFontSize(14);
      pdf.setTextColor(212, 175, 55); 
      pdf.text("INVESTMENT STATEMENT", 105, 38, { align: "center" });
      
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text("FOR THE PERIOD: 2026", 105, 43, { align: "center" });

      // Investor Info
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`Investor: ${profile?.full_name || 'N/A'}`, 20, 55);
      pdf.text(`Email: ${profile?.email || 'N/A'}`, 20, 60);
      pdf.text(`Date Issued: ${new Date().toLocaleDateString()}`, 150, 55);
      
      pdf.setDrawColor(212, 175, 55);
      pdf.line(20, 65, 190, 65);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(200, 200, 200);

      let yPos = 75;
      filteredTransactions.forEach((tx, i) => {
          if (yPos > 270) {
              pdf.addPage();
              pdf.setFillColor(10, 10, 10);
              pdf.rect(0, 0, 210, 297, "F");
              yPos = 20;
          }
          const sign = tx.type === 'deposit' || tx.type === 'roi_accrual' ? '+' : '-';
          const date = new Date(tx.created_at).toLocaleString();
          pdf.text(`${date} | ${tx.type.toUpperCase()}`, 20, yPos);
          pdf.text(`${sign}$${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 150, yPos);
          if (tx.description) {
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(tx.description, 20, yPos + 4);
            pdf.setFontSize(10);
            pdf.setTextColor(200, 200, 200);
            yPos += 8;
          }
          yPos += 8;
      });

      pdf.save(`GSG_Statement_${new Date().getTime()}.pdf`);
  };

  const filteredTransactions = React.useMemo(() => {
    const map = new Map<string, InvestorTransaction>();
    transactions.forEach(tx => {
      if (tx.type === 'redemption' && tx.metadata?.request_id) {
        const existing = map.get(tx.metadata.request_id);
        if (!existing) {
          map.set(tx.metadata.request_id, tx);
        } else {
             const currentStatus = redemptions.find(r => r.id === tx.metadata.request_id)?.status;
             if (currentStatus === 'Completed') {
                 map.set(tx.metadata.request_id, tx);
             }
        }
      } else {
        map.set(tx.id, tx);
      }
    });
    return Array.from(map.values()).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions, redemptions]);

  return (
    <PageLayout title="Transaction History" subtitle="Full ledger of your account activity, deposits, yields, and withdraws." hideFooter={true}>
      <div className="container mx-auto px-4 max-w-4xl py-12">
        <Card className="bg-secondary/40 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                        <History className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-serif text-white">Full Ledger</CardTitle>
                        <p className="text-xs text-gray-400 mt-1">All processed and pending transactions.</p>
                    </div>
                </div>
                <Button variant="outline" className="text-gold border-gold/30 hover:bg-gold/10 gap-2" onClick={handleDownload}>
                    <Download className="w-4 h-4" /> Download PDF
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="py-12 text-center text-gray-400">Loading details...</div>
                ) : filteredTransactions.length > 0 ? (
                    <div className="space-y-4">
                        {filteredTransactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center p-4 rounded-lg bg-white/5 border border-white/5 hover:border-gold/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2 rounded-full",
                                        tx.type === 'deposit' ? "bg-green-500/10" : 
                                        tx.type === 'allocation' ? "bg-blue-500/10" :
                                        tx.type === 'redemption' ? "bg-amber-500/10" :
                                        "bg-gold/10"
                                    )}>
                                        {tx.type === 'deposit' ? <ArrowDownCircle className="w-4 h-4 text-green-400" /> :
                                         tx.type === 'allocation' ? <Banknote className="w-4 h-4 text-blue-400" /> :
                                         tx.type === 'redemption' ? <ArrowUpCircle className="w-4 h-4 text-amber-400" /> :
                                         <DollarSign className="w-4 h-4 text-gold" />}
                                    </div>
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                            <p className="text-sm text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                                            {tx.type === 'redemption' && (
                                                <span className={cn(
                                                    "text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border w-max",
                                                    redemptions.find(r => r.id === tx.metadata?.request_id)?.status === 'Rejected' ? "border-red-500/30 text-red-500 bg-red-500/10" :
                                                    redemptions.find(r => r.id === tx.metadata?.request_id)?.status === 'Completed' ? "border-green-500/30 text-green-500 bg-green-500/10" :
                                                    "border-amber-500/30 text-amber-500 bg-amber-500/10"
                                                )}>
                                                    {redemptions.find(r => r.id === tx.metadata?.request_id)?.status || 'Pending'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-gray-500 font-mono italic mt-1 break-all">{tx.description || tx.metadata?.proof_hash || 'No description available for this transaction.'}</p>
                                    </div>
                                </div>
                                <div className="text-right ml-2">
                                    <p className={cn(
                                        "text-sm sm:text-lg font-bold font-mono",
                                        tx.type === 'deposit' || tx.type === 'roi_accrual' ? "text-green-400" : "text-white"
                                    )}>
                                        {tx.type === 'deposit' || tx.type === 'roi_accrual' ? '+' : '-'}${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </p>
                                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-mono mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-lg">
                        <p className="text-sm text-gray-500 uppercase tracking-widest italic">No transaction history found</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
