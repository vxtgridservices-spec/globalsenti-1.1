import * as React from "react";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { ChemicalProduct, ChemicalOrder, ChemicalDocument, NewsArticle } from "@/src/types/chemicals";
import { Loader2, PackagePlus, FileText, CheckCircle, Database, FlaskConical, Copy, Check, FileDown, ShieldCheck, X, Image as ImageIcon } from "lucide-react";
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

-- Ensure payment_instructions and shipping_info columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chemical_orders' AND column_name='payment_instructions') THEN
        ALTER TABLE public.chemical_orders ADD COLUMN payment_instructions TEXT;
    END IF;

    -- Drop and re-add shipping_info to handle any potential type conflicts
    BEGIN
        ALTER TABLE public.chemical_orders DROP COLUMN IF EXISTS shipping_info;
        ALTER TABLE public.chemical_orders ADD COLUMN shipping_info JSONB;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to recreate shipping_info: %', SQLERRM;
    END;
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

CREATE TABLE IF NOT EXISTS public.chemical_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chemical_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public View News" ON public.chemical_news FOR SELECT USING (true);
CREATE POLICY "Admin Manage News" ON public.chemical_news FOR ALL USING (true);

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
    const [news, setNews] = React.useState<NewsArticle[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    // UI State
    const [activeTab, setActiveTab] = React.useState<'orders'|'products'|'cms'|'settings'|'news'>('orders');
    
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
    const [isNewsDialogOpen, setIsNewsDialogOpen] = React.useState(false);
    const [editingNews, setEditingNews] = React.useState<any>(null);
    
    // Settlement Detail States
    const [bankDetails, setBankDetails] = React.useState({ bankName: "", accountNumber: "", routingNumber: "", beneficiary: "GLOBAL SENTINEL GROUP" });
    const [cryptoDetails, setCryptoDetails] = React.useState({ address: "", network: "" });

    const [schemaError, setSchemaError] = React.useState<string | null>(null);

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setSchemaError(null);
        console.log("Fetching Chemical Operations Data...");
        try {
            const [pRes, oRes, sRes, newsRes] = await Promise.all([
                supabase.from('chemical_products').select('*').order('created_at', { ascending: false }),
                supabase.from('chemical_orders').select(`
                    *,
                    product:chemical_products(*),
                    profile:profiles(id, full_name, email)
                `).order('created_at', { ascending: false }),
                supabase.from('site_settings').select('*'),
                supabase.from('chemical_news').select('*').order('created_at', { ascending: false })
            ]);
            
            // Check for schema errors
            const errors = [pRes.error, oRes.error, sRes.error, newsRes.error].filter(Boolean);
            const missingTableError = errors.find(e => e?.message?.includes('schema cache') || e?.code === 'PGRST204' || e?.code === '42P01');
            
            if (missingTableError) {
                console.error("Schema error detected:", missingTableError);
                setSchemaError(`Database tables are not fully synced. Please run the SQL initialization script.`);
            }

            if (newsRes.data) {
                setNews(newsRes.data);
            }
            
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
            toast.error("Please provide at least a name and price.");
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
            toast.error(`Error saving product: ${error.message}. Make sure you have run the Sync SQL script.`);
        } else {
            setEditingProduct(null);
            fetchData();
            toast.success("Product saved successfully.");
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
            toast.error("Error updating instructions: " + error.message);
        } else {
            setEditingPaymentFor(null);
            fetchData();
            toast.success("Payment instructions sent to buyer.");
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
        toast.success("Document attached to order.");
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
                    toast.error("Database schema not synced. Please click 'View SQL' to copy the updated setup commands.");
                    setSavingSettings(false);
                    return;
                }
            } else {
                setSiteSettings(prev => ({ ...prev, [key]: pendingSettings[key] }));
            }
        }
        
        setSavingSettings(false);
        if (hasError) {
            toast.error("Some settings failed to save. Check the console.");
        } else {
            setPendingSettings({});
            toast.success("Settings saved successfully.");
        }
    };

    const handleCopySQL = () => {
        navigator.clipboard.writeText(INIT_SQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AdminLayout title="Chemical Operations" icon={FlaskConical}>
            {schemaError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-red-500 font-bold text-sm">Database Sync Required</p>
                            <p className="text-red-400/80 text-xs">Some tables (including 'chemical_news') are missing. Copy the Sync SQL and run it in your Supabase SQL Editor.</p>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={handleCopySQL}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4"
                    >
                        {copied ? 'Copied!' : 'Copy SQL Now'}
                    </Button>
                </div>
            )}

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
                    variant={activeTab === 'cms' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('cms')}
                    disabled={loading}
                    className={activeTab === 'cms' ? 'bg-gold hover:bg-gold/90 text-black' : 'border-white/10 text-white'}
                >
                    Chemical CMS
                </Button>
                <Button 
                    variant={activeTab === 'news' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('news')}
                    disabled={loading}
                    className={activeTab === 'news' ? 'bg-gold hover:bg-gold/90 text-black' : 'border-white/10 text-white'}
                >
                    News Management
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
            ) : activeTab === 'cms' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-serif text-white uppercase tracking-widest">Chemical Division CMS</h2>
                        <Button
                            onClick={handleSaveAllSettings}
                            disabled={Object.keys(pendingSettings).length === 0 || savingSettings}
                            className="bg-gold text-black hover:bg-gold/90 font-bold px-8 h-10 shadow-lg shadow-gold/20"
                        >
                            {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                            Publish CMS Changes
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* HERO SECTION */}
                        <Card className="bg-[#0A0A0A] border-white/5">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-white text-sm uppercase tracking-tighter">Hero Section</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-400">Hero Image</Label>
                                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 mb-2">
                                            <img 
                                                src={pendingSettings.chem_landing_hero?.image_url || siteSettings.chem_landing_hero?.image_url || "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2070&auto=format&fit=crop"} 
                                                className="w-full h-full object-cover opacity-60"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <div className="text-center p-4">
                                                    <h3 className="text-white font-serif text-lg leading-tight">
                                                        {pendingSettings.chem_landing_hero?.title || siteSettings.chem_landing_hero?.title || "Swiss Advanced Chemical Laboratory"}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Hero Image URL"
                                                className="bg-black border-white/10 h-9 text-xs"
                                                value={pendingSettings.chem_landing_hero?.image_url !== undefined ? pendingSettings.chem_landing_hero.image_url : (siteSettings.chem_landing_hero?.image_url || "")}
                                                onChange={(e) => {
                                                    const current = pendingSettings.chem_landing_hero || siteSettings.chem_landing_hero || {};
                                                    handlePendingSettingChange('chem_landing_hero', { ...current, image_url: e.target.value });
                                                }}
                                            />
                                         </div>
                                     </div>
                                     <div className="space-y-2">
                                         <Label className="text-gray-400">Hero Title</Label>
                                         <Input 
                                             className="bg-black border-white/10" 
                                             value={pendingSettings.chem_landing_hero?.title !== undefined ? pendingSettings.chem_landing_hero.title : (siteSettings.chem_landing_hero?.title || "Swiss Advanced Chemical Laboratory")}
                                             onChange={(e) => {
                                                 const current = pendingSettings.chem_landing_hero || siteSettings.chem_landing_hero || {};
                                                 handlePendingSettingChange('chem_landing_hero', { ...current, title: e.target.value });
                                             }}
                                         />
                                     </div>
                                     <div className="space-y-2">
                                         <Label className="text-gray-400">Hero Subtitle</Label>
                                         <Input 
                                             className="bg-black border-white/10" 
                                             value={pendingSettings.chem_landing_hero?.subtitle !== undefined ? pendingSettings.chem_landing_hero.subtitle : (siteSettings.chem_landing_hero?.subtitle || "High-value industrial and security-grade chemical solutions")}
                                             onChange={(e) => {
                                                 const current = pendingSettings.chem_landing_hero || siteSettings.chem_landing_hero || {};
                                                 handlePendingSettingChange('chem_landing_hero', { ...current, subtitle: e.target.value });
                                             }}
                                         />
                                     </div>
                                 </div>
                            </CardContent>
                        </Card>

                        {/* WELCOME SECTION */}
                        <Card className="bg-[#0A0A0A] border-white/5">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-white text-sm uppercase tracking-tighter">Welcome Section</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-gray-400">Welcome Image</Label>
                                            <div className="aspect-square bg-black border border-white/10 rounded overflow-hidden mb-2">
                                                <img 
                                                    src={pendingSettings.chem_landing_welcome?.image_url || siteSettings.chem_landing_welcome?.image_url || "https://images.unsplash.com/photo-1532187878418-9f110018b9dc?q=80&w=1000&auto=format&fit=crop"} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Welcome Image URL"
                                                    className="bg-black border-white/10 h-8 text-[10px]"
                                                    value={pendingSettings.chem_landing_welcome?.image_url !== undefined ? pendingSettings.chem_landing_welcome.image_url : (siteSettings.chem_landing_welcome?.image_url || "")}
                                                    onChange={(e) => {
                                                        const current = pendingSettings.chem_landing_welcome || siteSettings.chem_landing_welcome || {};
                                                        handlePendingSettingChange('chem_landing_welcome', { ...current, image_url: e.target.value });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-gray-400">Welcome Title</Label>
                                                <Input 
                                                    className="bg-black border-white/10" 
                                                    value={pendingSettings.chem_landing_welcome?.title !== undefined ? pendingSettings.chem_landing_welcome.title : (siteSettings.chem_landing_welcome?.title || "Welcome to Our Chemical Division")}
                                                    onChange={(e) => {
                                                        const current = pendingSettings.chem_landing_welcome || siteSettings.chem_landing_welcome || {};
                                                        handlePendingSettingChange('chem_landing_welcome', { ...current, title: e.target.value });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-400">Welcome Text (Rich Text)</Label>
                                        <RichTextEditor 
                                            value={pendingSettings.chem_landing_welcome?.rich_text !== undefined ? pendingSettings.chem_landing_welcome.rich_text : (siteSettings.chem_landing_welcome?.rich_text || "<h3>Excellence in Chemistry</h3><p>We provide advanced solutions for industrial scale operations.</p>")}
                                            onChange={(html) => {
                                                const current = pendingSettings.chem_landing_welcome || siteSettings.chem_landing_welcome || {};
                                                handlePendingSettingChange('chem_landing_welcome', { ...current, rich_text: html });
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* OFFERINGS SECTION */}
                        <Card className="bg-[#0A0A0A] border-white/5 lg:col-span-2">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-white text-sm uppercase tracking-tighter">Our Offerings (3-4 Cards)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[0, 1, 2, 3].map(index => {
                                        const offerings = pendingSettings.chem_landing_offerings || siteSettings.chem_landing_offerings || [];
                                        const item = offerings[index] || { title: "", description: "", image_url: "" };
                                        
                                        return (
                                            <div key={index} className="space-y-3 p-4 border border-white/5 bg-white/5 rounded-lg">
                                                <div className="aspect-video bg-black rounded overflow-hidden mb-2 relative">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs italic">No Image</div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-400 text-xs">Image URL</Label>
                                                    <Input 
                                                        placeholder="https://image-url.com" 
                                                        className="bg-black border-white/10 h-8 text-xs font-mono"
                                                        value={item.image_url || ''}
                                                        onChange={(e) => {
                                                            const newOfferings = [...offerings];
                                                            while (newOfferings.length <= index) newOfferings.push({ title: "", description: "", image_url: "" });
                                                            newOfferings[index] = { ...item, image_url: e.target.value };
                                                            handlePendingSettingChange('chem_landing_offerings', newOfferings);
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-400 text-xs">Title</Label>
                                                    <Input 
                                                        placeholder="Card Title" 
                                                        className="bg-black border-white/10 h-8 text-xs font-bold"
                                                        value={item.title}
                                                        onChange={(e) => {
                                                            const newOfferings = [...offerings];
                                                            while (newOfferings.length <= index) newOfferings.push({ title: "", description: "", image_url: "" });
                                                            newOfferings[index] = { ...item, title: e.target.value };
                                                            handlePendingSettingChange('chem_landing_offerings', newOfferings);
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-400 text-xs">Description</Label>
                                                    <Textarea 
                                                        placeholder="Description" 
                                                        className="bg-black border-white/10 text-[10px] min-h-[60px]"
                                                        value={item.description}
                                                        onChange={(e) => {
                                                            const newOfferings = [...offerings];
                                                            while (newOfferings.length <= index) newOfferings.push({ title: "", description: "", image_url: "" });
                                                            newOfferings[index] = { ...item, description: e.target.value };
                                                            handlePendingSettingChange('chem_landing_offerings', newOfferings);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* GALLERY & MEDIA SECTION */}
                        <Card className="bg-[#0A0A0A] border-white/5">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-white text-sm uppercase tracking-tighter">Media Showcase (Gallery - 5 Slots)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-5 gap-2 mb-6">
                                    {[0, 1, 2, 3, 4].map(index => {
                                        const gallery = pendingSettings.chem_landing_gallery || siteSettings.chem_landing_gallery || [];
                                        const url = gallery[index] || "";
                                        
                                        return (
                                            <div key={index} className="space-y-2">
                                                <Label className="text-gray-400 text-xs">Slot {index+1} URL</Label>
                                                <Input 
                                                    placeholder="https://image.url"
                                                    className="bg-black border-white/10 h-8 text-xs font-mono"
                                                    value={url}
                                                    onChange={(e) => {
                                                        const newGallery = [...gallery];
                                                        while (newGallery.length <= index) newGallery.push("");
                                                        newGallery[index] = e.target.value;
                                                        handlePendingSettingChange('chem_landing_gallery', newGallery);
                                                    }}
                                                />
                                                <div className="aspect-square bg-black border border-white/10 rounded overflow-hidden relative">
                                                    {url ? (
                                                        <img src={url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-700 italic">No Image</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-gray-400">Video Links (YouTube/Vimeo - 3 Slots)</Label>
                                    {[0, 1, 2].map(index => {
                                        const videos = pendingSettings.chem_landing_videos || siteSettings.chem_landing_videos || [];
                                        const url = videos[index] || "";
                                        
                                        return (
                                            <div key={index} className="flex gap-2 items-center">
                                                <span className="text-[10px] font-mono text-gray-600 w-4">{index+1}</span>
                                                <Input 
                                                    className="bg-black border-white/10 h-8 text-xs" 
                                                    placeholder="https://youtube.com/watch?v=..." 
                                                    value={url}
                                                    onChange={(e) => {
                                                        const newVideos = [...videos];
                                                        while (newVideos.length <= index) newVideos.push("");
                                                        newVideos[index] = e.target.value;
                                                        handlePendingSettingChange('chem_landing_videos', newVideos);
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* PRODUCT PREVIEW SETTINGS */}
                        <Card className="bg-[#0A0A0A] border-white/5">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-white text-sm uppercase tracking-tighter">Product Catalog Link</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-400">Catalog Button Text</Label>
                                    <Input 
                                        className="bg-black border-white/10" 
                                        value={pendingSettings.chem_catalog_btn_text !== undefined ? pendingSettings.chem_catalog_btn_text : (siteSettings.chem_catalog_btn_text || "View Full Catalog")}
                                        onChange={(e) => handlePendingSettingChange('chem_catalog_btn_text', e.target.value)}
                                    />
                                </div>
                                <div className="p-4 bg-gold/5 border border-gold/10 rounded-lg text-xs leading-relaxed text-gray-400">
                                    <p className="font-bold text-gold mb-1 underline">Luxury Catalog Design Rules Applied:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Full-width grid layouts</li>
                                        <li>Overlay text styling</li>
                                        <li>No boxed containers</li>
                                        <li>Publicly accessible</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : activeTab === 'news' ? (
                <Card className="bg-[#0A0A0A] border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                        <div>
                            <CardTitle className="text-white">Live News Management</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Publish updates to the public news feed.</p>
                        </div>
                        <Dialog open={isNewsDialogOpen} onOpenChange={(open) => {
                            setIsNewsDialogOpen(open);
                            if (!open) setEditingNews(null);
                        }}>
                            <DialogTrigger
                                render={
                                    <Button onClick={() => setEditingNews(null)} className="bg-gold text-black hover:bg-gold/90 h-10 text-xs font-bold uppercase tracking-widest px-6 shadow-lg shadow-gold/10">
                                        + Post New Article
                                    </Button>
                                }
                            />
                            <DialogContent className="bg-black border border-white/10 text-white shadow-2xl max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-gold font-serif">{editingNews ? 'Edit News Update' : 'Create News Update'}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const title = formData.get('title') as string;
                                    const content = formData.get('content') as string;
                                    const image_url = formData.get('image_url') as string;

                                    if (title && content) {
                                        if (editingNews) {
                                            supabase.from('chemical_news').update({ title, content, image_url }).eq('id', editingNews.id).then(({ error }) => {
                                                if (error) {
                                                    toast.error("Failed to update news: " + error.message);
                                                } else {
                                                    toast.success("News update updated successfully!");
                                                    fetchData();
                                                    setIsNewsDialogOpen(false);
                                                    setEditingNews(null);
                                                }
                                            });
                                        } else {
                                            supabase.from('chemical_news').insert({ title, content, image_url }).then(({ error }) => {
                                                if (error) {
                                                    const isSchemaError = error.message?.includes('schema cache') || error.code === '42P01' || error.code === 'PGRST204';
                                                    toast.error(`Failed to post news: ${error.message}${isSchemaError ? ". Table 'chemical_news' is missing. Please sync SQL." : ""}`);
                                                } else {
                                                    toast.success("News update published successfully!");
                                                    fetchData();
                                                    setIsNewsDialogOpen(false);
                                                }
                                            });
                                        }
                                    }
                                }} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Article Title</Label>
                                        <Input name="title" defaultValue={editingNews?.title} required placeholder="Major Supply Chain Update..." className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Lead Image URL (Optional)</Label>
                                        <Input name="image_url" defaultValue={editingNews?.image_url} placeholder="https://images.unsplash.com/..." className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Content</Label>
                                        <Textarea name="content" defaultValue={editingNews?.content} required placeholder="Enter full news content here..." className="bg-white/5 border-white/10 min-h-[200px]" />
                                    </div>
                                    <Button type="submit" className="w-full bg-gold text-black font-bold uppercase tracking-widest">
                                        {editingNews ? 'Save Changes' : 'Publish To Feed'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10">
                                    <TableHead className="text-gray-400">Title</TableHead>
                                    <TableHead className="text-gray-400">Content</TableHead>
                                    <TableHead className="text-gray-400">Date</TableHead>
                                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {news.map(n => (
                                <TableRow key={n.id} className="border-white/5">
                                    <TableCell className="font-medium text-white">{n.title}</TableCell>
                                    <TableCell className="text-gray-400 truncate max-w-xs">{n.content}</TableCell>
                                    <TableCell className="text-gray-500 text-xs font-mono">{new Date(n.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => {
                                                setEditingNews(n);
                                                setIsNewsDialogOpen(true);
                                            }}>
                                                <ShieldCheck className="w-4 h-4 text-blue-400" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => {
                                                if (confirm("Delete article?")) {
                                                    supabase.from('chemical_news').delete().eq('id', n.id).then(() => {
                                                        toast.success("Deleted");
                                                        fetchData();
                                                    });
                                                }
                                            }}>
                                                <X className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : activeTab === 'settings' ? (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
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
                                    <TableHead className="text-gray-400">Logistics State</TableHead>
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
                                            <div className="flex flex-col gap-1">
                                                <Select value={o.order_status} onValueChange={(val) => handleUpdateOrderStatus(o.id, val, 'order_status')}>
                                                    <SelectTrigger className="h-8 text-[11px] font-bold uppercase tracking-wider bg-gold/10 border-gold/30 text-gold w-[140px] hover:bg-gold/20 hover:border-gold/50 transition-all">
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
                                                {o.shipping_info && (() => {
                                                    let s: any = null;
                                                    try {
                                                        s = typeof o.shipping_info === 'string' ? JSON.parse(o.shipping_info) : o.shipping_info;
                                                    } catch (e) {
                                                        console.error("Failed to parse shipping_info", e);
                                                        return <span className="text-[10px] text-red-500">Parsing Error</span>;
                                                    }
                                                    
                                                    if (!s) return null;
                                                    
                                                    return (
                                                    <div className="mt-1 relative w-fit">
                                                        <Dialog>
                                                            <DialogTrigger
                                                                nativeButton={false}
                                                                render={
                                                                    <span className="text-[10px] text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded cursor-pointer hover:bg-orange-400/20">
                                                                        View Shipping Info
                                                                    </span>
                                                                }
                                                            />
                                                            <DialogContent className="bg-black border border-white/10 text-white min-w-[300px] shadow-2xl">
                                                                <DialogHeader>
                                                                    <DialogTitle className="text-gold font-serif">Order Logistics Detail</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="text-sm space-y-3 py-4">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Recipient</p>
                                                                            <p className="font-medium">{s.contactName || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Contact</p>
                                                                            <p className="font-medium">{s.contactPhone || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Address</p>
                                                                        <p className="font-medium">{s.address || 'N/A'}</p>
                                                                        <p className="font-medium">{s.city ? `${s.city}, ` : ''}{s.zip || ''} {s.country || ''}</p>
                                                                    </div>
                                                                    {s.notes && (
                                                                        <div className="p-2 bg-white/5 rounded border border-white/10">
                                                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Shipping Notes</p>
                                                                            <p className="text-xs italic text-gray-300">"{s.notes}"</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                    );
                                                })()}
                                            </div>
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
                                        placeholder="Product Image URL (e.g. https://images.unsplash.com/...)"
                                        className="bg-black border-white/10 h-9 text-xs"
                                        value={editingProduct?.image_url || ''}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                                    />
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
