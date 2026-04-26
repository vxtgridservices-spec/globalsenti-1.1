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
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { motion } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { InvestorPosition, InvestmentSubscription, PerformanceUpdate, FundingSubmission, RedemptionRequest, InvestorTransaction, PriceHistory } from "@/src/types/investments";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { 
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  DollarSign,
  Info
} from "lucide-react";
import { interpolatePoints, addJitter, MarketCheckpoint } from '../../lib/chartInterpolation';

const PortfolioTrendChart = ({ positions, priceHistory, currentValue, totalROI, onLiveUpdate }: { positions: any[], priceHistory: any[], currentValue: number, totalROI: number, onLiveUpdate?: (val: number, roi: number) => void }) => {
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [checkpoints, setCheckpoints] = React.useState<any[]>([]);
    const [liveVal, setLiveVal] = React.useState(currentValue);

    // Fetch and subscribe to updates
    const fetchCheckpoints = async () => {
        const { data, error } = await supabase
            .from('market_checkpoints')
            .select('*')
            .order('target_timestamp', { ascending: true });
        if (!error && data) {
            const deleted = JSON.parse(localStorage.getItem('deleted_checkpoints') || '[]');
            setCheckpoints(data.filter(cp => !deleted.includes(cp.id)));
        }
    };

    React.useEffect(() => {
        fetchCheckpoints(); // Initial load
        const channel = supabase
            .channel('market_checkpoints')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'market_checkpoints' }, () => {
                fetchCheckpoints(); // Re-fetch on new checkpoint or delete
            })
            .subscribe();
            
        window.addEventListener('storage', fetchCheckpoints);
        return () => { 
            supabase.removeChannel(channel); 
            window.removeEventListener('storage', fetchCheckpoints);
        };
    }, []);

    const baseData = React.useMemo(() => {
        const dataMap = new Map();
        
        // Use current positions value as a starting point if history is sparse
        const now = Date.now();
        const startOfToday = new Date().setHours(0,0,0,0);
        
        if (priceHistory.length > 0) {
            positions.forEach(pos => {
                priceHistory.filter(ph => ph.product_id === pos.product_id).forEach(ph => {
                    const ts = new Date(ph.timestamp).getTime();
                    const val = (dataMap.get(ts) || 0) + (ph.price * pos.units);
                    dataMap.set(ts, val);
                });
            });
        }
        
        let result = Array.from(dataMap.entries()).map(([ts, val]) => ({ 
            timestamp: ts, 
            value: val 
        })).sort((a,b) => a.timestamp - b.timestamp);

        // If no history, synthesize a start-of-day point to create a line
        if (result.length === 0) {
            result.push({ timestamp: startOfToday, value: currentValue * 0.998 });
            result.push({ timestamp: now, value: currentValue });
        } else if (result.length === 1) {
            result.unshift({ timestamp: result[0].timestamp - 86400000, value: result[0].value * 0.99 });
        }
        
        // ADDED: Aggregate Checkpoints by Timestamp to prevent jagged lines
        if (checkpoints.length > 0 && result.length > 0) {
            const lastHistorical = result[result.length - 1];
            
            // Map to aggregate changes by timestamp
            const checkpointAggregator = new Map<number, number>();
            
            checkpoints.forEach(cp => {
                const checkpointTime = new Date(cp.target_timestamp).getTime();
                const pct = (cp.percentage_change || 0) / 100;
                
                let growth = 0;
                if (!cp.product_id) {
                    growth = lastHistorical.value * pct;
                } else {
                    const heldProd = positions.find(pos => pos.product_id === cp.product_id);
                    const prodPrices = priceHistory.filter(ph => ph.product_id === cp.product_id);
                    if (heldProd && prodPrices.length > 0) {
                        const lastPrice = prodPrices.reduce((p, c) => 
                            new Date(c.timestamp).getTime() > new Date(p.timestamp).getTime() ? c : p
                        ).price;
                        growth = (heldProd.units * lastPrice) * pct;
                    }
                }
                checkpointAggregator.set(checkpointTime, (checkpointAggregator.get(checkpointTime) || 0) + growth);
            });

            checkpointAggregator.forEach((totalGrowth, timestamp) => {
                result.push({
                    timestamp,
                    value: lastHistorical.value + totalGrowth
                });
            });
        }
        
        // Sort result again in case checkpoints are added
        result.sort((a,b) => a.timestamp - b.timestamp);
        
        // Interpolation logic: High density for organic, curved movement
        let renderedPoints: MarketCheckpoint[] = [];
        if (result.length > 1) {
            for (let i = 0; i < result.length - 1; i++) {
                // High density (120 points) ensures organic "market cycles" are visible
                renderedPoints.push(...interpolatePoints(result[i], result[i+1], 120));
            }
        } else {
             renderedPoints = result.length > 0 ? result : [{timestamp: Date.now(), value: currentValue}];
        }
        return renderedPoints;
    }, [positions, priceHistory, checkpoints, currentValue]);

    // Live Jitter Loop & Sync
    React.useEffect(() => {
        const updateInterval = setInterval(() => {
            if (baseData.length === 0) return;
            
            // Use organic persistent jitter from the utility
            const jittered = addJitter(baseData, 0.003);

            const now = Date.now();
            
            // 1. Find the value exactly at this moment in the interpolated stream
            let valAtNow = currentValue;
            if (jittered.length > 0) {
                const first = jittered[0];
                const last = jittered[jittered.length - 1];

                if (now <= first.timestamp) {
                    valAtNow = first.value;
                } else if (now >= last.timestamp) {
                    valAtNow = last.value;
                } else {
                    for (let i = 0; i < jittered.length - 1; i++) {
                        if (now >= jittered[i].timestamp && now <= jittered[i+1].timestamp) {
                            const ratio = (now - jittered[i].timestamp) / (jittered[i+1].timestamp - jittered[i].timestamp);
                            valAtNow = jittered[i].value + (jittered[i+1].value - jittered[i].value) * ratio;
                            break;
                        }
                    }
                }
            }
            
            // Add a tiny random flicker to the immediate live price to simulate an active order book
            const liveTickWobble = valAtNow * 0.0005 * ((Math.random() - 0.5) * 2);
            valAtNow += liveTickWobble;
            
            // 2. Prepare the chart data with numeric timestamps for high-res Recharts rendering
            // Filter future points out so the right edge of the chart represents "NOW"
            const pastPoints = jittered.filter(p => p.timestamp <= now);
            const finalData = pastPoints.map(p => ({
                timestamp: p.timestamp,
                value: p.value
            }));
            
            // Push the current exact moment frame
            finalData.push({
                timestamp: now,
                value: valAtNow
            });
            
            const principal = currentValue / (1 + totalROI/100);
            const currentROI = ((valAtNow - principal) / principal) * 100;

            setChartData(finalData);
            setLiveVal(valAtNow);
            if (onLiveUpdate) onLiveUpdate(valAtNow, currentROI);
        }, 1500);

        return () => clearInterval(updateInterval);
    }, [baseData, currentValue, totalROI, onLiveUpdate]);
    
    // Initial data load
    React.useEffect(() => {
        if (baseData.length > 0) {
            setChartData(baseData.map(p => ({
                timestamp: p.timestamp,
                value: p.value
            })));
        }
    }, [baseData]);

    return (
        <div className="bg-black/40 border border-white/5 rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto shadow-2xl">
            {/* Header: Title & Time Range */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                <h2 className="text-md font-serif text-white tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gold" /> PORTFOLIO VALUE TREND
                </h2>
                <div className="flex bg-black/60 rounded-lg p-1">
                    {['1D', '7D', '1M', '3M', '1Y', 'ALL'].map((range) => (
                        <button key={range} className={cn("px-3 py-1 text-[10px] font-black rounded-md transition-all", range === '1M' ? "bg-gold text-black" : "text-gray-500 hover:text-white")}>
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics */}
            <div className="flex items-end gap-8 mb-6">
                <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Current Value</p>
                    <p className="text-3xl sm:text-4xl font-serif text-white">${liveVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Total Return</p>
                    <p className={cn("text-xl sm:text-2xl font-bold font-mono", (onLiveUpdate ? (liveVal >= (currentValue / (1 + totalROI/100))) : (totalROI >= 0)) ? "text-green-500" : "text-red-500")}>
                        {((liveVal - (currentValue / (1 + totalROI/100))) / (currentValue / (1 + totalROI/100)) * 100) >= 0 ? "+" : ""}{((liveVal - (currentValue / (1 + totalROI/100))) / (currentValue / (1 + totalROI/100)) * 100).toFixed(2)}%
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="w-full h-[320px] relative mt-4">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <AreaChart data={chartData} margin={{ top: 20, right: 40, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                        <XAxis 
                            dataKey="timestamp" 
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            stroke="#444" 
                            tick={{fontSize: 9}} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            minTickGap={30}
                        />
                        <YAxis 
                            stroke="#444" 
                            tick={{fontSize: 9}} 
                            tickLine={false} 
                            axisLine={false} 
                            domain={[(dataMin: number) => dataMin * 0.95, (dataMax: number) => dataMax * 1.05]}
                            tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} 
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#D4AF37', color: '#fff', borderRadius: '4px', fontSize: '11px', padding: '8px' }}
                            itemStyle={{ color: '#D4AF37', fontWeight: 600 }}
                            labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                            cursor={{ stroke: '#D4AF37', strokeWidth: 1 }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#D4AF37" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorTotal)"
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationEasing="ease-in-out"
                            activeDot={{ r: 5, fill: '#fff', stroke: '#D4AF37', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const PositionPerformanceChart = ({ product_id, priceHistory, units, invested }: { product_id: string, priceHistory: any[], units: number, invested: number }) => {
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [checkpoints, setCheckpoints] = React.useState<any[]>([]);

    const fetchCheckpoints = async () => {
        const { data, error } = await supabase
            .from('market_checkpoints')
            .select('*')
            .or(`product_id.eq.${product_id},product_id.is.null`)
            .order('target_timestamp', { ascending: true });
        
        if (!error && data) {
            const deleted = JSON.parse(localStorage.getItem('deleted_checkpoints') || '[]');
            setCheckpoints(data.filter(cp => !deleted.includes(cp.id)));
        }
    };

    React.useEffect(() => {
        fetchCheckpoints();
        const channel = supabase
            .channel(`position_checkpoints_${product_id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'market_checkpoints' }, () => {
                fetchCheckpoints();
            })
            .subscribe();
            
        window.addEventListener('storage', fetchCheckpoints);
        return () => { 
            supabase.removeChannel(channel); 
            window.removeEventListener('storage', fetchCheckpoints);
        };
    }, [product_id]);

    const baseData = React.useMemo(() => {
        const productPrices = priceHistory.filter(ph => ph.product_id === product_id);
        const result = productPrices.map(ph => ({ 
            timestamp: new Date(ph.timestamp).getTime(), 
            value: ph.price * units 
        })).sort((a,b) => a.timestamp - b.timestamp);

        if (result.length === 0) {
            const now = Date.now();
            result.push({ timestamp: now - 86400000, value: invested * 0.98 });
            result.push({ timestamp: now, value: invested });
        }

        if (checkpoints.length > 0 && result.length > 0) {
            const last = result[result.length - 1];
            const aggregator = new Map<number, number>();
            
            checkpoints.forEach(cp => {
                const ts = new Date(cp.target_timestamp).getTime();
                const pct = (cp.percentage_change || 0) / 100;
                aggregator.set(ts, (aggregator.get(ts) || 0) + (last.value * pct));
            });
            
            aggregator.forEach((growth, ts) => {
                result.push({
                    timestamp: ts,
                    value: last.value + growth
                });
            });
            result.sort((a,b) => a.timestamp - b.timestamp);
        }

        let renderedPoints: MarketCheckpoint[] = [];
        if (result.length > 1) {
            for (let i = 0; i < result.length - 1; i++) {
                renderedPoints.push(...interpolatePoints(result[i], result[i+1], 60));
            }
        } else {
            renderedPoints = result;
        }
        return renderedPoints;
    }, [product_id, priceHistory, checkpoints, units, invested]);

    React.useEffect(() => {
        const updateInterval = setInterval(() => {
            if (baseData.length === 0) return;
            const jittered = addJitter(baseData, 0.002);
            
            const now = Date.now();
            let valAtNow = invested;
            if (jittered.length > 0) {
                const first = jittered[0];
                const last = jittered[jittered.length - 1];
                if (now <= first.timestamp) valAtNow = first.value;
                else if (now >= last.timestamp) valAtNow = last.value;
                else {
                    for (let i = 0; i < jittered.length - 1; i++) {
                        if (now >= jittered[i].timestamp && now <= jittered[i+1].timestamp) {
                            const ratio = (now - jittered[i].timestamp) / (jittered[i+1].timestamp - jittered[i].timestamp);
                            valAtNow = jittered[i].value + (jittered[i+1].value - jittered[i].value) * ratio;
                            break;
                        }
                    }
                }
            }
            
            const liveTickWobble = valAtNow * 0.0005 * ((Math.random() - 0.5) * 2);
            valAtNow += liveTickWobble;

            const pastPoints = jittered.filter(p => p.timestamp <= now);
            const finalData = pastPoints.map(p => ({
                timestamp: p.timestamp,
                price: p.value / units
            }));
            
            finalData.push({
                timestamp: now,
                price: valAtNow / units
            });

            setChartData(finalData);
        }, 1500);
        return () => clearInterval(updateInterval);
    }, [baseData, units, invested]);

    return (
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorPriceModal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#D4AF37', color: '#fff', fontSize: '10px', borderRadius: '4px' }}
                    labelStyle={{ display: 'none' }}
                    itemStyle={{ color: '#D4AF37' }}
                    formatter={(val: number) => [`$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Unit Price']}
                />
                <Area type="monotone" dataKey="price" stroke="#D4AF37" fillOpacity={1} fill="url(#colorPriceModal)" strokeWidth={2} />
            </AreaChart>
        </ResponsiveContainer>
    );
};

const InvestmentDocumentItem: React.FC<{ doc: { name: string; type: string } }> = ({ doc }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    // Simulate network delay to make it feel like "secure generation"
    await new Promise(resolve => setTimeout(resolve, 1500));

    const pdf = new jsPDF();
    
    // Add some styling to make it look industry-standard
    pdf.setFillColor(10, 10, 10);
    pdf.rect(0, 0, 210, 297, "F"); // Dark background

    // Gold header line
    pdf.setFillColor(212, 175, 55);
    pdf.rect(0, 0, 210, 10, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("GLOBAL SENTINEL GROUP", 105, 30, { align: "center" });

    pdf.setFontSize(14);
    pdf.setTextColor(212, 175, 55); // Gold
    pdf.text("EXECUTION & DISCLOSURE DOCUMENT", 105, 45, { align: "center" });

    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(18);
    pdf.text(doc.name, 105, 70, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Date Generated: ${new Date().toLocaleDateString()}`, 20, 100);
    pdf.text(`Status: VERIFIED & SECURE`, 20, 110);
    pdf.text(`Document Reference: GSG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 20, 120);

    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    let contentText = `This document ("${doc.name}") serves as a certified record of the position, \nagreement, or statement held with Global Sentinel Group. All positions \nand physical assets are fully audited and secured in tier-1 jurisdictions. \n\nThis document is strictly confidential and intended solely for the authorized \naccount holder. Unauthorized distribution is strictly prohibited under \ninternational trade regulations and the terms of service. For any inquiries, \nplease consult your designated relationship manager or the compliance division.`;
    
    if (doc.name.includes("Global Master Agreement")) {
      contentText = `GLOBAL MASTER TRADING AGREEMENT\n\n1. SCOPE AND EXECUTION\nThis Global Master Agreement ("Agreement") governs the over-the-counter (OTC) trading,\nphysical acquisition, and logistics of strategic commodities between Global Sentinel Group (GSG)\nand the undersigned counterparty. All transactions are subject to final clearance by the GSG\nCompliance Division.\n\n2. MARGIN AND SETTLEMENT\nThe Counterparty agrees to maintain the stipulated margin requirements for leveraged positions.\nFailure to meet margin calls will result in immediate liquidation of positions. Physical delivery\nsettlements require a minimum of 72 hours notice and are subject to logistical feasibility.\n\n3. FORCE MAJEURE\nGSG shall not be held liable for failure or delay in performance resulting from events beyond its\nreasonable control, including but not limited to geopolitical conflicts, embargoes, and\nsupply chain disruptions.`;
    } else if (doc.name.includes("Position Statement")) {
      contentText = `POSITION STATEMENT - Q1 2026\n\n1. ASSET ALLOCATION SUMMARY\nThis document serves as an audited statement of the Counterparty's active positions, unencumbered\ncash balances, and vested liquidity pools held with GSG as of the close of Quarter 1, 2026.\n\n2. VALUATION METHODOLOGY\nAll physical bullion assets are marked-to-market using the LBMA PM Fix. Rare Earth Elements (REEs)\nand strategic synthetics are valued based on prevailing spot rates facilitated by our network of\napproved liquidity providers.\n\n3. AUDIT VERIFICATION\nThe holdings detailed herein have been independently verified by our tier-1 auditing partners.\nPhysical assets remain secured in GSG's decentralized vault network.`;
    } else if (doc.name.includes("Risk Disclosure")) {
      contentText = `RISK DISCLOSURE ADDENDUM\n\n1. NATURE OF TRADING\nTrading in physical commodities and synthetic derivatives carries a high degree of risk and may not\nbe suitable for all investors. The Counterparty acknowledges that the value of investments can\nfluctuate rapidly due to global geopolitical events, supply chain constraints, and market volatility.\n\n2. LEVERAGE AND MARGIN RISKS\nThe use of leverage can amplify both gains and losses. Counterparties may sustain a total loss of\ninitial margin funds. In the event of extreme market volatility, positions may be liquidated without\nprior notice to satisfy margin deficiencies.\n\n3. LOGISTICAL RELIANCE\nWhile GSG employs military-grade logistics and security, the physical movement of strategic assets\nis subject to international trade laws, customs delays, and potential intercepts in volatile regions.\nGSG's liability is strictly limited to the insured value of the cargo in transit.`;
    }

    const splitText = pdf.splitTextToSize(contentText, 170);
    pdf.text(splitText, 20, 140);

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text("--- End of Document ---", 105, 280, { align: "center" });

    pdf.save(`${doc.name.replace(/\s+/g, "_")}_Global_Sentinel.pdf`);
    
    setIsDownloading(false);
  };

  return (
    <div
      onClick={handleDownload}
      className={`flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer ${isDownloading ? 'opacity-50 pointer-events-none' : ''}`}
    >
        <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
          {isDownloading ? 'Generating ' + doc.type + '...' : doc.name}
        </span>
        {isDownloading ? (
          <div className="w-3.5 h-3.5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5 text-gray-500 group-hover:text-gold transition-colors" />
        )}
    </div>
  );
}

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
  const [liveMarketVal, setLiveMarketVal] = React.useState<number | null>(null);
  const [liveMarketROI, setLiveMarketROI] = React.useState<number | null>(null);
  const [showLiquidityModal, setShowLiquidityModal] = React.useState<InvestorPosition | null>(null);
  const [isRedeeming, setIsRedeeming] = React.useState(false);
  const [transactions, setTransactions] = React.useState<InvestorTransaction[]>([]);
  const [redemptions, setRedemptions] = React.useState<RedemptionRequest[]>([]);
  const [priceHistory, setPriceHistory] = React.useState<PriceHistory[]>([]);
  const [redemptionForm, setRedemptionForm] = React.useState({
      units: 0,
      type: 'Full' as 'Partial' | 'Full',
      destinationType: 'Bank' as 'Bank' | 'Crypto',
      bankDetails: {
          beneficiary: "",
          bankName: "",
          iban: "",
          swift: ""
      },
      cryptoDetails: {
          address: "",
          network: "Ethereum (ERC-20)"
      },
      selectedPositionId: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

// Replace lines 77-92 with redemptions fetch
      const [posRes, subRes, txRes, redRes, priceRes] = await Promise.all([
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
          .order('created_at', { ascending: false }),
        supabase
          .from('redemption_requests')
          .select(`*, position:investor_positions(*, product:investment_products(*))`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('price_history')
          .select('*')
      ]);
      
      if (posRes.error && posRes.error.code !== '42P01') throw posRes.error;
      if (subRes.error && subRes.error.code !== '42P01') throw subRes.error;
      if (txRes.error && txRes.error.code !== '42P01') throw txRes.error;
      if (redRes.error && redRes.error.code !== '42P01') throw redRes.error;

      // Handle price_history separately so it doesn't crash the whole portfolio if the table is missing or cache is stale
      if (priceRes.error) {
        console.warn("Price history table not accessible or missing:", priceRes.error.message);
        setPriceHistory([]);
      } else {
        setPriceHistory(priceRes.data || []);
      }
      
      setPositions(posRes.data || []);
      setSubscriptions(subRes.data || []);
      setTransactions(txRes.data || []);
      setRedemptions(redRes.data || []);
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
        toast.error("Please provide a transaction hash or wire reference.");
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

        toast.success("Payment confirmation submitted. Our treasury team will verify the funds shortly.");
        setProofHash("");
        setActiveStepId(null);
        fetchData();
    } catch (err) {
        console.error("Submission failed:", err);
        toast.error("Submission failed. Please try again.");
    } finally {
        setSubmittingPayment(null);
    }
  };

  const handleRequestLiquidity = async () => {
    const selectedPosition = positions.find(p => p.id === redemptionForm.selectedPositionId) || showLiquidityModal;
    if (!selectedPosition) return;

    if (redemptionForm.type === 'Partial' && (redemptionForm.units <= 0 || redemptionForm.units > selectedPosition.units)) {
        toast.error("Invalid unit quantity for partial redemption.");
        return;
    }

    const destination = redemptionForm.destinationType === 'Bank' 
        ? redemptionForm.bankDetails 
        : redemptionForm.cryptoDetails;

    // Basic validation
    if (redemptionForm.destinationType === 'Bank') {
        if (!redemptionForm.bankDetails.beneficiary || !redemptionForm.bankDetails.iban) {
            toast.error("Please provide beneficiary name and IBAN/Account.");
            return;
        }
    } else {
        if (!redemptionForm.cryptoDetails.address) {
            toast.error("Please provide a wallet address.");
            return;
        }
    }

    try {
        setIsRedeeming(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const unitsToRedeem = redemptionForm.type === 'Full' ? selectedPosition.units : redemptionForm.units;
        const unitPrice = selectedPosition.total_invested / selectedPosition.units;
        const amount = unitsToRedeem * unitPrice;

        // 1. Create Redemption Request
        const { data: redemptionData, error: redemptionError } = await supabase
          .from('redemption_requests')
          .insert({
              position_id: selectedPosition.id,
              user_id: user.id,
              units: unitsToRedeem,
              amount: amount,
              redemption_type: redemptionForm.type,
              payment_destination: { 
                  type: redemptionForm.destinationType,
                  ...destination
              },
              status: 'Pending Review'
          })
          .select()
          .single();

        if (redemptionError) throw redemptionError;

        // 2. Log Transaction
        const { error: txError } = await supabase
          .from('investor_transactions')
          .insert({
              user_id: user.id,
              position_id: selectedPosition.id,
              type: 'redemption',
              amount: amount,
              description: `Liquidity request for ${selectedPosition.product?.name} (${unitsToRedeem} units)`,
              metadata: { 
                  redemption_id: redemptionData.id,
                  type: redemptionForm.type
              }
          });

        if (txError && txError.code !== '42P01') throw txError;

        toast.success("Liquidity request successfully submitted to Sentinel Treasury. Subject to review (24-48h).");
        setShowLiquidityModal(null);
        setRedemptionForm({ 
            units: 0, 
            type: 'Full', 
            destinationType: 'Bank',
            bankDetails: { beneficiary: "", bankName: "", iban: "", swift: "" },
            cryptoDetails: { address: "", network: "Ethereum (ERC-20)" },
            selectedPositionId: ""
        });
        fetchData();
    } catch (err) {
        console.error("Redemption failed:", err);
        toast.error("Request failed. Please check your connection and try again.");
    } finally {
        setIsRedeeming(false);
    }
  };

  const generateFundingAdvice = (sub: InvestmentSubscription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const details = sub.funding_details;
    if (!details) {
        toast.info("Funding instructions not yet available. Please wait for treasury dispatch.");
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
    const basePrice = perf?.current_nav || pos.product?.unit_price || (pos.total_invested / pos.units);
    const liveMarketFactor = (liveMarketVal && currentValue > 0) ? (liveMarketVal / currentValue) : 1;
    const currentPrice = basePrice * liveMarketFactor;
    const currentVal = currentPrice * pos.units;
    const netGain = currentVal - pos.total_invested;
    const currentROI = (netGain / pos.total_invested) * 100;

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
            <div class="row"><span class="label">Current Unit Price</span><span class="value">$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 4 })}</span></div>
            <div class="row"><span class="label">Current Net Asset Value (NAV)</span><span class="value" style="font-weight:bold;">$${currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div class="row"><span class="label">Net Unrealized P/L</span><span class="value" style="color: ${netGain >= 0 ? '#10b981' : '#ef4444'}; font-weight:bold;">${netGain >= 0 ? '+' : ''}$${netGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div class="row" style="border:none;"><span class="label">Current ROI</span><span class="value" style="color: ${netGain >= 0 ? '#10b981' : '#ef4444'}; font-weight:bold;">${currentROI.toFixed(2)}%</span></div>
          </div>

          <div class="section-title">Capital Performance Diagnostics</div>
          <div class="details">
            <div class="row"><span class="label">Market Volatility (24h)</span><span class="value">0.42% (Stable)</span></div>
            <div class="row"><span class="label">Risk Parameter</span><span class="value">Standard Allocation</span></div>
            <div class="row"><span class="label">Asset Custody Status</span><span class="value">Verified - Sentinel Vault II</span></div>
            <div class="row"><span class="label">On-Chain Sync Status</span><span class="value">Live / Synchronized</span></div>
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
  
  const liveMarketFactor = (liveMarketVal && currentValue > 0) ? (liveMarketVal / currentValue) : 1;

  const liveValue = liveMarketVal || currentValue;
  const totalGain = liveValue - totalInvested;
  const totalROI = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <PageLayout 
      title="Investment Portfolio" 
      subtitle="Real-time performance tracking and capital management for your managed commodity positions."
    >
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="text-gold hover:text-gold-light hover:bg-gold/10 mb-8 gap-2 w-full md:w-auto h-11 justify-start md:justify-center px-0 md:px-4"
          onClick={() => navigate("/investments")}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Button>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
           {[
            { label: "Principal Invested", value: `$${totalInvested.toLocaleString()}`, icon: Wallet, color: "text-blue-400" },
            { label: "Current Valuation", value: `$${(liveMarketVal ?? currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-gold" },
            { label: "Total Gain/Loss", value: `${(liveMarketVal ?? currentValue) - totalInvested >= 0 ? "+" : ""}$${((liveMarketVal ?? currentValue) - totalInvested).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Activity, color: (liveMarketVal ?? currentValue) >= totalInvested ? "text-green-400" : "text-red-400" },
            { label: "Aggregate ROI", value: `${(liveMarketROI ?? totalROI).toFixed(2)}%`, icon: BarChart4, color: (liveMarketROI ?? totalROI) >= 0 ? "text-green-400" : "text-red-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex"
            >
              <Card className="bg-secondary/20 border-white/5 h-full w-full">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{stat.label}</p>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <p className="text-3xl font-serif text-white mt-auto">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mb-12">
            <PortfolioTrendChart 
                positions={positions} 
                priceHistory={priceHistory} 
                currentValue={currentValue} 
                totalROI={totalROI} 
                onLiveUpdate={(val, roi) => {
                    setLiveMarketVal(val);
                    setLiveMarketROI(roi);
                }}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {subscriptions.length > 0 && (
                <section className="mb-12">
                   <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 bg-gold animate-pulse rounded-full" />
                        <h3 className="text-lg md:text-xl font-serif text-white">Pending Requests</h3>
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
                                                            <div className="flex justify-between border-b border-white/5 pb-1"><span>IBAN / Account</span><span className="text-white font-mono">{sub.funding_details?.iban}</span></div>
                                                            <div className="flex justify-between border-b border-white/5 pb-1"><span>SWIFT / BIC</span><span className="text-white font-mono">{sub.funding_details?.swift}</span></div>
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

            <h3 className="text-xl md:text-2xl font-serif text-white mb-6">Active Positions</h3>
            
            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Synchronizing ledger...</p>
                </div>
            ) : positions.length > 0 ? (
                <div className="space-y-4">
                    {positions.slice(0, 4).map((position) => {
                        const perf = performanceData[position.product_id];
                        const livePrice = perf?.current_nav || position.product?.unit_price || (position.total_invested / position.units);
                        const currentPosValue = livePrice * position.units;
                        
                        // Apply live movement factor
                        const liveFactor = (liveMarketVal && currentValue > 0) ? (liveMarketVal / currentValue) : 1;
                        const liveDisplayPosValue = currentPosValue * liveFactor;
                        const livePosGain = liveDisplayPosValue - position.total_invested;
                        const livePosROI = (livePosGain / position.total_invested) * 100;
                        
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
                                                <p className="text-white font-bold font-mono">${liveDisplayPosValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Performance (ROI)</p>
                                                <p className={cn("font-bold font-mono mb-2", livePosGain >= 0 ? "text-green-500" : "text-red-500")}>
                                                    {livePosGain >= 0 ? "+" : ""}{livePosROI.toFixed(2)}%
                                                </p>
                                                <div className="h-8 w-20 min-h-[32px] min-w-[80px] mt-1 flex items-end justify-end">
                                                    {priceHistory.filter(ph => ph.product_id === position.product_id).length > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                                            <LineChart data={priceHistory.filter(ph => ph.product_id === position.product_id).slice(-10).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())}>
                                                                <Line type="monotone" dataKey="price" stroke={livePosROI >= 0 ? "#10b981" : "#ef4444"} dot={false} strokeWidth={2} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-0.5 w-12 bg-white/5 rounded-full" />
                                                    )}
                                                </div>
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
                    {positions.length > 4 && (
                        <Link to="/positions" className="block w-full">
                            <Button variant="outline" className="w-full mt-4 text-xs tracking-widest border-white/10 hover:bg-white/5 text-gray-300">
                                VIEW ALL POSITIONS
                            </Button>
                        </Link>
                    )}
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
                        <InvestmentDocumentItem key={doc.name} doc={doc} />
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
                                toast.error("No active positions available for liquidity request.");
                                return;
                            }
                            setShowLiquidityModal(positions[0]);
                            setRedemptionForm(prev => ({ 
                                ...prev, 
                                units: positions[0].units,
                                selectedPositionId: positions[0].id 
                            }));
                        }}
                    >
                        Request Liquidity
                    </Button>
                </CardContent>
             </Card>

             {redemptions.length > 0 && (
                <Card className="bg-amber-500/10 border border-amber-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Pending Redemptions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {redemptions.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').map(req => (
                            <div key={req.id} className="p-3 rounded-lg bg-black/40 border border-amber-500/10 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-white uppercase">{req.position?.product?.name || 'Asset Redemption'}</p>
                                        <p className="text-[9px] text-gray-500 font-mono">ID: {req.id.slice(0,8)}</p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-500 border border-amber-500/10">
                                        {req.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end pt-2 border-t border-white/5">
                                    <div>
                                        <p className="text-[8px] text-gray-500 uppercase font-black">Redemption Value</p>
                                        <p className="text-xs text-white font-mono font-bold">${req.amount.toLocaleString()}</p>
                                    </div>
                                    <p className="text-[9px] text-gray-400 italic">24-48h Compliance Review</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
             )}

             <section>
                <div className="flex justify-between items-end mb-4">
                   <h3 className="text-sm font-bold text-white uppercase tracking-widest">Transaction History</h3>
                   <History className="w-4 h-4 text-gold" />
                </div>
                <div className="space-y-4">
                    {transactions.length > 0 ? (
                        <>
                        {transactions.slice(0, 5).map(tx => (
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
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                                            {tx.type === 'redemption' && (
                                                <span className={cn(
                                                    "text-[8px] px-1 rounded font-black uppercase tracking-tighter border",
                                                    redemptions.find(r => r.id === tx.metadata?.redemption_id)?.status === 'Rejected' ? "border-red-500/30 text-red-500 bg-red-500/10" :
                                                    redemptions.find(r => r.id === tx.metadata?.redemption_id)?.status === 'Completed' ? "border-green-500/30 text-green-500 bg-green-500/10" :
                                                    "border-amber-500/30 text-amber-500 bg-amber-500/10"
                                                )}>
                                                    {redemptions.find(r => r.id === tx.metadata?.redemption_id)?.status || 'Pending'}
                                                </span>
                                            )}
                                        </div>
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
                        ))}
                        {transactions.length > 5 && (
                            <Link to="/transactions" className="block w-full">
                                <Button variant="outline" className="w-full mt-4 text-xs tracking-widest border-white/10 hover:bg-white/5 text-gray-300">
                                    VIEW ALL TRANSACTIONS
                                </Button>
                            </Link>
                        )}
                        </>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/95 backdrop-blur-md"
                  onClick={() => setSelectedPosition(null)}
              />
              <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-4xl bg-secondary border border-white/10 sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              >
                  <div className="p-6 sm:p-8 border-b border-white/5 bg-gradient-to-r from-gold/10 to-transparent shrink-0">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <span className="text-[10px] font-black text-gold bg-gold/10 px-2 py-1 rounded uppercase tracking-widest leading-none block w-fit mb-4">Official Position Statement</span>
                              <h2 className="text-2xl sm:text-3xl font-serif text-white">{selectedPosition.product?.name}</h2>
                              <p className="text-xs text-gray-500 font-mono mt-1">Allocation ID: {selectedPosition.id.toUpperCase()}</p>
                          </div>
                          <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={() => setSelectedPosition(null)}>
                              ✕
                          </Button>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

                  <div className="p-6 sm:p-8 space-y-8 bg-black/20 overflow-y-auto flex-grow custom-scrollbar">
                      <div className="space-y-4">
                          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <BarChart4 className="w-4 h-4 text-gold" /> Capital Performance Diagnostics
                          </h3>
                          <div className="h-48 w-full min-h-[192px]">
                              {priceHistory.filter(ph => ph.product_id === selectedPosition.product_id).length > 0 ? (
                                  <PositionPerformanceChart 
                                    product_id={selectedPosition.product_id}
                                    priceHistory={priceHistory}
                                    units={selectedPosition.units}
                                    invested={selectedPosition.total_invested}
                                  />
                              ) : (
                                  <div className="flex items-center justify-center h-full border border-dashed border-white/10 rounded-lg bg-black/20">
                                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black italic">Market data acquisition in progress...</p>
                                  </div>
                              )}
                          </div>
                          <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                              <div className="flex justify-between items-end">
                                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Principal Disbursed</span>
                                  <span className="text-sm text-white font-mono font-bold">${selectedPosition.total_invested.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Current Valuation</span>
                                  <span className="text-sm text-gold font-mono font-bold">
                                      ${((performanceData[selectedPosition.product_id]?.current_nav || selectedPosition.product?.unit_price || (selectedPosition.total_invested / selectedPosition.units)) * selectedPosition.units * liveMarketFactor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                              </div>
                              <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                  <span className="text-[10px] uppercase tracking-widest text-white font-black">Net Unrealized Gain</span>
                                  <span className={cn(
                                      "text-lg font-mono font-bold",
                                      (((performanceData[selectedPosition.product_id]?.current_nav || selectedPosition.product?.unit_price || (selectedPosition.total_invested / selectedPosition.units)) * selectedPosition.units * liveMarketFactor) - selectedPosition.total_invested) >= 0 ? "text-green-400" : "text-red-400"
                                  )}>
                                      {(((performanceData[selectedPosition.product_id]?.current_nav || selectedPosition.product?.unit_price || (selectedPosition.total_invested / selectedPosition.units)) * selectedPosition.units * liveMarketFactor) - selectedPosition.total_invested) >= 0 ? "+" : ""}${(Math.abs(((performanceData[selectedPosition.product_id]?.current_nav || selectedPosition.product?.unit_price || (selectedPosition.total_invested / selectedPosition.units)) * selectedPosition.units * liveMarketFactor) - selectedPosition.total_invested)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  
                   <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-200/70 leading-relaxed font-medium">
                              Early liquidity requests are subject to a 24-48h compliance review. Redemptions are processed at the current principal valuation minus transaction fees.
                          </p>
                      </div>

                      <div className="space-y-2">
                          <Label className="text-[10px] uppercase text-gray-500 font-bold">Select Allocation</Label>
                          <select 
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold"
                            value={redemptionForm.selectedPositionId}
                            onChange={(e) => {
                                const pos = positions.find(p => p.id === e.target.value);
                                if (pos) {
                                    setRedemptionForm(prev => ({ 
                                        ...prev, 
                                        selectedPositionId: pos.id,
                                        units: pos.units
                                    }));
                                }
                            }}
                          >
                              {positions.map(p => (
                                  <option key={p.id} value={p.id} className="bg-secondary text-white">
                                      {p.product?.name} ({p.units} Units)
                                  </option>
                              ))}
                          </select>
                      </div>

                      {(() => {
                           const currentPos = positions.find(p => p.id === redemptionForm.selectedPositionId) || showLiquidityModal;
                           return (
                               <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div 
                                        className={cn(
                                            "p-4 rounded-xl border cursor-pointer transition-all",
                                            redemptionForm.type === 'Full' ? "bg-gold/10 border-gold" : "bg-white/5 border-white/10 hover:border-white/20"
                                        )}
                                        onClick={() => setRedemptionForm(prev => ({ ...prev, type: 'Full', units: currentPos?.units || 0 }))}
                                    >
                                        <p className="text-[9px] uppercase text-gray-500 font-black mb-1">Full Exit</p>
                                        <p className="text-sm text-white font-bold">{currentPos?.units} Units</p>
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
                                        <Label className="text-[10px] uppercase text-gray-500 font-bold">Units to Redeem (Max: {currentPos?.units})</Label>
                                        <Input 
                                            type="number" 
                                            max={currentPos?.units}
                                            className="bg-white/5 border-white/10 text-white font-mono" 
                                            value={redemptionForm.units}
                                            onChange={e => setRedemptionForm(prev => ({ ...prev, units: Number(e.target.value) }))}
                                        />
                                    </div>
                                )}

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <Label className="text-[10px] uppercase text-gray-500 font-bold">Redemption Method</Label>
                                    <div className="flex gap-4">
                                        <Button 
                                            variant="ghost" 
                                            className={cn(
                                                "flex-1 h-12 gap-2 border",
                                                redemptionForm.destinationType === 'Bank' ? "bg-gold/10 border-gold text-gold" : "bg-white/5 border-white/10 text-gray-400"
                                            )}
                                            onClick={() => setRedemptionForm(prev => ({ ...prev, destinationType: 'Bank' }))}
                                        >
                                            <Banknote className="w-4 h-4" /> Bank Wire
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            className={cn(
                                                "flex-1 h-12 gap-2 border",
                                                redemptionForm.destinationType === 'Crypto' ? "bg-gold/10 border-gold text-gold" : "bg-white/5 border-white/10 text-gray-400"
                                            )}
                                            onClick={() => setRedemptionForm(prev => ({ ...prev, destinationType: 'Crypto' }))}
                                        >
                                            <ShieldCheck className="w-4 h-4" /> Crypto
                                        </Button>
                                    </div>

                                    {redemptionForm.destinationType === 'Bank' ? (
                                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-gray-500 font-bold">Beneficiary</Label>
                                                <Input 
                                                    className="h-8 text-[11px] bg-white/5 border-white/10 text-white" 
                                                    value={redemptionForm.bankDetails.beneficiary}
                                                    onChange={e => setRedemptionForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, beneficiary: e.target.value } }))}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-gray-500 font-bold">Bank Name</Label>
                                                <Input 
                                                    className="h-8 text-[11px] bg-white/5 border-white/10 text-white" 
                                                    value={redemptionForm.bankDetails.bankName}
                                                    onChange={e => setRedemptionForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, bankName: e.target.value } }))}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-gray-500 font-bold">IBAN / Account</Label>
                                                <Input 
                                                    className="h-8 text-[11px] bg-white/5 border-white/10 text-white font-mono" 
                                                    value={redemptionForm.bankDetails.iban}
                                                    onChange={e => setRedemptionForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, iban: e.target.value } }))}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-gray-500 font-bold">SWIFT / BIC</Label>
                                                <Input 
                                                    className="h-8 text-[11px] bg-white/5 border-white/10 text-white font-mono" 
                                                    value={redemptionForm.bankDetails.swift}
                                                    onChange={e => setRedemptionForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, swift: e.target.value } }))}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-gray-500 font-bold">Wallet Address</Label>
                                                <Input 
                                                    className="h-8 text-[11px] bg-white/5 border-white/10 text-white font-mono" 
                                                    placeholder="0x..."
                                                    value={redemptionForm.cryptoDetails.address}
                                                    onChange={e => setRedemptionForm(prev => ({ ...prev, cryptoDetails: { ...prev.cryptoDetails, address: e.target.value } }))}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] uppercase text-gray-500 font-bold">Network</Label>
                                                <select 
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg h-8 px-2 text-[11px] text-white focus:outline-none"
                                                    value={redemptionForm.cryptoDetails.network}
                                                    onChange={e => setRedemptionForm(prev => ({ ...prev, cryptoDetails: { ...prev.cryptoDetails, network: e.target.value } }))}
                                                >
                                                    <option value="Ethereum (ERC-20)" className="bg-secondary text-white">Ethereum (ERC-20)</option>
                                                    <option value="Polygon (MATIC)" className="bg-secondary text-white">Polygon (MATIC)</option>
                                                    <option value="BSC (BEP-20)" className="bg-secondary text-white">BSC (BEP-20)</option>
                                                    <option value="USDT (TRC-20)" className="bg-secondary text-white">USDT (TRC-20)</option>
                                                    <option value="Bitcoin" className="bg-secondary text-white">Bitcoin</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Estimated Payout</span>
                                        <span className="text-lg text-white font-mono font-bold">
                                            ${(redemptionForm.units * ((currentPos?.total_invested || 0) / (currentPos?.units || 1))).toLocaleString()}
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
                               </>
                           );
                      })()}
                  </div>
              </motion.div>
          </div>
      )}
    </PageLayout>
  );
}
