import * as React from "react";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { supabase } from "@/src/lib/supabase";
import { ChemicalProduct, ChemicalOrder, ChemicalDocument } from "@/src/types/chemicals";
import { Loader2, PackagePlus, FileText, CheckCircle, Database, FlaskConical, Copy, Check, FileDown, ShieldCheck, X } from "lucide-react";
import { generateChemicalDocument } from "@/src/services/chemicalPdfService";
import { RichTextEditor } from "@/src/components/ui/RichTextEditor";

const INIT_SQL = `
-- 1. Tables Migration / Creation
CREATE TABLE IF NOT EXISTS public.chemical_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    product_code TEXT,
    category TEXT NOT NULL,
    description TEXT,
    rich_description TEXT,
    price_per_unit NUMERIC NOT NULL,
    unit_type TEXT NOT NULL,
    min_order NUMERIC DEFAULT 1,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure rich_description, image_url, and product_code columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chemical_products' AND column_name='rich_description') THEN
        ALTER TABLE public.chemical_products ADD COLUMN rich_description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chemical_products' AND column_name='image_url') THEN
        ALTER TABLE public.chemical_products ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chemical_products' AND column_name='product_code') THEN
        ALTER TABLE public.chemical_products ADD COLUMN product_code TEXT;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

CREATE TABLE IF NOT EXISTS public.chemical_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.chemical_products(id) ON DELETE CASCADE,
    user_id UUID,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add policies for reviews
ALTER TABLE public.chemical_reviews ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chemical_reviews' AND policyname = 'Anyone can view reviews') THEN
        CREATE POLICY "Anyone can view reviews" ON public.chemical_reviews FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chemical_reviews' AND policyname = 'Anyone can post reviews') THEN
        CREATE POLICY "Anyone can post reviews" ON public.chemical_reviews FOR INSERT WITH CHECK (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.chemical_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    product_id UUID NOT NULL REFERENCES public.chemical_products(id),
    quantity NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'Pending',
    order_status TEXT DEFAULT 'Pending',
    payment_proof_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure payment_instructions column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chemical_orders' AND column_name='payment_instructions') THEN
        ALTER TABLE public.chemical_orders ADD COLUMN payment_instructions TEXT;
    END IF;
END $$;

-- Ensure foreign key to profiles exists for easier joining (optional but helpful)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='chemical_orders' AND constraint_type='FOREIGN KEY' AND constraint_name='chemical_orders_user_id_fkey_profiles') THEN
            ALTER TABLE public.chemical_orders ADD CONSTRAINT chemical_orders_user_id_fkey_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id);
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.chemical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.chemical_orders(id),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Security (RLS)
ALTER TABLE public.chemical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chemical_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chemical_documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic setup for chemical hero image if not exists
INSERT INTO public.site_settings (key, value)
VALUES ('chemical_hero_image', '{"url": "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2070&auto=format&fit=crop"}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public View Settings" ON public.site_settings;
CREATE POLICY "Public View Settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Manage Settings" ON public.site_settings;
CREATE POLICY "Admin Manage Settings" ON public.site_settings FOR ALL USING (true);

-- Policies
DROP POLICY IF EXISTS "Public View Products" ON public.chemical_products;
CREATE POLICY "Public View Products" ON public.chemical_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Products" ON public.chemical_products;
CREATE POLICY "Admin Manage Products" ON public.chemical_products FOR ALL USING (true);

DROP POLICY IF EXISTS "Users View Own Orders" ON public.chemical_orders;
CREATE POLICY "Users View Own Orders" ON public.chemical_orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Create Orders" ON public.chemical_orders;
CREATE POLICY "Users Create Orders" ON public.chemical_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Update Own Orders" ON public.chemical_orders;
CREATE POLICY "Users Update Own Orders" ON public.chemical_orders FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin Manage Orders" ON public.chemical_orders;
CREATE POLICY "Admin Manage Orders" ON public.chemical_orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Users View Own Docs" ON public.chemical_documents;
CREATE POLICY "Users View Own Docs" ON public.chemical_documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chemical_orders o WHERE o.id = chemical_documents.order_id AND o.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin Manage Docs" ON public.chemical_documents;
CREATE POLICY "Admin Manage Docs" ON public.chemical_documents FOR ALL USING (true);
`;

export function AdminChemicals() {
    const [products, setProducts] = React.useState<ChemicalProduct[]>([]);
    const [orders, setOrders] = React.useState<ChemicalOrder[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    // UI State
    const [activeTab, setActiveTab] = React.useState<'orders'|'products'|'settings'>('orders');
    
    // Site Settings State
    const [siteSettings, setSiteSettings] = React.useState<any>({});
    const [pendingSettings, setPendingSettings] = React.useState<any>({});
    const [savingSettings, setSavingSettings] = React.useState(false);
    
    // Modals
    const [showDBModal, setShowDBModal] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState<Partial<ChemicalProduct> | null>(null);
    const [uploadingDocFor, setUploadingDocFor] = React.useState<ChemicalOrder | null>(null);
    const [editingPaymentFor, setEditingPaymentFor] = React.useState<ChemicalOrder | null>(null);
    const [docForm, setDocForm] = React.useState({ title: "", url: "", type: "Invoice" });
    const [paymentInstructions, setPaymentInstructions] = React.useState("");
    const [copied, setCopied] = React.useState(false);
    const [viewingProofHash, setViewingProofHash] = React.useState<string | null>(null);
    
    // Settlement Detail States
    const [bankDetails, setBankDetails] = React.useState({ bankName: "", accountNumber: "", routingNumber: "", beneficiary: "GLOBAL SENTINEL GROUP" });
    const [cryptoDetails, setCryptoDetails] = React.useState({ address: "", network: "" });

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        console.log("Fetching Chemical Operations Data...");
        try {
            const [pRes, oRes, sRes] = await Promise.all([
                supabase.from('chemical_products').select('*').order('created_at', { ascending: false }),
                supabase.from('chemical_orders').select(`
                    *,
                    product:chemical_products(*),
                    profile:profiles(id, full_name, email)
                `).order('created_at', { ascending: false }),
                supabase.from('site_settings').select('*')
            ]);
            
            if (sRes.data) {
                const settingsMap = new Map(sRes.data.map(s => [s.key, s.value]));
                setSiteSettings(Object.fromEntries(settingsMap));
            }
            
            if (pRes.error) console.error("Products fetch error:", pRes.error);
            if (pRes.data) {
                console.log(`Fetched ${pRes.data.length} products`);
                setProducts(pRes.data);
            }

            if (oRes.error) {
                console.error("Orders fetch error (with join):", oRes.error);
                // Fallback attempt: fetch without profiles join
                console.log("Attempting fallback fetch without profiles join...");
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('chemical_orders')
                    .select('*, product:chemical_products(*)')
                    .order('created_at', { ascending: false });
                
                if (fallbackError) {
                    console.error("Orders fallback fetch error:", fallbackError);
                } else if (fallbackData) {
                    console.log(`Fetched ${fallbackData.length} orders (fallback mode)`);
                    
                    // Manually fetch all profiles across these orders to patch the missing references
                    const userIds = Array.from(new Set(fallbackData.map(o => o.user_id).filter(id => id)));
                    
                    if (userIds.length > 0) {
                        const { data: userProfiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
                        const profileMap = new Map((userProfiles || []).map(p => [p.id, p]));
                        
                        const patchedOrders = fallbackData.map(o => {
                            const p = o.user_id ? profileMap.get(o.user_id) : undefined;
                            return {
                                ...o,
                                profile: p ? {
                                    id: p.id,
                                    full_name: p.full_name || 'Valued Client',
                                    email: p.email || 'N/A'
                                } : { full_name: 'Valued Client', email: 'N/A' }
                            };
                        });
                        setOrders(patchedOrders);
                    } else {
                        setOrders(fallbackData);
                    }
                }
            } else if (oRes.data) {
                console.log(`Fetched ${oRes.data.length} orders`);
                const patched = oRes.data.map(o => ({
                    ...o,
                    profile: o.profile ? {
                        id: (o.profile as any).id,
                        full_name: (o.profile as any).full_name || 'Valued Client',
                        email: (o.profile as any).email || 'N/A'
                    } : { full_name: 'Valued Client', email: 'N/A' }
                }));
                setOrders(patched);
            }

        } catch (error) {
            console.error("Unexpected fetch error:", error);
        }
        setLoading(false);
    };

    const handleSaveProduct = async () => {
        if (!editingProduct?.name || !editingProduct?.price_per_unit) {
            alert("Please provide at least a name and price.");
            return;
        }
        
        const payload = {
            name: editingProduct.name,
            product_code: editingProduct.product_code || null,
            category: editingProduct.category || "Industrial",
            description: editingProduct.description || "",
            rich_description: editingProduct.rich_description || "",
            image_url: editingProduct.image_url || null,
            price_per_unit: Number(editingProduct.price_per_unit),
            unit_type: editingProduct.unit_type || "MT",
            min_order: Number(editingProduct.min_order || 1),
            status: editingProduct.status || "Active"
        };

        const { error } = editingProduct.id 
            ? await supabase.from('chemical_products').update(payload).eq('id', editingProduct.id)
            : await supabase.from('chemical_products').insert([payload]);

        if (error) {
            console.error("Save error:", error);
            alert(`Error saving product: ${error.message}\n\nMake sure you have run the Sync SQL script in your Supabase SQL Editor.`);
        } else {
            setEditingProduct(null);
            fetchData();
            alert("Product saved successfully.");
        }
    };

    const handleUpdateOrderStatus = async (id: string, status: string, field: 'order_status' | 'payment_status') => {
        await supabase.from('chemical_orders').update({ [field]: status }).eq('id', id);
        fetchData();
    };

    const handleSavePaymentInstructions = async () => {
        if (!editingPaymentFor) return;
        
        let instructions = paymentInstructions;
        const isCrypto = ['crypto', 'usdt', 'usdc', 'bitcoin', 'eth'].some(k => editingPaymentFor.payment_method?.toLowerCase().includes(k));
        if (!instructions) {
            if (isCrypto) {
                instructions = `PAYMENT METHOD: CRYPTO\nNETWORK: ${cryptoDetails.network}\nADDRESS: ${cryptoDetails.address}\n\nNote: Send exactly the total amount. Assets sent to wrong network will be lost.`;
            } else {
                instructions = `PAYMENT METHOD: BANK TRANSFER\nBANK: ${bankDetails.bankName}\nBENEFICIARY: ${bankDetails.beneficiary}\nACCOUNT: ${bankDetails.accountNumber}\nROUTING/IBAN: ${bankDetails.routingNumber}\n\nNote: Please include the Order ID in the reference field.`;
            }
        }

        const { error } = await supabase.from('chemical_orders').update({ 
            payment_instructions: instructions,
            payment_status: 'Awaiting Payment'
        }).eq('id', editingPaymentFor.id);
        
        if (error) {
            alert("Error updating instructions: " + error.message);
        } else {
            setEditingPaymentFor(null);
            fetchData();
            alert("Payment instructions sent to buyer.");
        }
    };

    const handleUploadDoc = async () => {
        if (!uploadingDocFor || !docForm.title || !docForm.url) return;
        await supabase.from('chemical_documents').insert([{
            order_id: uploadingDocFor.id,
            title: docForm.title,
            file_url: docForm.url,
            type: docForm.type
        }]);
        setUploadingDocFor(null);
        setDocForm({ title: "", url: "", type: "Invoice" });
        alert("Document attached to order.");
    };

    const handlePendingSettingChange = (key: string, value: any) => {
        setPendingSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveAllSettings = async () => {
        setSavingSettings(true);
        let hasError = false;
        
        for (const key of Object.keys(pendingSettings)) {
            const { error } = await supabase.from('site_settings').upsert({ 
                key, 
                value: pendingSettings[key], 
                updated_at: new Date().toISOString() 
            });
            if (error) {
                console.error("Error saving setting", key, error);
                hasError = true;
                if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
                    alert("Database schema not synced. Please click 'View SQL' to copy the updated setup commands and run them in your Supabase SQL Editor. The 'site_settings' table is missing.");
                    setSavingSettings(false);
                    return;
                }
            } else {
                setSiteSettings(prev => ({ ...prev, [key]: pendingSettings[key] }));
            }
        }
        
        setSavingSettings(false);
        if (hasError) {
            alert("Some settings failed to save. Check the console.");
        } else {
            setPendingSettings({});
            alert("Settings saved successfully.");
        }
    };

    const handleCopySQL = () => {
        navigator.clipboard.writeText(INIT_SQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AdminLayout title="Chemical Operations" icon={FlaskConical}>
            <div className="flex gap-4 mb-8">
                <Button 
                    variant={activeTab === 'orders' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('orders')}
                    disabled={loading}
                    className={activeTab === 'orders' ? 'bg-gold hover:bg-gold/90 text-black' : 'border-white/10 text-white'}
                >
                    Order Management
                </Button>
                <Button 
                    variant={activeTab === 'products' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('products')}
                    disabled={loading}
                    className={activeTab === 'products' ? 'bg-gold hover:bg-gold/90 text-black' : 'border-white/10 text-white'}
                >
                    Product Inventory
                </Button>
                <Button 
                    variant={activeTab === 'settings' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('settings')}
                    disabled={loading}
                    className={activeTab === 'settings' ? 'bg-gold hover:bg-gold/90 text-black' : 'border-white/10 text-white'}
                >
                    Site Settings
                </Button>
                <div className="flex-1" />
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-white/10 text-white h-10 gap-2 font-mono text-xs"
                        onClick={handleCopySQL}
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'SQL Copied' : 'Copy Sync SQL'}
                    </Button>
                    <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-10" onClick={() => setShowDBModal(true)}>
                        <Database className="w-4 h-4 mr-2" /> View SQL
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
            ) : activeTab === 'products' ? (
                <Card className="bg-[#0A0A0A] border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white">Product Catalog</CardTitle>
                        <Button onClick={() => setEditingProduct({})} className="bg-gold text-black hover:bg-gold-dark h-8 text-xs font-bold">
                            <PackagePlus className="w-4 h-4 mr-2" /> Add Product
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-gray-400 text-[10px] uppercase tracking-wider">Code</TableHead>
                                    <TableHead className="text-gray-400">Name</TableHead>
                                    <TableHead className="text-gray-400">Category</TableHead>
                                    <TableHead className="text-gray-400">Unit Price</TableHead>
                                    <TableHead className="text-gray-400">Min Order</TableHead>
                                    <TableHead className="text-gray-400">Status</TableHead>
                                    <TableHead className="text-right text-gray-400">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(p => (
                                    <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell className="font-mono text-[10px] text-gray-500">{p.product_code || 'N/A'}</TableCell>
                                        <TableCell className="font-medium text-white">{p.name}</TableCell>
                                        <TableCell><span className="bg-white/10 text-xs px-2 py-0.5 rounded text-gray-300">{p.category}</span></TableCell>
                                        <TableCell className="font-mono text-gold">${p.price_per_unit.toLocaleString()} / {p.unit_type}</TableCell>
                                        <TableCell className="font-mono text-gray-400">{p.min_order} {p.unit_type}</TableCell>
                                        <TableCell>
                                            <span className={p.status === 'Active' ? 'text-green-500 text-xs' : 'text-red-500 text-xs'}>
                                                {p.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingProduct(p)} className="text-blue-400 hover:text-blue-300 h-8">
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {products.length === 0 && (
                                    <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No products found. Add one or sync SQL.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : activeTab === 'settings' ? (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-[#0A0A0A] border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">Chemical Hero Manager</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-400">Hero Section Image</Label>
                                    {(pendingSettings.chemical_hero_image?.url || siteSettings.chemical_hero_image?.url) && (
                                        <div className="aspect-[21/9] w-full mb-4 rounded-lg overflow-hidden border border-white/10 relative group">
                                            <img src={pendingSettings.chemical_hero_image?.url || siteSettings.chemical_hero_image?.url} alt="Hero Preview" className="w-full h-full object-cover" />
                                            {pendingSettings.chemical_hero_image?.url && <div className="absolute top-2 right-2 bg-gold text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase">Unsaved Preview</div>}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Input 
                                            type="file" 
                                            accept="image/*" 
                                            className="bg-black border-white/10 flex-1 h-9 text-xs" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        handlePendingSettingChange('chemical_hero_image', { url: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <Button variant="outline" size="sm" className="border-white/10 text-white shrink-0 h-9" onClick={() => {
                                            const url = window.prompt("Enter Image URL", pendingSettings.chemical_hero_image?.url || siteSettings.chemical_hero_image?.url);
                                            if (url) handlePendingSettingChange('chemical_hero_image', { url });
                                        }}>
                                            Manual URL
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic mt-2">Recommended: High-resolution laboratory or industrial imagery.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#0A0A0A] border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white">Global Preferences</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-400">Contact Redirect URL</Label>
                                    <Input 
                                        className="bg-black border-white/10"
                                        value={pendingSettings.contact_url !== undefined ? pendingSettings.contact_url : (siteSettings.contact_url || '/contact')}
                                        onChange={(e) => handlePendingSettingChange('contact_url', e.target.value)}
                                    />
                                    {pendingSettings.contact_url !== undefined && pendingSettings.contact_url !== siteSettings.contact_url && (
                                        <p className="text-[10px] text-gold mt-1">Unsaved changes.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <Button
                            onClick={handleSaveAllSettings}
                            disabled={Object.keys(pendingSettings).length === 0 || savingSettings}
                            className="bg-gold text-black hover:bg-gold/90 font-bold px-8 h-10 shadow-lg shadow-gold/20"
                        >
                            {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                            Save Configuration Changes
                        </Button>
                    </div>
                </div>
            ) : (
                <Card className="bg-[#0A0A0A] border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white">Active Orders</CardTitle>
                        <span className="text-xs text-gray-500 font-mono">Total: {orders.length}</span>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-gray-400">ID / Date</TableHead>
                                    <TableHead className="text-gray-400">Client Info</TableHead>
                                    <TableHead className="text-gray-400">Product / Qty</TableHead>
                                    <TableHead className="text-gray-400">Payment Status</TableHead>
                                    <TableHead className="text-gray-400">Order Status</TableHead>
                                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map(o => (
                                    <TableRow key={o.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell>
                                            <p className="text-xs font-mono text-gray-400">{o.id.split('-')[0]}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(o.created_at!).toLocaleDateString()}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-white">{o.profile?.full_name || 'Client'}</p>
                                            <p className="text-[10px] text-gray-400">{o.profile?.email || o.user_id?.slice(0, 13) || 'No email'}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm font-medium text-white">{o.product?.name}</p>
                                            <p className="text-xs font-mono text-gold">{o.quantity.toLocaleString()} {o.product?.unit_type}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={o.payment_status} onValueChange={(val) => handleUpdateOrderStatus(o.id, val, 'payment_status')}>
                                                <SelectTrigger className="h-7 text-xs bg-black border-white/10 text-white w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-white/10 text-white">
                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                    <SelectItem value="Awaiting Payment">Awaiting Payment</SelectItem>
                                                    <SelectItem value="Proof Submitted">Proof Submitted</SelectItem>
                                                    <SelectItem value="Verified">Verified</SelectItem>
                                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {o.payment_proof_hash && (
                                                <p className="text-[10px] text-blue-400 mt-1 cursor-pointer hover:underline" onClick={() => setViewingProofHash(o.payment_proof_hash!)}>View Proof Hash</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select value={o.order_status} onValueChange={(val) => handleUpdateOrderStatus(o.id, val, 'order_status')}>
                                                <SelectTrigger className="h-7 text-xs bg-black border-white/10 text-white w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-white/10 text-white text-xs">
                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                                                    <SelectItem value="Processing">Processing</SelectItem>
                                                    <SelectItem value="Shipped">Shipped</SelectItem>
                                                    <SelectItem value="Delivered">Delivered</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col gap-1 items-end">
                                                <div className="flex gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => {
                                                            setEditingPaymentFor(o);
                                                            setPaymentInstructions(o.payment_instructions || "");
                                                        }} 
                                                        className="text-gold hover:text-white h-7 text-[10px]"
                                                    >
                                                        Instructions
                                                    </Button>
                                                    <Select onValueChange={(val) => generateChemicalDocument(val as any, o)}>
                                                        <SelectTrigger className="h-7 text-[10px] bg-black border-white/10 text-white w-20">
                                                            <FileDown className="w-3 h-3 mr-1" /> PDF
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-black border-white/10 text-white">
                                                            <SelectItem value="Invoice">Invoice</SelectItem>
                                                            <SelectItem value="Instructions">Payment Details</SelectItem>
                                                            <SelectItem value="Agreement">Binding Agreement</SelectItem>
                                                            <SelectItem value="SDS">Safety Data Sheet</SelectItem>
                                                            <SelectItem value="COA">Certificate of Analysis</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => setUploadingDocFor(o)} className="text-gray-400 hover:text-white h-7 text-[10px]">
                                                    <FileText className="w-3 h-3 mr-1" /> Add Doc
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {orders.length === 0 && (
                                    <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No orders found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Payment Instructions Modal */}
            <Dialog open={!!editingPaymentFor} onOpenChange={(open) => !open && setEditingPaymentFor(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Settlement Instructions</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="p-3 bg-gold/10 border border-gold/20 rounded text-xs text-gold">
                            Order Payment Method: <span className="font-bold uppercase">{editingPaymentFor?.payment_method}</span>
                        </div>
                        
                        {paymentInstructions ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded">
                                    <span className="font-bold">Manual override active</span>. You can manually edit the text below, or clear it to regenerate using the structured form.
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Instruction Text</label>
                                    <Textarea 
                                        className="bg-black border-white/10 h-48 font-mono text-xs whitespace-pre-wrap" 
                                        value={paymentInstructions}
                                        onChange={(e) => setPaymentInstructions(e.target.value)}
                                    />
                                </div>
                                <Button variant="ghost" onClick={() => setPaymentInstructions("")} className="w-full border border-white/10 h-10 text-xs hover:bg-white/5">
                                    Clear & Use Structured Form
                                </Button>
                            </div>
                        ) : ['crypto', 'usdt', 'usdc', 'bitcoin', 'eth'].some(k => editingPaymentFor?.payment_method?.toLowerCase().includes(k)) ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Target Wallet Address</label>
                                    <Input 
                                        className="bg-black border-white/10" 
                                        placeholder="0x..." 
                                        value={cryptoDetails.address}
                                        onChange={(e) => setCryptoDetails({...cryptoDetails, address: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Network (e.g. ERC20, TRC20, SOL)</label>
                                    <Input 
                                        className="bg-black border-white/10" 
                                        placeholder="e.g. ERC20" 
                                        value={cryptoDetails.network}
                                        onChange={(e) => setCryptoDetails({...cryptoDetails, network: e.target.value})}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Bank Name</label>
                                    <Input 
                                        className="bg-black border-white/10" 
                                        value={bankDetails.bankName}
                                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400">Account Number</label>
                                        <Input 
                                            className="bg-black border-white/10" 
                                            value={bankDetails.accountNumber}
                                            onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400">Routing / Swift</label>
                                        <Input 
                                            className="bg-black border-white/10" 
                                            value={bankDetails.routingNumber}
                                            onChange={(e) => setBankDetails({...bankDetails, routingNumber: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Beneficiary Name</label>
                                    <Input 
                                        className="bg-black border-white/10" 
                                        value={bankDetails.beneficiary}
                                        onChange={(e) => setBankDetails({...bankDetails, beneficiary: e.target.value})}
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSavePaymentInstructions} className="bg-gold text-black hover:bg-gold-dark font-bold w-full h-12">
                                Send Verified Instructions
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Proof Hash Modal */}
            <Dialog open={!!viewingProofHash} onOpenChange={(open) => !open && setViewingProofHash(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Payment Hash Verification</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-gray-400">The buyer submitted the following transaction hash/reference for verification.</p>
                        <div className="p-4 bg-black border border-white/10 rounded font-mono text-sm break-all text-white">
                            {viewingProofHash}
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={() => setViewingProofHash(null)} className="w-full bg-gold text-black font-bold h-10 hover:bg-gold-dark">
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Product Modal */}
            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-4xl h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b border-white/10 shrink-0">
                        <DialogTitle className="font-serif text-2xl">{editingProduct?.id ? 'Edit Product' : 'Add Chemical Product'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Product Name</Label>
                                <Input className="bg-black border-white/10" value={editingProduct?.name || ''} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Product Code (Optional)</Label>
                                <Input className="bg-black border-white/10" placeholder="e.g. CHEM-001" value={editingProduct?.product_code || ''} onChange={(e) => setEditingProduct({...editingProduct, product_code: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Product Image</Label>
                            <div className="flex items-center gap-4">
                                {editingProduct?.image_url && (
                                    <div className="relative group shrink-0">
                                        <img src={editingProduct.image_url} alt="Product preview" className="w-16 h-16 object-cover rounded border border-white/10" />
                                        <button 
                                            onClick={() => setEditingProduct({...editingProduct, image_url: undefined})}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex-1 flex gap-2">
                                    <Input 
                                        type="file" 
                                        accept="image/*" 
                                        className="bg-black border-white/10 h-9 text-xs" 
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 2 * 1024 * 1024) {
                                                    alert("File size must be less than 2MB");
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setEditingProduct((prev: any) => prev ? {...prev, image_url: reader.result as string} : prev);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <Button variant="outline" size="sm" className="border-white/10 text-white shrink-0 h-9" onClick={() => {
                                        const url = window.prompt("Enter Product Image URL", editingProduct?.image_url || "");
                                        if (url) setEditingProduct((prev: any) => prev ? {...prev, image_url: url} : prev);
                                    }}>
                                        Manual URL
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={editingProduct?.category || ''} onValueChange={(val) => setEditingProduct({...editingProduct, category: val})}>
                                    <SelectTrigger className="bg-black border-white/10 text-white">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border-white/10 text-white">
                                        <SelectItem value="Industrial">Industrial</SelectItem>
                                        <SelectItem value="Mining">Mining</SelectItem>
                                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                                        <SelectItem value="Agricultural">Agricultural</SelectItem>
                                        <SelectItem value="Pharmaceutical">Pharmaceutical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Unit Type (e.g. MT, L)</Label>
                                <Input className="bg-black border-white/10" value={editingProduct?.unit_type || ''} onChange={(e) => setEditingProduct({...editingProduct, unit_type: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Price Per Unit ($)</Label>
                                <Input type="number" className="bg-black border-white/10" value={editingProduct?.price_per_unit || ''} onChange={(e) => setEditingProduct({...editingProduct, price_per_unit: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Order</Label>
                                <Input type="number" className="bg-black border-white/10" value={editingProduct?.min_order || ''} onChange={(e) => setEditingProduct({...editingProduct, min_order: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={editingProduct?.status || 'Active'} onValueChange={(val) => setEditingProduct({...editingProduct, status: val as any})}>
                                    <SelectTrigger className="bg-black border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-black border-white/10 text-white">
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Short Description</Label>
                            <Textarea className="bg-black border-white/10" value={editingProduct?.description || ''} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Rich Description & Safety Notes</Label>
                            <div className="text-white">
                                <RichTextEditor 
                                    value={editingProduct?.rich_description || ''} 
                                    onChange={(val) => setEditingProduct({...editingProduct, rich_description: val})} 
                                    placeholder="Add chemical specifications, safety instructions, and technical details..."
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-white/10 shrink-0 flex justify-end gap-4">
                        <Button variant="outline" onClick={() => setEditingProduct(null)} className="border-white/10 text-white hover:bg-white/5">Cancel</Button>
                        <Button onClick={handleSaveProduct} className="bg-gold text-black hover:bg-gold-dark font-bold px-8">Save Product</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Doc Upload Modal */}
            <Dialog open={!!uploadingDocFor} onOpenChange={(open) => !open && setUploadingDocFor(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="font-serif">Attach Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Document Type</Label>
                            <Select value={docForm.type} onValueChange={(val) => setDocForm({...docForm, type: val})}>
                                <SelectTrigger className="bg-black border-white/10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-black border-white/10 text-white">
                                    <SelectItem value="Invoice">Proforma Invoice</SelectItem>
                                    <SelectItem value="SDS">Safety Data Sheet (SDS)</SelectItem>
                                    <SelectItem value="Certificate">Certificate of Analysis</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Document Title</Label>
                            <Input className="bg-black border-white/10" value={docForm.title} onChange={(e) => setDocForm({...docForm, title: e.target.value})} placeholder="e.g. Invoice PI-4029" />
                        </div>
                        <div className="space-y-2">
                            <Label>File URL (PDF Link)</Label>
                            <Input className="bg-black border-white/10" value={docForm.url} onChange={(e) => setDocForm({...docForm, url: e.target.value})} placeholder="https://..." />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleUploadDoc} className="bg-gold text-black hover:bg-gold-dark font-bold">Attach to Order</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDBModal} onOpenChange={setShowDBModal}>
                <DialogContent className="max-w-2xl bg-[#0A0A0A] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-white">Database Initialization</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-400">
                                Run this SQL script in your Supabase SQL Editor to create the necessary tables and security policies for the Chemical Division.
                            </p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-white/10 text-white h-8 gap-2"
                                onClick={handleCopySQL}
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                        <pre className="p-4 bg-black rounded-lg border border-white/10 text-xs font-mono text-gray-300 overflow-x-auto h-96 custom-scrollbar relative">
                            {INIT_SQL}
                        </pre>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" className="text-white border-white/10" onClick={() => setShowDBModal(false)}>Close</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
