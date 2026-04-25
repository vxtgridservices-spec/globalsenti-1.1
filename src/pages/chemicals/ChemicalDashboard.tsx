import * as React from "react";
import { AccessGuard } from "@/src/components/security/AccessGuard";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { ChemicalProduct, ChemicalOrder, ChemicalDocument } from "@/src/types/chemicals";
import { Package, FileText, CheckCircle2, FlaskConical, Clock, Truck, ShieldAlert, ArrowRight, Loader2, UploadCloud, Download, FileDown, Copy } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { generateChemicalDocument } from "@/src/services/chemicalPdfService";

export function ChemicalDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [user, setUser] = React.useState<any>(null);
    const [products, setProducts] = React.useState<ChemicalProduct[]>([]);
    const [orders, setOrders] = React.useState<ChemicalOrder[]>([]);
    const [documents, setDocuments] = React.useState<ChemicalDocument[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    // Order Form State
    const [isOrdering, setIsOrdering] = React.useState(false);
    const [selectedProduct, setSelectedProduct] = React.useState<ChemicalProduct | null>(null);
    const [quantity, setQuantity] = React.useState<string>("");
    const [paymentMethod, setPaymentMethod] = React.useState<string>("Crypto (USDT/USDC)");

    // Proof Upload State
    const [selectedOrderForProof, setSelectedOrderForProof] = React.useState<ChemicalOrder | null>(null);
    const [proofHash, setProofHash] = React.useState("");
    const [isUploadingProof, setIsUploadingProof] = React.useState(false);

    // Settlement Details State
    const [viewingPaymentFor, setViewingPaymentFor] = React.useState<ChemicalOrder | null>(null);

    React.useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/portal');
                return;
            }
            setUser(user);
            fetchData(user.id);
        };
        checkAuth();
    }, [navigate]);

    // Handle auto-order from URL params
    React.useEffect(() => {
        const productId = searchParams.get('productId');
        if (productId && products.length > 0) {
            const product = products.find(p => p.id === productId);
            if (product) {
                setSelectedProduct(product);
                setIsOrdering(true);
            }
        }
    }, [searchParams, products]);

    const fetchData = async (userId: string) => {
        try {
            setLoading(true);
            const [productRes, orderRes, profileRes] = await Promise.all([
                supabase.from('chemical_products').select('*').eq('status', 'Active'),
                supabase.from('chemical_orders').select('*, product:chemical_products(*)').eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.from('profiles').select('id, full_name, email').eq('id', userId).single()
            ]);

            if (productRes.data) setProducts(productRes.data);
            if (orderRes.data) {
                // Attach profile to each order manually to avoid FK join issues
                const profileData = profileRes.data;
                const ordersWithProfile = orderRes.data.map(o => ({
                    ...o,
                    profile: profileData ? {
                        ...profileData,
                        full_name: profileData.full_name || 'Valued Client',
                        email: profileData.email || 'N/A'
                    } : { full_name: 'Valued Client', email: 'N/A', id: userId }
                }));
                setOrders(ordersWithProfile);
                
                if (orderRes.data.length > 0) {
                    const orderIds = orderRes.data.map(o => o.id);
                    const { data: docs } = await supabase.from('chemical_documents').select('*').in('order_id', orderIds);
                    if (docs) setDocuments(docs);
                }
            }
        } catch (error) {
            console.error("Error fetching chemical data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedProduct || !quantity || isNaN(Number(quantity))) return;
        const numQty = Number(quantity);
        if (numQty < selectedProduct.min_order) {
            toast.error(`Minimum order quantity is ${selectedProduct.min_order} ${selectedProduct.unit_type}`);
            return;
        }

        try {
            setIsOrdering(true);
            const totalPrice = numQty * selectedProduct.price_per_unit;
            
            const { error } = await supabase.from('chemical_orders').insert([{
                user_id: user.id,
                product_id: selectedProduct.id,
                quantity: numQty,
                total_price: totalPrice,
                payment_method: paymentMethod,
                payment_status: 'Pending',
                order_status: 'Pending'
            }]);

            if (error) throw error;
            
            setSelectedProduct(null);
            setQuantity("");
            toast.success("Order placed successfully. Please proceed with payment.");
            fetchData(user.id);
        } catch (error) {
            console.error("Order error:", error);
            toast.error("Failed to place order.");
        } finally {
            setIsOrdering(false);
        }
    };

    const handleUploadProof = async () => {
        if (!selectedOrderForProof || !proofHash) return;
        try {
            setIsUploadingProof(true);
            const { error } = await supabase
                .from('chemical_orders')
                .update({ 
                    payment_proof_hash: proofHash,
                    payment_status: 'Proof Submitted'
                })
                .eq('id', selectedOrderForProof.id);
            
            if (error) throw error;
            
            toast.success("Payment proof uploaded. Admin will verify shortly.");
            setProofHash("");
            setSelectedOrderForProof(null);
            fetchData(user.id);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload proof.");
        } finally {
            setIsUploadingProof(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'Awaiting Payment': return <ShieldAlert className="w-4 h-4 text-orange-500" />;
            case 'Proof Submitted': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
            case 'Confirmed': return <ShieldAlert className="w-4 h-4 text-blue-500" />;
            case 'Processing': return <FlaskConical className="w-4 h-4 text-purple-500" />;
            case 'Shipped': return <Truck className="w-4 h-4 text-orange-500" />;
            case 'Delivered': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case 'Awaiting Payment': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            case 'Proof Submitted': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case 'Confirmed': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case 'Processing': return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case 'Shipped': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            case 'Delivered': return "bg-green-500/10 text-green-500 border-green-500/20";
            default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
        }
    };

    if (loading) {
        return (
            <PageLayout title="Client Dashboard" subtitle="Chemical Division">
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Chemical Operations" subtitle="Manage your industrial allocations and orders.">
            <AccessGuard section="chemicals">
                <div className="container mx-auto px-4 py-8">
                    {/* (Content here...) */}
                </div>
            </AccessGuard>
                
            {/* Order Dialog */}
            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl border-b border-white/10 pb-4">
                            Reserve Allocation
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 pt-2">
                            Secure your order for industrial chemical supply. Invoices will be generated upon confirmation.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProduct && (
                        <div className="space-y-6 pt-4">
                            <div className="p-4 bg-secondary/50 border border-white/5 rounded-lg space-y-2">
                                <h3 className="font-serif text-lg text-gold">{selectedProduct.name}</h3>
                                <p className="text-sm text-gray-400 flex justify-between">
                                    <span>Rate:</span> 
                                    <span className="font-mono text-white">${selectedProduct.price_per_unit.toLocaleString()} / {selectedProduct.unit_type}</span>
                                </p>
                                <p className="text-sm text-gray-400 flex justify-between">
                                    <span>Min Order:</span> 
                                    <span className="font-mono text-white">{selectedProduct.min_order.toLocaleString()} {selectedProduct.unit_type}</span>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Select Product</Label>
                                    <Select 
                                        value={selectedProduct.id} 
                                        onValueChange={(val) => setSelectedProduct(products.find(p => p.id === val) || null)}
                                    >
                                        <SelectTrigger className="bg-black/40 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10 text-white">
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Quantity ({selectedProduct.unit_type})</Label>
                                    <Input 
                                        type="number" 
                                        placeholder={`Min. ${selectedProduct.min_order}`}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="bg-black/40 border-white/10 text-white font-mono"
                                        min={selectedProduct.min_order}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Settlement Method</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger className="bg-black/40 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10 text-white">
                                            <SelectItem value="Crypto (USDT/USDC)">Cryptocurrency (USDT/USDC)</SelectItem>
                                            <SelectItem value="Bank Wire Transfer">Bank Wire Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {quantity && !isNaN(Number(quantity)) && Number(quantity) >= selectedProduct.min_order && (
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Total Calculation:</span>
                                        <span className="text-2xl font-serif text-gold">
                                            ${(Number(quantity) * selectedProduct.price_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="ghost" onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-white">Cancel</Button>
                                <Button 
                                    onClick={handlePlaceOrder}
                                    className="bg-gold hover:bg-gold-dark text-black font-bold h-10 px-8"
                                    disabled={!quantity || isNaN(Number(quantity)) || Number(quantity) < selectedProduct.min_order || isOrdering}
                                >
                                    {isOrdering ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Order"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Upload Proof Dialog */}
            <Dialog open={!!selectedOrderForProof} onOpenChange={(open) => !open && setSelectedOrderForProof(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="font-serif">Upload Payment Proof</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Submit transaction hash or reference number to verify your payment for Order #{selectedOrderForProof?.id.split('-')[0]}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Transaction Hash / Reference</Label>
                            <Input 
                                placeholder="0x..." 
                                value={proofHash}
                                onChange={(e) => setProofHash(e.target.value)}
                                className="bg-black/40 border-white/10 text-white font-mono"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" onClick={() => setSelectedOrderForProof(null)} className="text-gray-400">Cancel</Button>
                            <Button 
                                onClick={handleUploadProof}
                                className="bg-gold text-black font-bold"
                                disabled={!proofHash || isUploadingProof}
                            >
                                {isUploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Proof"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Settlement Instructions Dialog */}
            <Dialog open={!!viewingPaymentFor} onOpenChange={(open) => !open && setViewingPaymentFor(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white md:max-w-[95vw] md:w-[95vw] h-[95vh] md:h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-white/10 bg-black/20 shrink-0">
                        <DialogTitle className="font-serif text-3xl flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8 text-gold" />
                            Official Settlement Instructions
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-base">
                            Payment for Request ID: <span className="font-mono text-white">#{viewingPaymentFor?.id.split('-')[0].toUpperCase()}</span>. 
                            Amount Due: <span className="text-gold font-bold text-lg ml-2">${viewingPaymentFor?.total_price.toLocaleString()}</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-gradient-to-b from-transparent to-black/40">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="space-y-6">
                                {viewingPaymentFor?.payment_instructions?.split('\n').map((line, idx) => {
                                    if (!line.trim()) return <div key={idx} className="h-4"></div>;
                                    
                                    if (line.startsWith('Note:')) {
                                        return (
                                            <div key={idx} className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-4 items-start shadow-xl shadow-red-500/5">
                                                <ShieldAlert className="w-6 h-6 text-red-500 mt-1 shrink-0" />
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black uppercase tracking-widest text-red-500">Security Warning</p>
                                                    <p className="text-sm text-red-200 leading-relaxed">{line.replace('Note:', '').trim()}</p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const parts = line.split(':');
                                    if (parts.length >= 2) {
                                        const key = parts[0].trim();
                                        const value = parts.slice(1).join(':').trim();
                                        return (
                                            <div key={idx} className="flex flex-col gap-2 group">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">{key}</span>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                <div className="flex items-center justify-between bg-black/60 border border-white/5 p-4 rounded-xl group-hover:border-gold/30 transition-all shadow-inner">
                                                    <span className="text-lg font-mono text-gray-100 break-all leading-tight">{value}</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-10 w-10 shrink-0 hover:bg-gold hover:text-black transition-all ml-4"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(value);
                                                            toast.success(`${key} copied to clipboard`);
                                                        }}
                                                    >
                                                        <Copy className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (line.toUpperCase().includes('PAYMENT METHOD')) {
                                        return (
                                            <div key={idx} className="p-4 bg-gold/5 border border-gold/10 rounded-lg flex items-center justify-center gap-4 mb-4">
                                                <div className="h-px flex-1 bg-gold/20" />
                                                <span className="text-sm font-black uppercase tracking-[0.3em] text-gold">{line}</span>
                                                <div className="h-px flex-1 bg-gold/20" />
                                            </div>
                                        );
                                    }

                                    return <div key={idx} className="text-sm font-mono text-gray-400 py-2 border-l-2 border-white/5 pl-4">{line}</div>;
                                })}
                            </div>

                            <div className="pt-8 space-y-4">
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                    <p className="text-xs text-blue-400/80 leading-relaxed italic text-center">
                                        All transactions are monitored for compliance. Please ensure the exact amount is transferred to avoid processing delays.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                        <Button 
                            variant="outline" 
                            onClick={() => generateChemicalDocument('Instructions', viewingPaymentFor!)}
                            className="w-full sm:w-auto border-white/10 text-white hover:bg-gold hover:text-black hover:border-gold h-12 px-8 font-bold transition-all"
                        >
                            <FileDown className="w-5 h-5 mr-2" /> Download Document (PDF)
                        </Button>
                        <Button onClick={() => setViewingPaymentFor(null)} className="w-full sm:w-auto bg-gold text-black font-black uppercase tracking-widest h-12 px-12 hover:bg-gold-dark transition-all shadow-lg shadow-gold/10">
                            Close & Settle
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
