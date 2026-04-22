import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  PieChart, 
  Wallet,
  ArrowUpRight,
  TrendingDown,
  Activity,
  History,
  Download,
  Lock,
  ArrowLeft,
  BarChart4,
  FileText,
  ExternalLink,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { InvestorPosition, InvestmentSubscription, PerformanceUpdate, FundingSubmission, RedemptionRequest, InvestorTransaction } from "@/src/types/investments";
import { cn } from "@/src/lib/utils";
import { 
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  DollarSign,
  Info
} from "lucide-react";

export function InvestmentPortfolio() {
  const navigate = useNavigate();
  const [positions, setPositions] = React.useState<InvestorPosition[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<InvestmentSubscription[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [performanceData, setPerformanceData] = React.useState<Record<string, PerformanceUpdate>>({});
  const [activeStepId, setActiveStepId] = React.useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = React.useState<string | null>(null);
  const [proofHash, setProofHash] = React.useState("");
  const [selectedPosition, setSelectedPosition] = React.useState<InvestorPosition | null>(null);
  const [showLiquidityModal, setShowLiquidityModal] = React.useState<InvestorPosition | null>(null);
  const [isRedeeming, setIsRedeeming] = React.useState(false);
  const [transactions, setTransactions] = React.useState<InvestorTransaction[]>([]);
  const [redemptionForm, setRedemptionForm] = React.useState({
      units: 0,
      type: 'Full' as 'Partial' | 'Full',
      destination: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [posRes, subRes, txRes] = await Promise.all([
        supabase
          .from('investor_positions')
          .select(`*, product:investment_products(*)`)
          .eq('user_id', user.id),
        supabase
          .from('investment_subscriptions')
          .select(`*, product:investment_products(*)`)
          .eq('user_id', user.id)
          .neq('status', 'Funded'),
        supabase
          .from('investor_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);
      
      if (posRes.error && posRes.error.code !== '42P01') throw posRes.error;
      if (subRes.error && subRes.error.code !== '42P01') throw subRes.error;
      if (txRes.error && txRes.error.code !== '42P01') throw txRes.error;

      setPositions(posRes.data || []);
      setSubscriptions(subRes.data || []);
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error("Failed to fetch investment profile:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handlePaymentSubmission = async (subId: string) => {
    if (!proofHash.trim()) {
        alert("Please provide a transaction hash or wire reference.");
        return;
    }
    try {
        setSubmittingPayment(subId);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const sub = subscriptions.find(s => s.id === subId);
        if (!sub) return;

        // 1. Update Subscription Status
        const { error: subError } = await supabase
            .from('investment_subscriptions')
            .update({ 
                status: 'Funding Submitted', 
                payment_proof_hash: proofHash 
            })
            .eq('id', subId);
        
        if (subError) throw subError;

        // 2. Create Funding Submission Record (Part 2)
        const { error: fundError } = await supabase
            .from('funding_submissions')
            .insert({
                subscription_id: subId,
                user_id: user.id,
                payment_proof_hash: proofHash,
                amount: sub.total_amount,
                status: 'Pending'
            });

        if (fundError && fundError.code !== '42P01') throw fundError;

        // 3. Log Deposit Transaction (Part 5)
        const { error: txError } = await supabase
            .from('investor_transactions')
            .insert({
                user_id: user.id,
                subscription_id: subId,
                type: 'deposit',
                amount: sub.total_amount,
                description: `Payment proof submitted for ${sub.product?.name}`,
                metadata: { proof_hash: proofHash }
            });
        
        if (txError && txError.code !== '42P01') throw txError;

        alert("Payment confirmation submitted. Our treasury team will verify the funds shortly.");
        setProofHash("");
        setActiveStepId(null);
        fetchData();
    } catch (err) {
        console.error("Submission failed:", err);
        alert("Submission failed. Please try again.");
    } finally {
        setSubmittingPayment(null);
    }
  };

  const handleRequestLiquidity = async () => {
    if (!showLiquidityModal) return;
    if (redemptionForm.type === 'Partial' && (redemptionForm.units <= 0 || redemptionForm.units > showLiquidityModal.units)) {
        alert("Invalid unit quantity for partial redemption.");
        return;
    }
    if (!redemptionForm.destination.trim()) {
        alert("Please provide a payment destination.");
        return;
    }

    try {
        setIsRedeeming(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const unitsToRedeem = redemptionForm.type === 'Full' ? showLiquidityModal.units : redemptionForm.units;
        const unitPrice = showLiquidityModal.total_invested / showLiquidityModal.units;
        const amount = unitsToRedeem * unitPrice;

        const { error } = await supabase
          .from('redemption_requests')
          .insert({
              position_id: showLiquidityModal.id,
              user_id: user.id,
              units: unitsToRedeem,
              amount: amount,
              redemption_type: redemptionForm.type,
              payment_destination: { details: redemptionForm.destination },
              status: 'Pending Review'
          });

        if (error) throw error;

        alert("Liquidity request submitted. Subject to management review (24-48h).");
        setShowLiquidityModal(null);
        setRedemptionForm({ units: 0, type: 'Full', destination: "" });
        fetchData();
    } catch (err) {
        console.error("Redemption failed:", err);
        alert("Request failed. Please try again.");
    } finally {
        setIsRedeeming(false);
    }
  };

  const generateFundingAdvice = (sub: InvestmentSubscription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const details = sub.funding_details;
    if (!details) {
        alert("Funding instructions not yet available. Please wait for treasury dispatch.");
        return;
    }

    const html = `
      <html>
        <head>
          <title>Funding Advice - ${sub.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #313131; background: #fff; }
            .header { border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; color: #000; margin: 0; font-family: serif; }
            .details { margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 12px 0; }
            .label { font-weight: bold; color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .value { font-family: monospace; font-size: 13px; color: #000; }
            .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin: 40px 0 20px; border-bottom: 1px solid #D4AF37; display: inline-block; }
            .footer { margin-top: 100px; font-size: 9px; color: #aaa; text-align: center; border-t: 1px solid #eee; pt: 20px; }
            .warning { background: #fdfae6; padding: 15px; border-radius: 8px; border-left: 4px solid #D4AF37; font-size: 11px; margin: 20px 0; line-height: 1.5; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div>
                <h1 class="title">SENTINEL GLOBAL</h1>
                <p style="margin:0; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Asset Management Division</p>
            </div>
            <div style="text-align: right">
                <p style="margin:0; font-weight: bold;">OFFICIAL FUNDING ADVICE</p>
                <p style="margin:0; font-size: 10px; color: #aaa;">ID: ${sub.id.toUpperCase()}</p>
            </div>
          </div>

          <div class="warning">
            <strong>IMPORTANT:</strong> Please ensure the Reference Code below is correctly included in your transfer. 
            Failure to provide a valid reference may cause delays in capital allocation and unit distribution.
          </div>

          <div class="section-title">Investment Summary</div>
          <div class="details">
            <div class="row"><span class="label">Financial Product</span><span class="value">${sub.product?.name}</span></div>
            <div class="row"><span class="label">Allocation Units</span><span class="value">${sub.units} Units</span></div>
            <div class="row"><span class="label">Total Settlement Amount</span><span class="value" style="font-weight: bold; color: #000;">$${sub.total_amount.toLocaleString()}</span></div>
            <div class="row"><span class="label">Allocation Reference</span><span class="value" style="color: #D4AF37; font-weight: bold;">${details.reference_code}</span></div>
          </div>

          <div class="section-title">Settlement Parameters (${sub.payment_method})</div>
          <div class="details">
            ${sub.payment_method === 'Bank Wire' ? `
              <div class="row"><span class="label">Beneficiary</span><span class="value">${details.beneficiary}</span></div>
              <div class="row"><span class="label">Bank</span><span class="value">${details.bank}</span></div>
              <div class="row"><span class="label">IBAN / Account</span><span class="value">${details.iban}</span></div>
              <div class="row"><span class="label">SWIFT / BIC</span><span class="value">${details.swift}</span></div>
            ` : `
              <div class="row"><span class="label">Network</span><span class="value">${details.network}</span></div>
              <div class="row"><span class="label">Asset</span><span class="value">${details.asset}</span></div>
              <div class="row"><span class="label">Destination Wallet</span><span class="value" style="font-size: 11px;">${details.wallet_address}</span></div>
            `}
          </div>

          <div class="footer">
            This document is generated automatically by the Sentinel Global Secure Portal. 
            Digital Timestamp: ${new Date().toISOString()} | Secure ID: ${sub.id}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  const generateCertifiedStatement = (pos: InvestorPosition) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const perf = performanceData[pos.product_id];
    const currentPrice = perf?.current_nav || pos.product?.unit_price || (pos.total_invested / pos.units);
    const currentVal = currentPrice * pos.units;
    const netGain = currentVal - pos.total_invested;

    const html = `
      <html>
        <head>
          <title>Certified Statement - ${pos.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #313131; background: #fff; line-height: 1.6; }
            .header { border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; color: #000; margin: 0; font-family: serif; }
            .details { margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0; }
            .label { font-weight: bold; color: #888; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
            .value { font-family: monospace; font-size: 12px; color: #000; }
            .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin: 30px 0 15px; border-bottom: 1px solid #D4AF37; display: inline-block; }
            .performance-box { background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee; margin: 20px 0; }
            .footer { margin-top: 80px; font-size: 8px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: #f0f0f0; z-index: -1; font-weight: bold; pointer-events: none; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="watermark">CERTIFIED</div>
          <div class="header">
            <div>
                <h1 class="title">SENTINEL GLOBAL</h1>
                <p style="margin:0; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Asset Management & Custody</p>
            </div>
            <div style="text-align: right">
                <p style="margin:0; font-weight: bold;">CERTIFIED POSITION STATEMENT</p>
                <p style="margin:0; font-size: 9px; color: #aaa;">ALLOCATION REF: ${pos.id.toUpperCase()}</p>
            </div>
          </div>

          <div style="font-size: 11px; margin-bottom: 40px;">
            This document certifies the legal ownership and current valuation of physical commodity units held within the Sentinel Global Treasury vault system.
          </div>

          <div class="section-title">Position Identity</div>
          <div class="details">
            <div class="row"><span class="label">Product Name</span><span class="value">${pos.product?.name}</span></div>
            <div class="row"><span class="label">Commodity Class</span><span class="value">${pos.product?.commodity}</span></div>
            <div class="row"><span class="label">Units Authorized</span><span class="value">${pos.units} Units</span></div>
            <div class="row"><span class="label">Issuance Date</span><span class="value">${new Date(pos.created_at).toLocaleDateString()}</span></div>
          </div>

          <div class="section-title">Valuation Diagnostics (USD)</div>
          <div class="performance-box">
            <div class="row"><span class="label">Principal Disbursed</span><span class="value">$${pos.total_invested.toLocaleString()}</span></div>
            <div class="row"><span class="label">Current Net Asset Value (NAV)</span><span class="value" style="font-weight:bold;">$${currentVal.toLocaleString()}</span></div>
            <div class="row" style="border:none;"><span class="label">Net Unrealized P/L</span><span class="value" style="color: ${netGain >= 0 ? '#10b981' : '#ef4444'}; font-weight:bold;">${netGain >= 0 ? '+' : ''}$${netGain.toLocaleString()}</span></div>
          </div>

          <div class="section-title">Yield Parameters</div>
          <div class="details">
            <div class="row"><span class="label">Target Yield</span><span class="value">${pos.product?.target_roi}%</span></div>
            <div class="row"><span class="label">Distribution Type</span><span class="value">${pos.product?.roi_type}</span></div>
            <div class="row"><span class="label">Frequency</span><span class="value">${pos.product?.distribution_frequency}</span></div>
          </div>

          <p style="font-size: 9px; color: #777; margin-top: 40px; line-height: 1.4;">
            <strong>CUSTODIAN NOTICE:</strong> All assets are physically backed and insured. Valuations are updated according to 
            Sentinel Treasury real-time pricing feeds. This statement constitutes a digital representation of physical holdings 
            and may be used for verified balance reports.
          </p>

          <div class="footer">
            Digitally Signed by Sentinel Treasury Auth Service<br/>
            Timestamp: ${new Date().toISOString()} | Ledger ID: ${pos.id.slice(0,16)}...
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  const viewOnChainLedger = (posId: string) => {
    navigate(`/investments/ledger/${posId}`);
  }

  const totalInvested = positions.reduce((acc, pos) => acc + pos.total_invested, 0);
  const currentValue = positions.reduce((acc, pos) => {
    // Priority: 1. Real-time performance feed, 2. Current product unit price, 3. Original investment (worst case)
    const perf = performanceData[pos.product_id];
    const livePrice = perf?.current_nav || pos.product?.unit_price || (pos.total_invested / pos.units);
    return acc + (livePrice * pos.units);
  }, 0);
  const totalGain = currentValue - totalInvested;
  const totalROI = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <PageLayout 
      title="Investment Portfolio" 
      subtitle="Real-time performance tracking and capital management for your managed commodity positions."
    >
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="text-gold hover:text-gold-light hover:bg-gold/10 mb-8 gap-2"
          onClick={() => navigate("/investments")}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Button>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           {[
            { label: "Principal Invested", value: `$${totalInvested.toLocaleString()}`, icon: Wallet, color: "text-blue-400" },
            { label: "Current Valuation", value: `$${currentValue.toLocaleString()}`, icon: TrendingUp, color: "text-gold" },
            { label: "Total Gain/Loss", value: `+$${totalGain.toLocaleString()}`, icon: Activity, color: "text-green-400" },
            { label: "Aggregate ROI", value: `${totalROI.toFixed(2)}%`, icon: BarChart4, color: "text-green-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-secondary/20 border-white/5">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{stat.label}</p>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <p className="text-3xl font-serif text-white">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {subscriptions.length > 0 && (
                <section className="mb-12">
                   <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 bg-gold animate-pulse rounded-full" />
                        <h3 className="text-xl font-serif text-white">Pending Requests</h3>
                   </div>
                    <div className="space-y-4">
                        {subscriptions.map((sub) => (
                            <Card key={sub.id} className={cn(
                                "transition-all duration-300 overflow-hidden",
                                sub.status === 'Awaiting Funding Instructions' ? "bg-black/40 border-white/5 opacity-80" : 
                                sub.status === 'Awaiting Payment' ? "bg-gold/5 border-gold/20" : "bg-blue-500/5 border-blue-500/20"
                            )}>
                                <CardContent className="p-0">
                                    <div className="p-5 flex justify-between items-start">
                                        <div>
                                            <h4 className="text-white font-serif text-lg">{sub.product?.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full animate-pulse",
                                                    sub.status === 'Awaiting Funding Instructions' ? "bg-gray-500" :
                                                    sub.status === 'Awaiting Payment' ? "bg-gold" : "bg-blue-400"
                                                )} />
                                                <p className={cn(
                                                    "text-[10px] uppercase tracking-widest font-black",
                                                    sub.status === 'Awaiting Funding Instructions' ? "text-gray-500" :
                                                    sub.status === 'Awaiting Payment' ? "text-gold" : "text-blue-400"
                                                )}>Status: {sub.status}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-bold font-mono text-xl">${sub.total_amount.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-mono">{sub.units} Units @ ${sub.unit_price_at_purchase}/ea</p>
                                        </div>
                                    </div>

                                    {sub.status === 'Awaiting Funding Instructions' && (
                                        <div className="border-t border-white/5 p-8 bg-black/20 text-center space-y-3">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2">
                                                <RefreshCw className="w-6 h-6 text-gray-500 animate-spin-slow" />
                                            </div>
                                            <p className="text-sm text-white font-serif">Awaiting Instruction Dispatch</p>
                                            <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                                                Sentinel Treasury has received your allocation request. 
                                                Custom settlement parameters for your {sub.payment_method} will be dispatched shortly.
                                            </p>
                                        </div>
                                    )}

                                    {sub.status === 'Awaiting Payment' && (
                                        <div className="border-t border-gold/10 p-5 bg-gold/5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <h5 className="text-[10px] uppercase text-gold font-black tracking-widest flex items-center gap-2 pb-2 border-b border-gold/10">
                                                        <FileText className="w-3 h-3" /> Funding Instructions
                                                    </h5>
                                                    {sub.payment_method === 'Bank Wire' ? (
                                                        <div className="space-y-2 text-[11px] text-gray-400 font-medium">
                                                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Beneficiary</span><span className="text-white">{sub.funding_details?.beneficiary}</span></div>
                                                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Bank</span><span className="text-white">{sub.funding_details?.bank}</span></div>
                                                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Reference</span><span className="text-white font-mono uppercase">{sub.funding_details?.reference_code}</span></div>
                                                            <div className="flex justify-between pt-1"><span>Amount Due</span><span className="text-white font-bold font-mono">${sub.total_amount.toLocaleString()}</span></div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2 text-[11px] text-gray-400 font-medium">
                                                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Network</span><span className="text-white">{sub.funding_details?.network}</span></div>
                                                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Asset</span><span className="text-white">{sub.funding_details?.asset}</span></div>
                                                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Destination</span><span className="text-white font-mono break-all text-[9px]">{sub.funding_details?.wallet_address}</span></div>
                                                            <div className="flex justify-between pt-1"><span>Amount Due</span><span className="text-white font-bold font-mono">${sub.total_amount.toLocaleString()}</span></div>
                                                        </div>
                                                    )}
                                                    <Button 
                                                        variant="outline" 
                                                        className="w-full text-[10px] h-8 border-gold/20 text-gold hover:bg-gold/10 gap-2 font-bold uppercase tracking-tight"
                                                        onClick={() => generateFundingAdvice(sub)}
                                                    >
                                                        <Download className="w-3 h-3" /> Generate Funding Advice
                                                    </Button>
                                                </div>
                                                <div className="space-y-4">
                                                    <h5 className="text-[10px] uppercase text-gold font-black tracking-widest pb-2 border-b border-gold/10">Submit Settlement Proof</h5>
                                                    <div className="space-y-3 p-4 rounded-xl bg-black/40 border border-gold/10">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] uppercase text-gray-500 font-bold">Transaction Hash / Wire Ref</Label>
                                                            <Input 
                                                                className="h-8 text-[11px] bg-white/5 border-white/10 text-white font-mono" 
                                                                placeholder="e.g. 0x... or WT732..."
                                                                value={activeStepId === sub.id ? proofHash : ""}
                                                                onChange={(e) => {
                                                                    setActiveStepId(sub.id);
                                                                    setProofHash(e.target.value);
                                                                }}
                                                            />
                                                        </div>
                                                        <Button 
                                                            className="w-full bg-gold text-background hover:bg-gold-light font-black text-[10px] h-8 uppercase tracking-widest"
                                                            onClick={() => handlePaymentSubmission(sub.id)}
                                                            disabled={submittingPayment === sub.id || (activeStepId === sub.id && !proofHash.trim())}
                                                        >
                                                            {submittingPayment === sub.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "I Have Sent Funds"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {sub.status === 'Funding Submitted' && (
                                        <div className="border-t border-blue-500/10 p-5 bg-blue-500/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                    <Clock className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-white font-bold uppercase tracking-tight">Escrow Verification Pending</p>
                                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-0.5">
                                                        Your proof of settlement <span className="text-blue-400 font-mono">({sub.payment_proof_hash})</span> has been logged. 
                                                        Platform treasury will confirm the allocation within 24 business hours.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            <h3 className="text-2xl font-serif text-white mb-6">Active Positions</h3>
            
            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Synchronizing ledger...</p>
                </div>
            ) : positions.length > 0 ? (
                <div className="space-y-4">
                    {positions.map((position) => {
                        const perf = performanceData[position.product_id];
                        const livePrice = perf?.current_nav || position.product?.unit_price || (position.total_invested / position.units);
                        const currentPosValue = livePrice * position.units;
                        const posGain = currentPosValue - position.total_invested;
                        const posROI = (posGain / position.total_invested) * 100;
                        const maturityDate = position.product ? new Date(new Date(position.created_at).getTime() + position.product.duration_days * 24 * 60 * 60 * 1000) : null;

                        return (
                            <Card key={position.id} className="bg-secondary/20 border-white/5 hover:border-white/10 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded uppercase tracking-widest leading-none">
                                                    {position.product?.commodity || "Commodity"}
                                                </span>
                                                <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded uppercase tracking-widest leading-none">
                                                    {position.status}
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-serif text-white mb-1">{position.product?.name}</h4>
                                            <p className="text-xs text-gray-500 font-mono">ID: {position.id} • {position.units} Units Held</p>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 text-right shrink-0">
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Current Value</p>
                                                <p className="text-white font-bold font-mono">${currentPosValue.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Performance (ROI)</p>
                                                <p className={cn("font-bold font-mono", posGain >= 0 ? "text-green-500" : "text-red-500")}>
                                                    {posGain >= 0 ? "+" : ""}{posROI.toFixed(2)}%
                                                </p>
                                            </div>
                                            <div className="hidden lg:block">
                                                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Maturity Date</p>
                                                <p className="text-white font-bold font-mono">{maturityDate?.toLocaleDateString() || "TBD"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                                        <div className="flex gap-6">
                                             <div className="flex items-center gap-2">
                                                 <Clock className="w-3.5 h-3.5 text-gray-500" />
                                                 <span className="text-[10px] text-gray-400 uppercase tracking-widest">Invested: {new Date(position.created_at).toLocaleDateString()}</span>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <Activity className="w-3.5 h-3.5 text-gold" />
                                                 <span className="text-[10px] text-gray-400 uppercase tracking-widest">Real-time valuation active</span>
                                             </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-gold font-bold hover:bg-gold/10 text-[10px] uppercase tracking-widest h-8"
                                            onClick={() => setSelectedPosition(position)}
                                        >
                                            View Statement <ChevronRight className="ml-1 w-3 h-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="bg-secondary/10 border-dashed border-white/10 p-12 text-center">
                    <PieChart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h4 className="text-white font-serif text-lg mb-2">No active investments found</h4>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                        Explore the Investment Marketplace to start building your direct physical commodity portfolio.
                    </p>
                    <Button 
                        className="bg-gold text-background font-bold"
                        onClick={() => navigate("/investments")}
                    >
                        Browse Opportunities
                    </Button>
                </Card>
            )}
          </div>

          <div className="space-y-8">
             <Card className="bg-secondary/20 border-white/5">
                <CardHeader>
                    <CardTitle className="text-lg font-serif text-white">Investment Documents</CardTitle>
                    <CardDescription className="text-xs">Secure access to your legal and financial files.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        { name: "Global Master Agreement", type: "PDF" },
                        { name: "Position Statement - Q1 2026", type: "PDF" },
                        { name: "Risk Disclosure Addendum", type: "PDF" }
                    ].map(doc => (
                        <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
                            <span className="text-xs text-gray-300 group-hover:text-white transition-colors">{doc.name}</span>
                            <Download className="w-3.5 h-3.5 text-gray-500 group-hover:text-gold transition-colors" />
                        </div>
                    ))}
                </CardContent>
             </Card>

             <Card className="bg-gold border-none overflow-hidden relative group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_70%)]" />
                <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-background" />
                        <h3 className="text-background font-bold uppercase tracking-widest text-xs">Vested Liquidity</h3>
                    </div>
                    <p className="text-background/80 text-xs mb-6 font-medium leading-relaxed">
                        Emergency liquidity withdrawal is available for positions held longer than 90 days. Subject to management approval and liquidity pool availability.
                    </p>
                    <Button 
                        className="w-full bg-background text-white hover:bg-background/90 font-bold text-xs h-10"
                        onClick={() => {
                            if (positions.length === 0) {
                                alert("No active positions available for liquidity request.");
                                return;
                            }
                            setShowLiquidityModal(positions[0]);
                            setRedemptionForm(prev => ({ ...prev, units: positions[0].units }));
                        }}
                    >
                        Request Liquidity
                    </Button>
                </CardContent>
             </Card>

             <section>
                <div className="flex justify-between items-end mb-4">
                   <h3 className="text-sm font-bold text-white uppercase tracking-widest">Transaction History</h3>
                   <History className="w-4 h-4 text-gold" />
                </div>
                <div className="space-y-4">
                    {transactions.length > 0 ? (
                        transactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center py-3 border-b border-white/5 hover:bg-white/5 transition-colors px-1">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-1.5 rounded-full",
                                        tx.type === 'deposit' ? "bg-green-500/10" : 
                                        tx.type === 'allocation' ? "bg-blue-500/10" :
                                        tx.type === 'redemption' ? "bg-amber-500/10" :
                                        "bg-gold/10"
                                    )}>
                                        {tx.type === 'deposit' ? <ArrowDownCircle className="w-3 h-3 text-green-400" /> :
                                         tx.type === 'allocation' ? <Banknote className="w-3 h-3 text-blue-400" /> :
                                         tx.type === 'redemption' ? <ArrowUpCircle className="w-3 h-3 text-amber-400" /> :
                                         <DollarSign className="w-3 h-3 text-gold" />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                                        <p className="text-[10px] text-gray-500 font-mono italic">{tx.description || tx.metadata?.proof_hash || 'No description'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-xs font-bold font-mono",
                                        tx.type === 'deposit' || tx.type === 'roi_accrual' ? "text-green-400" : "text-white"
                                    )}>
                                        {tx.type === 'deposit' || tx.type === 'roi_accrual' ? '+' : '-'}${tx.amount.toLocaleString()}
                                    </p>
                                    <p className="text-[9px] text-gray-500 font-mono">{new Date(tx.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center border border-dashed border-white/5 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest italic">No transaction history</p>
                        </div>
                    )}
                </div>
             </section>
          </div>
        </div>
      </div>

      {/* Position Statement Modal */}
      {selectedPosition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/95 backdrop-blur-md"
                  onClick={() => setSelectedPosition(null)}
              />
              <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative w-full max-w-2xl bg-secondary border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              >
                  <div className="p-8 border-b border-white/5 bg-gradient-to-r from-gold/10 to-transparent">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <span className="text-[10px] font-black text-gold bg-gold/10 px-2 py-1 rounded uppercase tracking-widest leading-none block w-fit mb-4">Official Position Statement</span>
                              <h2 className="text-3xl font-serif text-white">{selectedPosition.product?.name}</h2>
                              <p className="text-xs text-gray-500 font-mono mt-1">Allocation ID: {selectedPosition.id.toUpperCase()}</p>
                          </div>
                          <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={() => setSelectedPosition(null)}>
                              ✕
                          </Button>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="space-y-1">
                              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Units Held</p>
                              <p className="text-lg text-white font-bold font-mono">{selectedPosition.units}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Purchase Price</p>
                              <p className="text-lg text-white font-bold font-mono">${(selectedPosition.total_invested / selectedPosition.units).toLocaleString()}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Maturity ROI</p>
                              <p className="text-lg text-gold font-bold font-mono">
                                  {selectedPosition.product?.target_roi}%
                              </p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Est. Maturity</p>
                              <p className="text-lg text-white font-bold font-mono">
                                  {selectedPosition.product ? new Date(new Date(selectedPosition.created_at).getTime() + selectedPosition.product.duration_days * 24 * 60 * 60 * 1000).toLocaleDateString() : "TBD"}
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 space-y-8 bg-black/20">
                      <div className="space-y-4">
                          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <BarChart4 className="w-4 h-4 text-gold" /> Capital Performance Diagnostics
                          </h3>
                          <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                              <div className="flex justify-between items-end">
                                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Principal Disbursed</span>
                                  <span className="text-sm text-white font-mono font-bold">${selectedPosition.total_invested.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Current Valuation</span>
                                  <span className="text-sm text-gold font-mono font-bold">
                                      ${((performanceData[selectedPosition.product_id]?.current_nav || selectedPosition.product?.unit_price || (selectedPosition.total_invested / selectedPosition.units)) * selectedPosition.units).toLocaleString()}
                                  </span>
                              </div>
                              <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                  <span className="text-[10px] uppercase tracking-widest text-white font-black">Net Unrealized Gain</span>
                                  <span className="text-lg text-green-400 font-mono font-bold">
                                      +${(((performanceData[selectedPosition.product_id]?.current_nav || selectedPosition.product?.unit_price || (selectedPosition.total_invested / selectedPosition.units)) * selectedPosition.units) - selectedPosition.total_invested).toLocaleString()}
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                          <Button 
                            className="flex-1 bg-gold text-background hover:bg-gold-light font-black text-[10px] h-12 uppercase tracking-widest gap-2"
                            onClick={() => generateCertifiedStatement(selectedPosition)}
                          >
                              <Download className="w-4 h-4" /> Download Certified Statement
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 border-white/10 text-white hover:bg-white/5 font-black text-[10px] h-12 uppercase tracking-widest gap-2"
                            onClick={() => viewOnChainLedger(selectedPosition.id)}
                          >
                              <ExternalLink className="w-4 h-4" /> View On-Chain Ledger
                          </Button>
                      </div>

                      <div className="p-4 rounded-lg bg-gold/5 border border-gold/10">
                          <p className="text-[9px] text-gold/60 text-center leading-relaxed font-medium">
                              SENTINEL TREASURY NOTICE: This statement constitutes an official record of physical commodity holdings. 
                              All valuations are based on direct custodian reports and net of management fees.
                          </p>
                      </div>
                  </div>
              </motion.div>
          </div>
      )}
      {/* Liquidity Request Modal */}
      {showLiquidityModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                  onClick={() => setShowLiquidityModal(null)}
              />
              <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative w-full max-w-lg bg-secondary border border-gold/20 rounded-2xl overflow-hidden shadow-2xl"
              >
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gold/5">
                      <h3 className="text-lg font-serif text-white flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-gold" /> Liquidity Redemption Request
                      </h3>
                      <Button variant="ghost" className="text-gray-500 hover:text-white h-8 w-8 p-0" onClick={() => setShowLiquidityModal(null)}>✕</Button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-200/70 leading-relaxed font-medium">
                              Early liquidity requests are subject to a 24-48h compliance review. Redemptions are processed at the current principal valuation minus transaction fees.
                          </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div 
                              className={cn(
                                  "p-4 rounded-xl border cursor-pointer transition-all",
                                  redemptionForm.type === 'Full' ? "bg-gold/10 border-gold" : "bg-white/5 border-white/10 hover:border-white/20"
                              )}
                              onClick={() => setRedemptionForm(prev => ({ ...prev, type: 'Full', units: showLiquidityModal.units }))}
                          >
                              <p className="text-[9px] uppercase text-gray-500 font-black mb-1">Full Exit</p>
                              <p className="text-sm text-white font-bold">{showLiquidityModal.units} Units</p>
                          </div>
                          <div 
                              className={cn(
                                  "p-4 rounded-xl border cursor-pointer transition-all",
                                  redemptionForm.type === 'Partial' ? "bg-gold/10 border-gold" : "bg-white/5 border-white/10 hover:border-white/20"
                              )}
                              onClick={() => setRedemptionForm(prev => ({ ...prev, type: 'Partial' }))}
                          >
                              <p className="text-[9px] uppercase text-gray-500 font-black mb-1">Partial</p>
                              <p className="text-sm text-white font-bold">Custom Amount</p>
                          </div>
                      </div>

                      {redemptionForm.type === 'Partial' && (
                          <div className="space-y-2">
                              <Label className="text-[10px] uppercase text-gray-500 font-bold">Units to Redeem (Max: {showLiquidityModal.units})</Label>
                              <Input 
                                  type="number" 
                                  max={showLiquidityModal.units}
                                  className="bg-white/5 border-white/10 text-white font-mono" 
                                  value={redemptionForm.units}
                                  onChange={e => setRedemptionForm(prev => ({ ...prev, units: Number(e.target.value) }))}
                              />
                          </div>
                      )}

                      <div className="space-y-2">
                          <Label className="text-[10px] uppercase text-gray-500 font-bold">Payment Destination (Wallet or Bank Info)</Label>
                          <Input 
                              placeholder="e.g. 0x... or IBAN: GB..."
                              className="bg-white/5 border-white/10 text-white font-mono" 
                              value={redemptionForm.destination}
                              onChange={e => setRedemptionForm(prev => ({ ...prev, destination: e.target.value }))}
                          />
                      </div>

                      <div className="pt-4 border-t border-white/5">
                          <div className="flex justify-between items-end mb-4">
                              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Estimated Payout</span>
                              <span className="text-lg text-white font-mono font-bold">
                                  ${(redemptionForm.units * (showLiquidityModal.total_invested / showLiquidityModal.units)).toLocaleString()}
                              </span>
                          </div>
                          <Button 
                              className="w-full bg-gold text-background hover:bg-gold-light font-black text-[10px] h-12 uppercase tracking-widest"
                              onClick={handleRequestLiquidity}
                              disabled={isRedeeming}
                          >
                              {isRedeeming ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Submit Redemption Request"}
                          </Button>
                      </div>
                  </div>
              </motion.div>
          </div>
      )}
    </PageLayout>
  );
}
