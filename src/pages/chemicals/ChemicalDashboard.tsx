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

    // Shipping Info State
    const [selectedOrderForShipping, setSelectedOrderForShipping] = React.useState<ChemicalOrder | null>(null);
    const [shippingDetails, setShippingDetails] = React.useState({
        address: "",
        city: "",
        zip: "",
        country: "",
        contactName: "",
        contactPhone: "",
        notes: ""
    });
    const [isSubmittingShipping, setIsSubmittingShipping] = React.useState(false);

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
        if (productId && products.length > 0 && !selectedProduct) {
            const product = products.find(p => p.id === productId);
            if (product) {
                setSelectedProduct(product);
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

    const handleSubmitShipping = async () => {
        if (!selectedOrderForShipping) return;

        // Simple validation
        if (!shippingDetails.address || !shippingDetails.city || !shippingDetails.contactName || !shippingDetails.contactPhone) {
            toast.error("Please fill in all required shipping fields.");
            return;
        }

        try {
            setIsSubmittingShipping(true);
            const { error } = await supabase
                .from('chemical_orders')
                .update({ 
                    shipping_info: shippingDetails
                })
                .eq('id', selectedOrderForShipping.id);
            
            if (error) throw error;
            
            toast.success("Shipping information provided successfully.");
            setShippingDetails({ address: "", city: "", zip: "", country: "", contactName: "", contactPhone: "", notes: "" });
            setSelectedOrderForShipping(null);
            fetchData(user.id);
        } catch (error) {
            console.error("Shipping info error:", error);
            toast.error("Failed to submit shipping information.");
        } finally {
            setIsSubmittingShipping(false);
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
                    <div className="space-y-8">
                        {/* Widgets / Overviews */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-secondary/40 border-white/5">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-gray-400 font-serif text-lg">Active Allocations</CardTitle>
                                        <Package className="w-5 h-5 text-gold opacity-50" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-mono text-white">{orders.filter(o => o.order_status !== 'Cancelled' && o.order_status !== 'Pending').length}</p>
                                    <p className="text-sm text-gray-500 mt-2">Currently in progress or delivered</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-secondary/40 border-white/5">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-gray-400 font-serif text-lg">Total Volume Value</CardTitle>
                                        <ArrowRight className="w-5 h-5 text-gold opacity-50" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-mono text-white">
                                        ${orders.reduce((sum, order) => sum + (order.order_status !== 'Cancelled' ? order.total_price : 0), 0).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">Lifetime acquired capital</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-secondary/40 border-white/5">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-gray-400 font-serif text-lg">Pending Actions</CardTitle>
                                        <ShieldAlert className="w-5 h-5 text-red-500 opacity-50" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-mono text-white">{orders.filter(o => o.payment_status === 'Pending' || o.payment_status === 'Awaiting Payment').length}</p>
                                    <p className="text-sm text-gray-500 mt-2">Orders requiring payment</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-secondary/40 border-white/5">
                            <CardHeader>
                                <CardTitle className="font-serif text-white">Recent Orders</CardTitle>
                                <CardDescription className="text-gray-400">Track and manage your chemical requisitions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="text-gray-500 w-[100px]">Order ID</TableHead>
                                            <TableHead className="text-gray-500">Product</TableHead>
                                            <TableHead className="text-gray-500">Quantity</TableHead>
                                            <TableHead className="text-gray-500">Total Price</TableHead>
                                            <TableHead className="text-gray-500">Logistics State</TableHead>
                                            <TableHead className="text-gray-500 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map((order) => {
                                            const orderDocs = documents.filter(d => d.order_id === order.id);
                                            return (
                                                <TableRow key={order.id} className="border-white/5 hover:bg-white/5 group">
                                                    <TableCell className="font-mono text-xs text-gray-400">#{order.id.split('-')[0].toUpperCase()}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="text-white font-medium">{order.product?.name}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{order.product?.category}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-white font-mono">{order.quantity} {order.product?.unit_type}</TableCell>
                                                    <TableCell className="text-white font-mono">${order.total_price.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-1.5">
                                                                {getStatusIcon(order.order_status)}
                                                                <span className={cn("px-2 py-0.5 rounded text-[10px] border tracking-widest uppercase font-bold", getStatusColor(order.order_status))}>
                                                                    {order.order_status}
                                                                </span>
                                                            </div>
                                                            {order.payment_status === 'Awaiting Payment' && (
                                                                <span className="text-[9px] text-red-400 uppercase tracking-widest flex items-center gap-1">
                                                                    <ShieldAlert className="w-3 h-3" /> Action Required: Payment
                                                                </span>
                                                            )}
                                                            {order.payment_status === 'Proof Submitted' && (
                                                                <span className="text-[9px] text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> Awaiting Admin Confirmation
                                                                </span>
                                                            )}
                                                            {order.order_status === 'Processing' && !order.shipping_info && (
                                                                <span className="text-[9px] text-orange-400 uppercase tracking-widest flex items-center gap-1">
                                                                    <Truck className="w-3 h-3" /> Action Required: Shipping Info
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-wrap items-center justify-end gap-2 mt-2">
                                                            {order.payment_status === 'Awaiting Payment' && (
                                                                <>
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm"
                                                                        onClick={() => setViewingPaymentFor(order)}
                                                                        className="h-8 text-[10px] uppercase tracking-widest border-gold/50 text-gold hover:bg-gold hover:text-black"
                                                                    >
                                                                        Instructions
                                                                    </Button>
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm"
                                                                        onClick={() => setSelectedOrderForProof(order)}
                                                                        className="h-8 text-[10px] uppercase tracking-widest border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white"
                                                                    >
                                                                        Upload Proof
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {order.order_status === 'Processing' && !order.shipping_info && (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => setSelectedOrderForShipping(order)}
                                                                    className="h-8 text-[10px] uppercase tracking-widest border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white"
                                                                >
                                                                    Provide Shipping Info
                                                                </Button>
                                                            )}
                                                            {orderDocs.map(doc => (
                                                                <Button
                                                                    key={doc.id}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                                                    onClick={() => window.open(doc.file_url, '_blank')}
                                                                    title={`View ${doc.type}`}
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                        {orders.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-gray-500 text-sm">
                                                    No orders found. Proceed to the marketplace to initiate an acquisition.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AccessGuard>
                
            {/* Order Dialog */}
            <Dialog open={!!selectedProduct} onOpenChange={(open) => {
                if (!open) {
                    setSelectedProduct(null);
                    if (searchParams.has('productId')) {
                        searchParams.delete('productId');
                        navigate({ search: searchParams.toString() }, { replace: true });
                    }
                }
            }}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white w-screen h-[100dvh] max-w-none m-0 p-4 sm:p-8 overflow-y-auto rounded-none flex flex-col">
                    <div className="w-full max-w-2xl mx-auto space-y-6 lg:mt-12">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-2xl lg:text-3xl border-b border-white/10 pb-4">
                                Reserve Allocation
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 pt-2 text-sm lg:text-base">
                                Secure your order for industrial chemical supply. Invoices will be generated upon confirmation.
                            </DialogDescription>
                        </DialogHeader>

                    {selectedProduct && (
                        <div className="space-y-8 py-4">
                            <div className="p-6 bg-secondary/50 border border-white/5 rounded-none space-y-4">
                                <h3 className="font-serif text-2xl text-gold">{selectedProduct.name}</h3>
                                <p className="text-base text-gray-400 flex justify-between border-b border-white/5 pb-2">
                                    <span>Rate:</span> 
                                    <span className="font-mono text-white">${selectedProduct.price_per_unit.toLocaleString()} / {selectedProduct.unit_type}</span>
                                </p>
                                <p className="text-base text-gray-400 flex justify-between pt-2">
                                    <span>Min Order:</span> 
                                    <span className="font-mono text-white">{selectedProduct.min_order.toLocaleString()} {selectedProduct.unit_type}</span>
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-sm uppercase tracking-widest text-gray-500 font-black">Select Product</Label>
                                    <Select 
                                        value={selectedProduct.id} 
                                        onValueChange={(val) => setSelectedProduct(products.find(p => p.id === val) || null)}
                                    >
                                        <SelectTrigger className="bg-black/40 border-white/10 text-white h-14 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10 text-white">
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id} className="text-base py-3">{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm uppercase tracking-widest text-gray-500 font-black">Quantity ({selectedProduct.unit_type})</Label>
                                    <Input 
                                        type="number" 
                                        placeholder={`Min. ${selectedProduct.min_order}`}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="bg-black/40 border-white/10 text-white font-mono h-14 text-lg"
                                        min={selectedProduct.min_order}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm uppercase tracking-widest text-gray-500 font-black">Settlement Method</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger className="bg-black/40 border-white/10 text-white h-14 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10 text-white">
                                            <SelectItem value="Crypto (USDT/USDC)" className="text-base py-3">Cryptocurrency (USDT/USDC)</SelectItem>
                                            <SelectItem value="Bank Wire Transfer" className="text-base py-3">Bank Wire Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {quantity && !isNaN(Number(quantity)) && Number(quantity) >= selectedProduct.min_order && (
                                    <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-center gap-4">
                                        <span className="text-lg text-gray-400">Total Calculation:</span>
                                        <span className="text-3xl font-serif text-gold">
                                            ${(Number(quantity) * selectedProduct.price_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-4 pt-8">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => {
                                        setSelectedProduct(null);
                                        if (searchParams.has('productId')) {
                                            searchParams.delete('productId');
                                            navigate({ search: searchParams.toString() }, { replace: true });
                                        }
                                    }} 
                                    className="text-gray-400 hover:text-white h-14 px-8 text-base"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handlePlaceOrder}
                                    className="bg-gold hover:bg-gold-dark text-black font-bold h-14 px-12 text-base uppercase tracking-widest"
                                    disabled={!quantity || isNaN(Number(quantity)) || Number(quantity) < selectedProduct.min_order || isOrdering}
                                >
                                    {isOrdering ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Order"}
                                </Button>
                            </div>
                        </div>
                    )}
                    </div>
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

            {/* Shipping Info Dialog */}
            <Dialog open={!!selectedOrderForShipping} onOpenChange={(open) => !open && setSelectedOrderForShipping(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="font-serif">Provide Shipping Information</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Submit your desired delivery address and shipping instructions for Order #{selectedOrderForShipping?.id.split('-')[0]}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Contact Name *</Label>
                                <Input value={shippingDetails.contactName} onChange={(e) => setShippingDetails({...shippingDetails, contactName: e.target.value})} className="bg-black/40 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Contact Phone *</Label>
                                <Input value={shippingDetails.contactPhone} onChange={(e) => setShippingDetails({...shippingDetails, contactPhone: e.target.value})} className="bg-black/40 border-white/10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Address *</Label>
                            <Input value={shippingDetails.address} onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})} className="bg-black/40 border-white/10" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">City *</Label>
                                <Input value={shippingDetails.city} onChange={(e) => setShippingDetails({...shippingDetails, city: e.target.value})} className="bg-black/40 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Zip/Postal</Label>
                                <Input value={shippingDetails.zip} onChange={(e) => setShippingDetails({...shippingDetails, zip: e.target.value})} className="bg-black/40 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Country</Label>
                                <Input value={shippingDetails.country} onChange={(e) => setShippingDetails({...shippingDetails, country: e.target.value})} className="bg-black/40 border-white/10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-gray-500 font-black">Additional Notes</Label>
                            <textarea 
                                placeholder="Instructions for delivery..." 
                                value={shippingDetails.notes}
                                onChange={(e) => setShippingDetails({...shippingDetails, notes: e.target.value})}
                                className="w-full flex min-h-[80px] border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" onClick={() => setSelectedOrderForShipping(null)} className="text-gray-400">Cancel</Button>
                            <Button 
                                onClick={handleSubmitShipping}
                                className="bg-gold text-black font-bold"
                                disabled={isSubmittingShipping}
                            >
                                {isSubmittingShipping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Info"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Settlement Instructions Dialog */}
            <Dialog open={!!viewingPaymentFor} onOpenChange={(open) => !open && setViewingPaymentFor(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white md:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="p-6 border-b border-white/10 bg-black/20 shrink-0">
                        <DialogTitle className="font-serif text-2xl flex items-center gap-3">
                            <ShieldAlert className="w-6 h-6 text-gold" />
                            Settlement Instructions
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 space-y-4">
                        <p className="text-gray-400 text-sm">
                            Payment for Request: #{viewingPaymentFor?.id.split('-')[0].toUpperCase()}
                            <br />
                            Amount Due: <span className="text-gold font-bold">${viewingPaymentFor?.total_price.toLocaleString()}</span>
                        </p>
                        
                        <div className="p-4 bg-black/60 border border-white/5 rounded-lg">
                            <p className="text-sm font-mono text-gray-300 whitespace-pre-line">{viewingPaymentFor?.payment_instructions || 'Please contact support for payment instructions.'}</p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 flex justify-end gap-4">
                        <Button variant="ghost" onClick={() => setViewingPaymentFor(null)} className="text-gray-400">Close</Button>
                        <Button 
                            onClick={() => generateChemicalDocument('Instructions', viewingPaymentFor!)}
                            className="bg-gold text-black font-bold uppercase tracking-widest"
                        >
                            <FileDown className="w-4 h-4 mr-2" /> Download Document
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
