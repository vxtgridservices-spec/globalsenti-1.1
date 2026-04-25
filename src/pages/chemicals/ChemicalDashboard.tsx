import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { supabase } from "@/src/lib/supabase";
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
            alert(`Minimum order quantity is ${selectedProduct.min_order} ${selectedProduct.unit_type}`);
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
            alert("Order placed successfully. Please proceed with payment.");
            fetchData(user.id);
        } catch (error) {
            console.error("Order error:", error);
            alert("Failed to place order.");
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
            
            alert("Payment proof uploaded. Admin will verify shortly.");
            setProofHash("");
            setSelectedOrderForProof(null);
            fetchData(user.id);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload proof.");
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
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-end mb-8">
                    <Button onClick={() => setSelectedProduct(products[0])} className="bg-gold hover:bg-gold-dark text-black font-black uppercase tracking-widest text-xs">
                        <Package className="w-4 h-4 mr-2" /> New Order
                    </Button>
                </div>

                {orders.length === 0 ? (
                    <Card className="bg-black/40 border border-white/5 py-16 text-center">
                        <FlaskConical className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-white font-serif mb-2">No Active Orders</h3>
                        <p className="text-gray-400 mb-6">You have not placed any chemical orders yet.</p>
                        <Button onClick={() => setSelectedProduct(products[0])} className="bg-gold hover:bg-gold-dark text-black font-bold">
                            View Catalog
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {orders.map(order => {
                            const orderDocs = documents.filter(d => d.order_id === order.id);
                            return (
                                <Card key={order.id} className="bg-secondary/40 border-white/5 overflow-hidden">
                                    <CardHeader className="border-b border-white/5 bg-black/20 pb-4">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 font-mono">
                                                        Order #{order.id.split('-')[0]}
                                                    </span>
                                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 border", getStatusColor(order.order_status))}>
                                                        {getStatusIcon(order.order_status)} {order.order_status}
                                                    </span>
                                                </div>
                                                <CardTitle className="text-lg text-white font-serif">
                                                    {order.product?.name}
                                                </CardTitle>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Total Value</p>
                                                <p className="text-lg font-mono text-gold font-bold">${order.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid md:grid-cols-3 gap-8">
                                            {/* Details */}
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">Allocation Size</p>
                                                    <p className="text-white font-mono">{order.quantity.toLocaleString()} {order.product?.unit_type}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">Price per Unit</p>
                                                    <p className="text-white font-mono">${order.product?.price_per_unit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">Date Ordered</p>
                                                    <p className="text-white">{new Date(order.created_at!).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            {/* Payment Status */}
                                            <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">Payment Status</p>
                                                    <span className={cn(
                                                        "text-xs font-bold px-2 py-1 rounded inline-block mt-1",
                                                        order.payment_status === 'Verified' ? "bg-green-500/10 text-green-500" : 
                                                        order.payment_status === 'Rejected' ? "bg-red-500/10 text-red-500" : 
                                                        order.payment_status === 'Proof Submitted' ? "bg-blue-500/10 text-blue-500" : "bg-yellow-500/10 text-yellow-500"
                                                    )}>{order.payment_status}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">Method</p>
                                                    <p className="text-white text-sm">{order.payment_method}</p>
                                                </div>
                                                
                                                <div className="flex flex-col gap-2 mt-2">
                                                    {order.payment_instructions && (
                                                        <div className="space-y-1">
                                                            <Button 
                                                                variant="default" 
                                                                size="sm"
                                                                onClick={() => setViewingPaymentFor(order)}
                                                                className="bg-gold hover:bg-gold/90 text-black w-full text-xs font-bold"
                                                            >
                                                                View Settlement Details
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => generateChemicalDocument('Instructions', order)}
                                                                className="border-white/10 text-white hover:bg-white/5 w-full text-[10px] h-7"
                                                            >
                                                                <FileDown className="w-3 h-3 mr-1" /> Download Instructions PDF
                                                            </Button>
                                                        </div>
                                                    )}
                                                    
                                                    {order.payment_instructions && order.payment_status !== 'Verified' && order.payment_status !== 'Proof Submitted' && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => setSelectedOrderForProof(order)}
                                                            className="border-white/10 text-white hover:bg-white/5 w-full text-[10px]"
                                                        >
                                                            <UploadCloud className="w-3 h-3 mr-2" /> Upload Transfer Proof
                                                        </Button>
                                                    )}

                                                    {order.payment_status === 'Verified' && (
                                                        <div className="grid grid-cols-2 gap-1 px-1">
                                                            <Button variant="ghost" size="sm" onClick={() => generateChemicalDocument('Invoice', order)} className="text-[10px] text-gray-400 hover:text-white h-6 px-1">
                                                                <FileDown className="w-2.5 h-2.5 mr-1" /> Proforma
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => generateChemicalDocument('Agreement', order)} className="text-[10px] text-gray-400 hover:text-white h-6 px-1">
                                                                <FileDown className="w-2.5 h-2.5 mr-1" /> Agreement
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                {order.payment_status === 'Proof Submitted' && (
                                                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Status: Processing</p>
                                                        <p className="text-xs text-blue-200">Payment proof received. Our finance team is verifying the settlement.</p>
                                                    </div>
                                                )}
                                                
                                                {order.payment_status === 'Pending' && !order.payment_instructions && (
                                                    <p className="text-[10px] text-gray-500 italic mt-2">Awaiting payment instructions from admin.</p>
                                                )}
                                            </div>

                                            {/* Documents */}
                                            <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
                                                <p className="text-[10px] text-gray-500 uppercase font-black">Order Documents</p>
                                                <div className="space-y-2">
                                                    {/* Real documents from database */}
                                                    {orderDocs.map(doc => (
                                                        <a 
                                                            key={doc.id} 
                                                            href={doc.file_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5 hover:border-gold/30 transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-gold transition-colors" />
                                                                <span className="text-xs text-white group-hover:text-gold transition-colors">{doc.title}</span>
                                                            </div>
                                                            <Download className="w-3 h-3 text-gray-500 group-hover:text-gold" />
                                                        </a>
                                                    ))}

                                                    {/* Virtual/Generated documents */}
                                                    {order.payment_instructions && (
                                                        <button 
                                                            onClick={() => generateChemicalDocument('Instructions', order)}
                                                            className="w-full flex items-center justify-between p-2 rounded bg-gold/5 border border-gold/10 hover:border-gold/50 transition-colors group text-left"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <FileDown className="w-3.5 h-3.5 text-gold/60 group-hover:text-gold" />
                                                                <span className="text-xs text-gold/90 group-hover:text-gold">Settlement Instructions (PDF)</span>
                                                            </div>
                                                            <Download className="w-3 h-3 text-gold/40 group-hover:text-gold" />
                                                        </button>
                                                    )}

                                                    {order.payment_status === 'Verified' && (
                                                        <>
                                                            <button 
                                                                onClick={() => generateChemicalDocument('Invoice', order)}
                                                                className="w-full flex items-center justify-between p-2 rounded bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/50 transition-colors group text-left"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <FileDown className="w-3.5 h-3.5 text-blue-400/60 group-hover:text-blue-400" />
                                                                    <span className="text-xs text-blue-400/90 group-hover:text-blue-400">Proforma Invoice (PDF)</span>
                                                                </div>
                                                                <Download className="w-3 h-3 text-blue-400/40 group-hover:text-blue-400" />
                                                            </button>
                                                            <button 
                                                                onClick={() => generateChemicalDocument('Agreement', order)}
                                                                className="w-full flex items-center justify-between p-2 rounded bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/50 transition-colors group text-left"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <FileDown className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-purple-400" />
                                                                    <span className="text-xs text-purple-400/90 group-hover:text-purple-400">Purchase Agreement (PDF)</span>
                                                                </div>
                                                                <Download className="w-3 h-3 text-purple-400/40 group-hover:text-purple-400" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {orderDocs.length === 0 && !order.payment_instructions && (
                                                        <p className="text-xs text-gray-500 italic">No documents attached yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

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
                                                            alert(`${key} copied to clipboard`);
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
