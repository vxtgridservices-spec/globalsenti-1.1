import * as React from "react";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { 
  Plus, 
  Settings, 
  TrendingUp, 
  Users, 
  Activity, 
  Save, 
  Trash2, 
  Edit3,
  BarChart3,
  Layers,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Building2,
  Search,
  Clock,
  Calendar,
  AlertCircle,
  Database,
  RefreshCw,
  Copy
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { InvestmentProduct, PerformanceUpdate, RiskLevel, ProductStatus, ROIType, DistributionFrequency, InvestmentSubscription, FundingDetails, FundingSubmission, RedemptionRequest } from "@/src/types/investments";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { AdminChartControls } from "@/src/components/admin/AdminChartControls";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { 
    ArrowUpCircle, 
    Check, 
    X, 
    Ban, 
    HandMetal, 
    MoreHorizontal,
    UserCircle,
    LayoutPanelTop,
    Banknote,
    Info,
    Table as TableIcon
} from "lucide-react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/src/components/ui/table";

const DATABASE_SETUP_SQL = `/* OPTION A: NEW SETUP (Tables don't exist) */
CREATE TABLE IF NOT EXISTS public.investment_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    commodity TEXT NOT NULL,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total_units INTEGER DEFAULT 100,
    units_available INTEGER DEFAULT 100,
    min_investment NUMERIC DEFAULT 1000,
    max_allocation NUMERIC DEFAULT 500000,
    target_roi NUMERIC NOT NULL DEFAULT 0,
    roi_type TEXT DEFAULT 'Fixed',
    distribution_frequency TEXT DEFAULT 'End of term',
    duration_days INTEGER DEFAULT 180,
    start_date DATE DEFAULT CURRENT_DATE,
    maturity_date DATE,
    risk_level TEXT DEFAULT 'Low',
    status TEXT DEFAULT 'draft',
    description TEXT,
    strategy_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.investment_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    product_id UUID NOT NULL REFERENCES public.investment_products(id),
    units INTEGER NOT NULL,
    unit_price_at_purchase NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    funded_at TIMESTAMPTZ,
    funding_details JSONB,
    payment_proof_hash TEXT
);

CREATE TABLE IF NOT EXISTS public.investor_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    product_id UUID NOT NULL REFERENCES public.investment_products(id),
    units INTEGER NOT NULL,
    total_invested NUMERIC NOT NULL,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.investment_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.investment_products(id),
    current_nav NUMERIC NOT NULL,
    roi_percentage NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE PROFILES TABLE FOR PUBLIC USER INFO
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNCTION & TRIGGER TO AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- SYNC EXISTING USERS TO PROFILES
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ENSURE FOREIGN KEYS FOR EXISTING TABLES
DO $$ 
BEGIN
    -- funding_submissions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'funding_submissions_user_id_fkey_profiles') THEN
        ALTER TABLE public.funding_submissions DROP CONSTRAINT IF EXISTS funding_submissions_user_id_fkey;
        ALTER TABLE public.funding_submissions ADD CONSTRAINT funding_submissions_user_id_fkey_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;

    -- investor_transactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'investor_transactions_user_id_fkey_profiles') THEN
        ALTER TABLE public.investor_transactions DROP CONSTRAINT IF EXISTS investor_transactions_user_id_fkey;
        ALTER TABLE public.investor_transactions ADD CONSTRAINT investor_transactions_user_id_fkey_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;

    -- redemption_requests
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'redemption_requests_user_id_fkey_profiles') THEN
        ALTER TABLE public.redemption_requests DROP CONSTRAINT IF EXISTS redemption_requests_user_id_fkey;
        ALTER TABLE public.redemption_requests ADD CONSTRAINT redemption_requests_user_id_fkey_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;
    
    -- investment_subscriptions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'investment_subscriptions_user_id_fkey_profiles') THEN
        ALTER TABLE public.investment_subscriptions DROP CONSTRAINT IF EXISTS investment_subscriptions_user_id_fkey;
        ALTER TABLE public.investment_subscriptions ADD CONSTRAINT investment_subscriptions_user_id_fkey_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;

    -- investor_positions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'investor_positions_user_id_fkey_profiles') THEN
        ALTER TABLE public.investor_positions DROP CONSTRAINT IF EXISTS investor_positions_user_id_fkey;
        ALTER TABLE public.investor_positions ADD CONSTRAINT investor_positions_user_id_fkey_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.funding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.investment_subscriptions(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    amount NUMERIC NOT NULL,
    payment_proof_hash TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.investor_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    subscription_id UUID REFERENCES public.investment_subscriptions(id),
    position_id UUID REFERENCES public.investor_positions(id),
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.redemption_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES public.investor_positions(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    units INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    redemption_type TEXT NOT NULL,
    payment_destination JSONB,
    status TEXT DEFAULT 'Pending Review',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

/* REPAIR EXISTING */
ALTER TABLE investment_products ADD COLUMN IF NOT EXISTS total_units INTEGER DEFAULT 100;
ALTER TABLE investment_products ADD COLUMN IF NOT EXISTS roi_type TEXT DEFAULT 'Fixed';
ALTER TABLE investment_products ADD COLUMN IF NOT EXISTS distribution_frequency TEXT DEFAULT 'End of term';
ALTER TABLE investment_products ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE investment_products ADD COLUMN IF NOT EXISTS maturity_date DATE;
ALTER TABLE investment_products ADD COLUMN IF NOT EXISTS strategy_notes TEXT;
ALTER TABLE investment_products ADD COLUMN IF NOT EXISTS max_allocation NUMERIC DEFAULT 500000;

CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.investment_products(id),
    price NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.market_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.investment_products(id),
    target_timestamp TIMESTAMPTZ NOT NULL,
    target_value NUMERIC NOT NULL,
    percentage_change NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE investment_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE investment_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE investment_subscriptions ADD COLUMN IF NOT EXISTS funding_details JSONB;
ALTER TABLE investment_subscriptions ADD COLUMN IF NOT EXISTS payment_proof_hash TEXT;

/* SECURITY CONFIGURATION */
ALTER TABLE public.investment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_checkpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users view own funding" ON public.funding_submissions;
DROP POLICY IF EXISTS "Users create funding" ON public.funding_submissions;
DROP POLICY IF EXISTS "Admin manage funding" ON public.funding_submissions;
CREATE POLICY "Users view own funding" ON public.funding_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create funding" ON public.funding_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage funding" ON public.funding_submissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users view own transactions" ON public.investor_transactions;
DROP POLICY IF EXISTS "Admin manage transactions" ON public.investor_transactions;
CREATE POLICY "Users view own transactions" ON public.investor_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manage transactions" ON public.investor_transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users view own redemptions" ON public.redemption_requests;
DROP POLICY IF EXISTS "Users create redemptions" ON public.redemption_requests;
DROP POLICY IF EXISTS "Admin manage redemptions" ON public.redemption_requests;
CREATE POLICY "Users view own redemptions" ON public.redemption_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create redemptions" ON public.redemption_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage redemptions" ON public.redemption_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Public View" ON public.investment_products;
DROP POLICY IF EXISTS "Admin Manage" ON public.investment_products;
CREATE POLICY "Public View" ON public.investment_products FOR SELECT USING (status IN ('active', 'Active', 'open', 'Open'));
CREATE POLICY "Admin Manage" ON public.investment_products FOR ALL USING (true);

DROP POLICY IF EXISTS "Users view own subs" ON public.investment_subscriptions;
DROP POLICY IF EXISTS "Users create subs" ON public.investment_subscriptions;
DROP POLICY IF EXISTS "Admin manage subs" ON public.investment_subscriptions;

CREATE POLICY "Users view own subs" ON public.investment_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create subs" ON public.investment_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage subs" ON public.investment_subscriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users view own positions" ON public.investor_positions;
DROP POLICY IF EXISTS "Admin manage positions" ON public.investor_positions;
CREATE POLICY "Users view own positions" ON public.investor_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manage positions" ON public.investor_positions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public View Perf" ON public.investment_performance;
DROP POLICY IF EXISTS "Admin Manage Perf" ON public.investment_performance;
CREATE POLICY "Public View Perf" ON public.investment_performance FOR SELECT USING (true);
CREATE POLICY "Admin Manage Perf" ON public.investment_performance FOR ALL USING (true);

DROP POLICY IF EXISTS "Public View Price" ON public.price_history;
DROP POLICY IF EXISTS "Admin Manage Price" ON public.price_history;
CREATE POLICY "Public View Price" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Admin Manage Price" ON public.price_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Public View Checkpoints" ON public.market_checkpoints;
DROP POLICY IF EXISTS "Admin Manage Checkpoints" ON public.market_checkpoints;
CREATE POLICY "Public View Checkpoints" ON public.market_checkpoints FOR SELECT USING (true);
CREATE POLICY "Admin Manage Checkpoints" ON public.market_checkpoints FOR ALL USING (true);`;

export function AdminInvestments() {
  const [products, setProducts] = React.useState<InvestmentProduct[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<InvestmentSubscription[]>([]);
  const [allSubscriptions, setAllSubscriptions] = React.useState<InvestmentSubscription[]>([]);
  const [fundingQueue, setFundingQueue] = React.useState<FundingSubmission[]>([]);
  const [redemptions, setRedemptions] = React.useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'products' | 'registry' | 'funding' | 'liquidity'>('products');
  const [isApproving, setIsApproving] = React.useState<string | null>(null);
  const [showFundingModal, setShowFundingModal] = React.useState<InvestmentSubscription | null>(null);
  const [fundingForm, setFundingForm] = React.useState<FundingDetails>({
    beneficiary: "Sentinel Global Holdings",
    bank: "Goldman Sachs (Intl)",
    swift: "",
    iban: "",
    wallet_address: "",
    network: "Ethereum (ERC-20)",
    asset: "USDT",
    reference_code: ""
  });
  const [isAddingProduct, setIsAddingProduct] = React.useState(false);
  const [isUpdatingPerformance, setIsUpdatingPerformance] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<InvestmentProduct | null>(null);
  const [dbStatus, setDbStatus] = React.useState<'connected' | 'disconnected' | 'missing_table'>('connected');
  const [showSqlModal, setShowSqlModal] = React.useState(false);

  // New Product Form
  const [newProduct, setNewProduct] = React.useState<Partial<InvestmentProduct>>({
    name: "",
    commodity: "Gold",
    status: 'Draft',
    risk_level: 'Low',
    roi_type: 'Fixed',
    distribution_frequency: 'End of term',
    min_investment: 10000,
    max_allocation: 500000,
    unit_price: 1000,
    total_units: 100,
    target_roi: 12,
    duration_days: 180,
    start_date: new Date().toISOString().split('T')[0],
    maturity_date: "",
    description: "",
    strategy_notes: ""
  });

  // Auto-calculate maturity date when duration or start date changes
  React.useEffect(() => {
    if (newProduct.start_date && newProduct.duration_days) {
      const start = new Date(newProduct.start_date);
      const maturity = new Date(start);
      maturity.setDate(start.getDate() + Number(newProduct.duration_days));
      setNewProduct(prev => ({ 
        ...prev, 
        maturity_date: maturity.toISOString().split('T')[0] 
      }));
    }
  }, [newProduct.start_date, newProduct.duration_days]);

  // Performance Update Form
  const [performanceForm, setPerformanceForm] = React.useState<Partial<PerformanceUpdate>>({
    current_nav: 1000,
    roi_percentage: 0
  });

  React.useEffect(() => {
    fetchProducts();
    fetchSubscriptions();
    fetchRegistry();
    fetchFundingQueue();
    fetchRedemptions();
  }, []);

  const fetchRegistry = async () => {
    try {
        const { data, error } = await supabase
            .from('investment_subscriptions')
            .select(`
                *, 
                product:investment_products(*)
            `)
            .order('created_at', { ascending: false });
        
        if (error && error.code !== '42P01') throw error;
        setAllSubscriptions(data || []);
    } catch (err) {
        console.error("Registry fetch error:", err);
    }
  };

  const fetchFundingQueue = async () => {
    try {
        const { data, error } = await supabase
            .from('funding_submissions')
            .select(`
                *, 
                subscription:investment_subscriptions(*, product:investment_products(*))
            `)
            .eq('status', 'Pending')
            .order('created_at', { ascending: false });
        
        if (error && error.code !== '42P01') throw error;
        setFundingQueue(data || []);
    } catch (err) {
        console.error("Funding queue fetch error:", err);
    }
  };

  const fetchRedemptions = async () => {
    try {
        // Attempt a joined fetch first
        const { data, error } = await supabase
            .from('redemption_requests')
            .select(`
                *, 
                position:investor_positions(*, product:investment_products(*)),
                profile:profiles(email, full_name)
            `)
            .order('created_at', { ascending: false });
        
        if (error) {
            // Fallback: Relationship missing (schema cache out of sync)
            if (error.code === 'PGRST200') {
               console.warn("Foreign key relationship missing between redemption_requests and profiles. Performing manual join.");
               const [redRes, profRes] = await Promise.all([
                   supabase.from('redemption_requests').select('*, position:investor_positions(*, product:investment_products(*))').order('created_at', { ascending: false }),
                   supabase.from('profiles').select('id, email, full_name')
               ]);

               if (redRes.error && redRes.error.code !== '42P01') throw redRes.error;
               
               const profilesMap = (profRes.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
               const joinedData = (redRes.data || []).map(r => ({
                   ...r,
                   profile: profilesMap[r.user_id] || null
               }));
               
               setRedemptions(joinedData);
               return;
            }
            if (error.code !== '42P01') throw error;
        }
        setRedemptions(data || []);
    } catch (err) {
        console.error("Redemption fetch error:", err);
    }
  };

  const handleVerifyFunding = async (submission: FundingSubmission, status: 'Verified' | 'Rejected') => {
      try {
          setIsApproving(submission.id);
          
          // 1. Update submission status
          const { error: fundErr } = await supabase
            .from('funding_submissions')
            .update({ 
                status, 
                verified_at: status === 'Verified' ? new Date().toISOString() : null 
            })
            .eq('id', submission.id);
          
          if (fundErr) throw fundErr;

          // 2. If verified, update subscription and possibly activate investment
          if (status === 'Verified') {
              const { error: subErr } = await supabase
                .from('investment_subscriptions')
                .update({ status: 'Funded', funded_at: new Date().toISOString() })
                .eq('id', submission.subscription_id);
              
              if (subErr) throw subErr;

              // Create transaction log for allocation
              await supabase.from('investor_transactions').insert({
                  user_id: submission.user_id,
                  subscription_id: submission.subscription_id,
                  type: 'allocation',
                  amount: submission.amount,
                  description: `Capital allocation confirmed for ${submission.subscription?.product?.name}`,
                  metadata: { submission_id: submission.id }
              });

              // Create position record if it doesn't exist
              const { data: existingPos } = await supabase
                .from('investor_positions')
                .select('id')
                .eq('subscription_id', submission.subscription_id)
                .single();

              if (!existingPos) {
                  await supabase.from('investor_positions').insert({
                      user_id: submission.user_id,
                      product_id: submission.subscription?.product_id,
                      units: submission.subscription?.units,
                      total_invested: submission.amount,
                      status: 'Active'
                  });
              }
          } else if (status === 'Rejected') {
              // If funding is rejected, we should return the reserved units to available pool
              // and cancel the subscription
              await supabase
                .from('investment_subscriptions')
                .update({ status: 'Rejected' })
                .eq('id', submission.subscription_id);

              if (submission.subscription?.product_id && submission.subscription?.units) {
                  const { data: prod } = await supabase
                    .from('investment_products')
                    .select('units_available')
                    .eq('id', submission.subscription.product_id)
                    .single();
                  
                  if (prod) {
                      await supabase
                        .from('investment_products')
                        .update({ units_available: prod.units_available + submission.subscription.units })
                        .eq('id', submission.subscription.product_id);
                  }
              }
          }

          if (status === 'Verified') {
            toast.success(`Funding approved and units allocated.`);
          } else {
            toast.info(`Funding ${status.toLowerCase()} successfully.`);
          }
          fetchFundingQueue();
          fetchSubscriptions();
      } catch (err) {
          console.error("Verification failed:", err);
          toast.error("Verification failed. Please check database state.");
      } finally {
          setIsApproving(null);
      }
  };

  const handleUpdateRedemption = async (request: RedemptionRequest, status: RedemptionRequest['status']) => {
    try {
        setIsApproving(request.id);
        
        const { error } = await supabase
            .from('redemption_requests')
            .update({ 
                status, 
                processed_at: status === 'Completed' ? new Date().toISOString() : null 
            })
            .eq('id', request.id);
        
        if (error) throw error;

        if (status === 'Completed') {
            // 1. Log redemption transaction
            await supabase.from('investor_transactions').insert({
                user_id: request.user_id,
                position_id: request.position_id,
                type: 'redemption',
                amount: request.amount,
                description: `Liquidity redemption completed for ${request.position?.product?.name}`,
                metadata: { request_id: request.id }
            });

            // 2. Return units to the product pool
            if (request.position?.product_id && request.units) {
                const { data: prod } = await supabase
                    .from('investment_products')
                    .select('units_available')
                    .eq('id', request.position.product_id)
                    .single();
                
                if (prod) {
                    await supabase
                        .from('investment_products')
                        .update({ units_available: prod.units_available + request.units })
                        .eq('id', request.position.product_id);
                }
            }
        }

        toast.success(`Redemption request updated to ${status}.`);
        fetchRedemptions();
    } catch (err) {
        console.error("Redemption update failed:", err);
    } finally {
        setIsApproving(null);
    }
  };

  const fetchSubscriptions = async () => {
    try {
        const { data, error } = await supabase
            .from('investment_subscriptions')
            .select('*, product:investment_products(*)')
            .in('status', ['Awaiting Funding Instructions', 'Awaiting Payment', 'Funding Submitted'])
            .order('created_at', { ascending: false });
        
        if (error && error.code !== '42P01') throw error;
        setSubscriptions(data || []);
    } catch (err) {
        console.error("Failed to fetch pending subscriptions:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log("Fetching products from Supabase...");
      const { data, error, count } = await supabase
        .from('investment_products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase Error Code:", error.code);
        if (error.code === '42P01' || error.message?.includes('not found')) {
          setDbStatus('missing_table');
        } else {
          setDbStatus('disconnected');
        }
        
        // Always try to load from local storage if DB fetch fails
        const localData = localStorage.getItem('gs_simulated_products');
        if (localData) setProducts(JSON.parse(localData));
      } else {
        const productList = data || [];
        setProducts(productList);
        
        // If data is perfectly empty, we might still have a table issue (missing RLS policies)
        // or just no data. We'll set status to connected but keep checking in the UI.
        setDbStatus('connected');
        
        if (productList.length === 0) {
            console.log("No products found in DB. Checking local storage...");
            const localData = localStorage.getItem('gs_simulated_products');
            if (localData) {
                const parsed = JSON.parse(localData);
                if (parsed.length > 0) {
                    setProducts(parsed);
                    // If we have local data but DB is empty + connected, 
                    // it heavily implies the user hasn't successfully synced yet.
                    setDbStatus('missing_table'); 
                }
            }
        }
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
      setDbStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const persistLocally = (newProd: InvestmentProduct) => {
      const localData = localStorage.getItem('gs_simulated_products');
      const currentProds = localData ? JSON.parse(localData) : [];
      const updated = [newProd, ...currentProds];
      localStorage.setItem('gs_simulated_products', JSON.stringify(updated));
      setProducts(updated);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      const { error } = await supabase.from('investment_products').delete().eq('id', id);
      if (error) {
          // If product is in use, Supabase will throw a foreign key error
          if (error.code === '23503') {
              toast.error("Cannot delete product: It has active subscriptions or positions. Archive it instead.");
              return;
          }
          throw error;
      }
      
      toast.success("Product deleted successfully.");
      fetchProducts();
    } catch (err) {
      console.error("Delete failed:", err);
      // Fallback for local
      const localData = localStorage.getItem('gs_simulated_products');
      if (localData) {
          const currentProds = JSON.parse(localData);
          const updated = currentProds.filter((p: any) => p.id !== id);
          localStorage.setItem('gs_simulated_products', JSON.stringify(updated));
          setProducts(updated);
          toast.success("Product removed from local storage.");
      } else {
        toast.error("Delete operation failed.");
      }
    }
  };

  const handleEditProduct = (product: InvestmentProduct) => {
      setNewProduct({ ...product });
      setSelectedProduct(product);
      setIsAddingProduct(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.commodity) {
        toast.error("Please provide at least a name and commodity.");
        return;
      }

      const activeStatus = newProduct.status || 'Active';
      const statusValue = activeStatus.toLowerCase();
      const isUpdating = !!selectedProduct?.id && !String(selectedProduct.id).startsWith('sim-');

      const productPayload = {
        ...newProduct,
        units_available: newProduct.units_available ?? newProduct.total_units,
        status: statusValue,
        updated_at: new Date().toISOString()
      };
      
      // Clean up for Supabase (remove simulated or extra fields)
      const { id, product: _unused, ...dbPayload } = productPayload as any;

      let error;
      if (isUpdating) {
        const { error: updateError } = await supabase
          .from('investment_products')
          .update(dbPayload)
          .eq('id', selectedProduct.id);
        error = updateError;
      } else {
        const { error: insertError, data: insertData } = await supabase
          .from('investment_products')
          .insert([{ ...dbPayload, created_at: new Date().toISOString() }])
          .select();
        
        error = insertError;
        
        // Log initial price history for new products
        if (!error && insertData && insertData[0]) {
            await supabase.from('price_history').insert([{
                product_id: insertData[0].id,
                price: insertData[0].unit_price,
                timestamp: new Date().toISOString()
            }]);
        }
      }

      if (error) throw error;
      
      setIsAddingProduct(false);
      setSelectedProduct(null);
      fetchProducts();
      toast.success(`SUCCESS: Product ${isUpdating ? 'updated' : 'created'} successfully.`);
    } catch (err: any) {
      console.error("Save failure:", err);
      
      // Local fallback
      const simulatedProd = { 
        ...newProduct, 
        id: selectedProduct?.id || `sim-${Date.now()}`, 
        units_available: newProduct.units_available ?? newProduct.total_units,
        status: newProduct.status || 'Active',
      } as InvestmentProduct;

      const localData = localStorage.getItem('gs_simulated_products');
      const currentProds = localData ? JSON.parse(localData) : [];
      let updated;
      
      if (selectedProduct?.id) {
          updated = currentProds.map((p: any) => p.id === selectedProduct.id ? simulatedProd : p);
      } else {
          updated = [simulatedProd, ...currentProds];
      }
      
      localStorage.setItem('gs_simulated_products', JSON.stringify(updated));
      setProducts(updated);
      setIsAddingProduct(false);
      setSelectedProduct(null);
      toast.info("Note: Saved to local storage (Database table missing or disconnected).");
    }
  };

  const handleProvideFundingInstructions = async () => {
    if (!showFundingModal) return;
    try {
        const { error } = await supabase
            .from('investment_subscriptions')
            .update({ 
                status: 'Awaiting Payment', 
                funding_details: fundingForm 
            })
            .eq('id', showFundingModal.id);
        
        if (error) throw error;
        toast.success("Settlement instructions dispatched to investor.");
        setShowFundingModal(null);
        fetchSubscriptions();
    } catch (err) {
        console.error("Failed to send instructions:", err);
        toast.error("Dispatch failed.");
    }
  }

  const handleApproveSubscription = async (sub: InvestmentSubscription) => {
    try {
        setIsApproving(sub.id);
        
        // 1. Update Subscription Status
        const { error: subUpdateError } = await supabase
            .from('investment_subscriptions')
            .update({ status: 'Funded', funded_at: new Date().toISOString() })
            .eq('id', sub.id);
        
        if (subUpdateError) throw subUpdateError;

        // 3. Create Investor Position (Portfolio)
        const { error: posError } = await supabase
            .from('investor_positions')
            .insert([{
                user_id: sub.user_id,
                product_id: sub.product_id,
                units: sub.units,
                total_invested: sub.total_amount,
                status: 'Active',
                created_at: new Date().toISOString()
            }]);
        
        if (posError) throw posError;

        // 4. Create Transaction Log (Part 5: Ledger)
        await supabase.from('investor_transactions').insert({
            user_id: sub.user_id,
            subscription_id: sub.id,
            type: 'allocation',
            amount: sub.total_amount,
            description: `Capital allocation finalized for ${sub.product?.name}`,
            metadata: { units: sub.units, price: sub.unit_price_at_purchase }
        });

        toast.success(`SUBSCRIPTION FUNDED: Payment approved and ${sub.units} units allocated to investor.`);
        fetchProducts();
        fetchSubscriptions();
    } catch (err) {
        console.error("Approval failed:", err);
        toast.error("Action failed. Ensure 'investor_positions' table exists.");
    } finally {
        setIsApproving(null);
    }
  };

  const handleUpdatePerformance = async () => {
    if (!selectedProduct) return;
    try {
       const payload = { 
         ...performanceForm, 
         product_id: selectedProduct.id, 
         created_at: new Date().toISOString() 
       };

       // 1. Log historical performance
       const { error: logError } = await supabase.from('investment_performance').insert([payload]);
       if (logError) throw logError;

       // 1b. Log specifically into price_history for the chart visualization
       const { error: priceHistoryError } = await supabase.from('price_history').insert([{
           product_id: selectedProduct.id,
           price: performanceForm.current_nav,
           timestamp: new Date().toISOString()
       }]);
       if (priceHistoryError) console.error("Failed to log price history:", priceHistoryError);

       // 2. Update current unit price in the main product table
       if (performanceForm.current_nav) {
         const { error: prodError } = await supabase
           .from('investment_products')
           .update({ 
              unit_price: performanceForm.current_nav,
              updated_at: new Date().toISOString()
           })
           .eq('id', selectedProduct.id);
         
         if (prodError) throw prodError;
       }

       setIsUpdatingPerformance(false);
       fetchProducts();
       toast.success(`BROADCAST SUCCESS: Valuation and ROI performance updated for ${selectedProduct.name}.`);
    } catch (err) {
       console.warn("Update failed:", err);
       toast.error("Sync failed. Check database connectivity.");
       setIsUpdatingPerformance(false);
    }
  };

  const handleInitializePriceHistory = async () => {
      try {
          const { data: prods, error: fetchError } = await supabase.from('investment_products').select('id, unit_price');
          if (fetchError) throw fetchError;
          if (!prods || prods.length === 0) return;

          const { data: existingHistory, error: historyError } = await supabase.from('price_history').select('product_id');
          if (historyError) throw historyError;

          const existingIds = new Set((existingHistory || []).map(h => h.product_id));
          const toInsert = prods
            .filter(p => !existingIds.has(p.id))
            .map(p => ({
                product_id: p.id,
                price: p.unit_price,
                timestamp: new Date().toISOString()
            }));

          if (toInsert.length > 0) {
              const { error: insertError } = await supabase.from('price_history').insert(toInsert);
              if (insertError) throw insertError;
              toast.success(`Success: Seeded ${toInsert.length} data points for visualization.`);
          } else {
              toast.info("Chart data is already initialized.");
          }
      } catch (err) {
          console.error("Initialization failed:", err);
          toast.error("Data synchronization failed. Table might be missing.");
      }
  };

  return (
    <AdminLayout title="Investment Control Center" icon={TrendingUp}>
      <div className="space-y-8">
        <p className="text-gray-400 -mt-6 mb-8">Manage investment products, monitor global performance, and update fund valuations.</p>

        {/* Database Status Banner */}
        {dbStatus !== 'connected' && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={cn(
                    "mb-8 p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4",
                    dbStatus === 'missing_table' ? "bg-red-500/10 border-red-500/20" : "bg-orange-500/10 border-orange-500/20"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        dbStatus === 'missing_table' ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
                    )}>
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">
                            {dbStatus === 'missing_table' ? "Database Persistence Required" : "Database Connection Issues"}
                        </h4>
                        <p className="text-xs text-gray-500">
                            {dbStatus === 'missing_table' 
                                ? "The 'investment_products' table is missing from your Supabase database. Data is currently being stored in your browser's local cache."
                                : "We're having trouble connecting to your Supabase instance. Please check your network or environment variables."}
                        </p>
                    </div>
                </div>
                {dbStatus === 'missing_table' && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 shrink-0 gap-2 font-bold"
                        onClick={() => setShowSqlModal(true)}
                    >
                        <Database className="w-4 h-4" /> Finalize Cloud Sync
                    </Button>
                )}
            </motion.div>
        )}
        
        {/* Admin Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           {[
            { label: "Total Platform Capital", value: `$${(allSubscriptions.reduce((acc, curr) => acc + curr.total_amount, 0) / 1000000).toFixed(1)}M`, icon: Building2, color: "text-blue-400" },
            { label: "Active Investors", value: new Set(allSubscriptions.map(s => s.user_id)).size.toString(), icon: Users, color: "text-gold" },
            { label: "Products Listed", value: products.length.toString(), icon: Layers, color: "text-green-400" },
            { label: "Escrow Coverage", value: "100%", icon: CheckCircle2, color: "text-green-500" },
          ].map((stat, i) => (
            <Card key={stat.label} className="bg-secondary/20 border-white/5">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{stat.label}</p>
                        <stat.icon className={cn("w-4 h-4", stat.color)} />
                    </div>
                    <p className="text-3xl font-serif text-white">{stat.value}</p>
                </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab System */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/5 pb-4">
            {[
                { id: 'products', label: 'Offerings', icon: Layers },
                { id: 'registry', label: 'Investor Registry', icon: UserCircle },
                { id: 'funding', label: 'Funding Queue', icon: HandMetal },
                { id: 'liquidity', label: 'Liquidity Panel', icon: ArrowUpCircle }
            ].map(tab => (
                <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={cn(
                        "gap-2 text-[10px] font-black uppercase tracking-widest h-10 px-4",
                        activeTab === tab.id ? "bg-gold text-background" : "text-gray-500 hover:text-white"
                    )}
                    onClick={() => setActiveTab(tab.id as any)}
                >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                    {tab.id === 'funding' && fundingQueue.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px] animate-pulse">
                            {fundingQueue.length}
                        </span>
                    )}
                </Button>
            ))}
        </div>

        {activeTab === 'products' && (
          <>
            {/* Capital Settlement Queue (Pending Subscriptions) */}
            {subscriptions.length > 0 && (
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                        <h3 className="text-xl font-serif text-white">Capital Settlement Queue</h3>
                        <span className="bg-gold/10 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/20">{subscriptions.length} Pending Approval</span>
                    </div>
                    <Button variant="ghost" className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest gap-2" onClick={fetchSubscriptions}>
                        <RefreshCw className="w-3 h-3" /> Refresh Queue
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscriptions.map(sub => (
                        <Card key={sub.id} className={cn(
                            "bg-secondary/40 border-white/5 hover:border-gold/30 transition-colors",
                            sub.status === 'Funding Submitted' ? "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : ""
                        )}>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Investor ID: {sub.user_id.slice(0, 8)}...</p>
                                            <span className={cn(
                                                "text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-tighter",
                                                sub.status === 'Funding Submitted' ? "bg-blue-400/20 text-blue-400" : "bg-gold/10 text-gold"
                                            )}>{sub.status}</span>
                                        </div>
                                        <h4 className="text-white font-serif text-lg">{sub.product?.name}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white font-mono">${sub.total_amount.toLocaleString()}</p>
                                        <p className="text-[9px] text-gold uppercase tracking-widest font-black italic">{sub.payment_method}</p>
                                    </div>
                                </div>

                                {sub.status === 'Funding Submitted' && (
                                    <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                        <p className="text-[9px] text-blue-400 uppercase font-black mb-1">Settlement Proof Provided:</p>
                                        <p className="text-[11px] text-white font-mono break-all leading-tight bg-black/30 p-2 rounded border border-white/5">{sub.payment_proof_hash}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="text-[10px] text-gray-500">
                                        Requested {sub.units} Units • {new Date(sub.created_at).toLocaleDateString()}
                                    </div>
                                    {sub.status === 'Awaiting Funding Instructions' ? (
                                        <Button 
                                            className="bg-gold hover:bg-gold-light text-background font-black text-[10px] px-6 h-8 gap-2 uppercase tracking-tight"
                                            onClick={() => {
                                                setFundingForm(prev => ({ ...prev, reference_code: `SG-${sub.id.slice(0,8).toUpperCase()}` }));
                                                setShowFundingModal(sub);
                                            }}
                                        >
                                            Send Instructions
                                        </Button>
                                    ) : (
                                        <Button 
                                            className={cn(
                                                "font-black text-[10px] px-6 h-8 gap-2 uppercase tracking-tight",
                                                sub.status === 'Funding Submitted' ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gold/20 text-gold hover:bg-gold/30 cursor-not-allowed"
                                            )}
                                            onClick={() => sub.status === 'Funding Submitted' && handleApproveSubscription(sub)}
                                            disabled={!!isApproving || sub.status === 'Awaiting Payment'}
                                        >
                                            {isApproving === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                                             sub.status === 'Funding Submitted' ? "Verify & Activate" : "Awaiting Settlement"}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.section>
        )}

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                <h3 className="text-xl font-serif text-white uppercase tracking-widest">Market Trend Manipulation</h3>
            </div>
            <div className="max-w-2xl">
                <AdminChartControls />
                <p className="mt-4 text-[10px] text-gray-500 font-mono uppercase leading-relaxed max-w-lg">
                    Use these controls to inject global or product-specific market volatility. 
                    Target values are calculated from current AUM and will be reached over the specified timeframe.
                </p>
            </div>
        </motion.div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Product Management</h2>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[10px] md:text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5"><Activity className="w-3 md:w-3.5 h-3 md:h-3.5 text-green-500" /> System Active</span>
                    <span className="flex items-center gap-1.5"><BarChart3 className="w-3 md:w-3.5 h-3 md:h-3.5 text-blue-500" /> Real-time Feeds Synchronized</span>
                </div>
            </div>
            <div className="flex gap-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input placeholder="Filter products..." className="pl-10 h-10 w-64 bg-white/5 border-white/10 text-white text-xs" />
                 </div>
                 <Button 
                    variant="outline"
                    className="border-white/10 text-gray-400 hover:text-white font-bold gap-2"
                    onClick={() => setShowSqlModal(true)}
                 >
                    <Database className="w-4 h-4" /> Sync DB
                 </Button>
                  <Button 
                    variant="outline"
                    className="border-gold/20 text-gold hover:bg-gold/10 font-bold gap-2"
                    onClick={handleInitializePriceHistory}
                 >
                    <RefreshCw className="w-4 h-4" /> Initialize Charts
                 </Button>
                 <Button 
                    className="bg-gold hover:bg-gold-light text-background font-bold gap-2"
                    onClick={() => {
                        setSelectedProduct(null);
                        setNewProduct({
                            name: "",
                            commodity: "Gold",
                            status: 'Draft',
                            risk_level: 'Low',
                            roi_type: 'Fixed',
                            distribution_frequency: 'End of term',
                            min_investment: 10000,
                            max_allocation: 500000,
                            unit_price: 1000,
                            total_units: 100,
                            target_roi: 12,
                            duration_days: 180,
                            start_date: new Date().toISOString().split('T')[0],
                            maturity_date: "",
                            description: "",
                            strategy_notes: ""
                        });
                        setIsAddingProduct(true);
                    }}
                 >
                    <Plus className="w-4 h-4" /> Create Managed Product
                 </Button>
            </div>
        </div>

        {/* Product Grid */}
        <div className="space-y-6">
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 text-gold animate-spin" />
                </div>
            ) : products.length === 0 ? (
                <div className="py-20 text-center border border-white/5 bg-secondary/10 rounded-3xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Layers className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-serif text-white mb-2">No active investment products</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
                        Begin by structuring your first managed commodity product. Once published, it will appear in the global marketplaces.
                    </p>
                    
                    <div className="flex flex-col items-center gap-4">
                        <Button 
                            className="bg-gold hover:bg-gold-light text-background font-bold gap-2 px-8"
                            onClick={() => {
                                setSelectedProduct(null);
                                setIsAddingProduct(true);
                            }}
                        >
                            <Plus className="w-4 h-4" /> Create First Product
                        </Button>
                        
                        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 max-w-sm text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Persistence Diagnostic</p>
                            <p className="text-xs text-gray-400 mb-4">Are your products disappearing after refresh? You need to finalize your cloud database sync.</p>
                            <Button 
                                variant="link" 
                                className="text-gold h-auto p-0 text-xs font-bold"
                                onClick={() => setShowSqlModal(true)}
                            >
                                View SQL Setup Instructions
                            </Button>
                        </div>
                    </div>
                </div>
            ) : products.map((product) => (
                <Card key={product.id} className="bg-secondary/20 border-white/5 hover:border-white/10 transition-colors group">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row justify-between gap-8">
                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest leading-none">
                                        {product.commodity}
                                    </span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border leading-none",
                                        (product.status?.toLowerCase() === 'active' || product.status?.toLowerCase() === 'open') 
                                            ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                            : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                    )}>
                                        {product.status}
                                    </span>
                                    <span className="text-gray-600 text-[10px] font-mono tracking-widest uppercase">ID: {product.id}</span>
                                </div>
                                <h3 className="text-2xl font-serif text-white group-hover:text-gold transition-colors mb-2">{product.name}</h3>
                                <div className="flex items-center gap-8 text-xs text-gray-400">
                                    <p className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-green-500" /> ROI Target: {product.target_roi}%</p>
                                    <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-400" /> Duration: {product.duration_days} Days</p>
                                    <p className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-gold" /> Available Units: {product.units_available}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                                <Button 
                                    variant="outline" 
                                    className="border-white/10 text-white hover:bg-gold hover:text-background font-bold gap-2 text-xs"
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setPerformanceForm({ current_nav: product.unit_price, roi_percentage: 0 });
                                        setIsUpdatingPerformance(true);
                                    }}
                                >
                                    <Activity className="w-4 h-4" /> Update Performance
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="text-gray-500 hover:text-white"
                                    onClick={() => handleEditProduct(product)}
                                >
                                    <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="text-red-500/50 hover:text-red-500"
                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="text-gray-500"
                                    onClick={() => handleEditProduct(product)}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </>
    )}

        {activeTab === 'registry' && (
            <Card className="bg-secondary/20 border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                   <div>
                       <h3 className="text-lg font-serif text-white">Investor Registry</h3>
                       <p className="text-xs text-gray-500">Comprehensive ledger of all platform holdings and capital allocations.</p>
                   </div>
                   <Button variant="outline" size="sm" className="text-[10px] font-bold gap-2" onClick={fetchRegistry}>
                       <RefreshCw className="w-3 h-3" /> Sync Registry
                   </Button>
                </div>
                <Table className="min-w-full">
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-[10px] text-gray-500 uppercase font-black">Investor Name / ID</TableHead>
                            <TableHead className="text-[10px] text-gray-500 uppercase font-black">Allocation (Units)</TableHead>
                            <TableHead className="text-[10px] text-gray-500 uppercase font-black text-right">Capital Disbursed</TableHead>
                            <TableHead className="text-[10px] text-gray-500 uppercase font-black">Funding Status</TableHead>
                            <TableHead className="text-[10px] text-gray-500 uppercase font-black">Status</TableHead>
                            <TableHead className="text-[10px] text-gray-500 uppercase font-black text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allSubscriptions.map((sub) => (
                            <TableRow key={sub.id} className="border-white/5 hover:bg-white/5">
                                <TableCell className="font-mono text-[11px] text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-gold text-[10px]">{sub.user_id.slice(0, 2).toUpperCase()}</div>
                                        <div className="space-y-0.5 text-left">
                                            <p className="text-xs font-bold text-white">Investor #{sub.user_id.split('-')[0].toUpperCase()}</p>
                                            <p className="text-[8px] text-gray-500">{sub.user_id}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-left">
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-white font-bold">{sub.product?.name}</p>
                                        <p className="text-[10px] text-gray-500 italic">{sub.units} Units @ ${sub.unit_price_at_purchase?.toLocaleString()}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-xs text-white font-mono font-bold">${sub.total_amount.toLocaleString()}</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                        sub.status === 'Funded' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                                        sub.status === 'Cancelled' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                        "bg-gold/10 text-gold border-gold/20"
                                    )}>
                                        {sub.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                     <span className="text-[9px] text-white font-bold px-1.5 py-0.5 bg-white/5 rounded border border-white/10 uppercase tracking-widest">
                                         {sub.status === 'Funded' ? 'ACTIVE' : 'INCOMPLETE'}
                                     </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-white">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        )}

        {activeTab === 'funding' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center text-left">
                    <div>
                        <h3 className="text-2xl font-serif text-white">Pending Funding Verifications</h3>
                        <p className="text-sm text-gray-500 italic">Verify proof of capital settlement before unit allocation.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {fundingQueue.length > 0 ? fundingQueue.map((sub) => (
                        <Card key={sub.id} className="bg-secondary/20 border-white/5 overflow-hidden">
                            <div className="p-6 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                                        <Banknote className="w-6 h-6 text-gold" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-white font-bold">{sub.subscription?.product?.name} Allocation</h4>
                                        <p className="text-xs text-gray-500 italic mb-1">Investor Reference: {sub.user_id.split('-')[0]}</p>
                                        <div className="flex gap-2">
                                           <span className="bg-white/5 text-[9px] text-gray-400 px-1.5 py-0.5 rounded font-mono">HASH: {sub.payment_proof_hash.slice(0, 12)}...</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-right grow justify-end">
                                     <div>
                                         <p className="text-[9px] uppercase text-gray-500 font-bold mb-1">Capital Due</p>
                                         <p className="text-lg text-white font-bold font-mono">${sub.amount.toLocaleString()}</p>
                                     </div>
                                     <div className="hidden md:block">
                                         <p className="text-[9px] uppercase text-gray-500 font-bold mb-1">Units Allocated</p>
                                         <p className="text-lg text-white font-bold font-mono">{sub.subscription?.units} U</p>
                                     </div>
                                     <div className="flex items-center gap-2 justify-end">
                                         <Button 
                                            size="sm" 
                                            className="bg-green-600 hover:bg-green-700 text-white h-10 px-4 font-bold"
                                            onClick={() => handleVerifyFunding(sub, 'Verified')}
                                            disabled={isApproving === sub.id}
                                         >
                                             {isApproving === sub.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Verify & Allocate <Check className="ml-2 w-4 h-4" /></>}
                                         </Button>
                                         <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-red-500 hover:bg-red-500/10 h-10 w-10 p-0"
                                            onClick={() => handleVerifyFunding(sub, 'Rejected')}
                                         >
                                             <X className="w-4 h-4" />
                                         </Button>
                                     </div>
                                </div>
                            </div>
                        </Card>
                    )) : (
                        <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 font-serif">Funding queue is currently clear.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'liquidity' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center text-left">
                    <div>
                        <h3 className="text-2xl font-serif text-white">Liquidity Requests Panel</h3>
                        <p className="text-sm text-gray-500 italic">Review and process capital redemptions and early exits.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {redemptions.length > 0 ? redemptions.map((req) => (
                        <Card key={req.id} className="bg-secondary/20 border-white/5 overflow-hidden text-left">
                            <div className="p-6 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500 font-black italic">!</div>
                                    <div>
                                        <h4 className="text-white font-bold">{req.position?.product?.name} Redemption</h4>
                                        <div className="flex flex-col gap-1 my-1">
                                            <p className="text-[10px] text-gold font-bold">Requester: {req.profile?.email || req.user_id}</p>
                                            <p className="text-xs text-gray-500 italic">Request Type: <span className="text-amber-500 font-bold uppercase">{req.redemption_type}</span></p>
                                        </div>
                                        <div className="flex flex-col gap-2 mt-3 p-3 bg-black/30 rounded-lg border border-white/5">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Exit Route: {req.payment_destination?.type || 'Standard'}</span>
                                            {req.payment_destination?.type === 'Bank' ? (
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-300">
                                                    <p>Beneficiary: <span className="text-white">{req.payment_destination.beneficiary}</span></p>
                                                    <p>Bank: <span className="text-white">{req.payment_destination.bankName}</span></p>
                                                    <p className="col-span-2">IBAN: <span className="text-white font-mono">{req.payment_destination.iban}</span></p>
                                                    <p className="col-span-2">SWIFT: <span className="text-white font-mono">{req.payment_destination.swift}</span></p>
                                                </div>
                                            ) : req.payment_destination?.type === 'Crypto' ? (
                                                <div className="space-y-1 text-[10px] text-gray-300">
                                                    <p>Network: <span className="text-white">{req.payment_destination.network}</span></p>
                                                    <p>Wallet: <span className="text-white font-mono break-all">{req.payment_destination.address}</span></p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-500 font-mono italic">Details: {req.payment_destination?.details}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-4">
                                           <span className={cn(
                                               "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                               req.status === 'Completed' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                                               req.status === 'Rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                               "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                           )}>
                                               {req.status}
                                           </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 text-right grow justify-end">
                                     <div>
                                         <p className="text-[9px] uppercase text-gray-500 font-bold mb-1">Units (Exit)</p>
                                         <p className="text-lg text-white font-bold font-mono">{req.units} U</p>
                                     </div>
                                     <div>
                                         <p className="text-[9px] uppercase text-gray-500 font-black mb-1 text-amber-500/80">Payout Value</p>
                                         <p className="text-lg text-amber-500 font-bold font-mono">${req.amount.toLocaleString()}</p>
                                     </div>
                                     <div className="flex items-center gap-2 justify-end">
                                         {req.status === 'Pending Review' ? (
                                            <>
                                                <Button 
                                                    size="sm" 
                                                    className="bg-gold text-background hover:bg-gold-light h-9 font-bold text-[10px] uppercase"
                                                    onClick={() => handleUpdateRedemption(req, 'Approved')}
                                                >
                                                    Approve
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="text-red-500 hover:bg-red-500/10 h-9 w-9 p-0"
                                                    onClick={() => handleUpdateRedemption(req, 'Rejected')}
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </Button>
                                            </>
                                         ) : req.status === 'Approved' ? (
                                            <Button 
                                                size="sm" 
                                                className="bg-blue-600 hover:bg-blue-700 text-white h-9 font-bold text-[10px] uppercase"
                                                onClick={() => handleUpdateRedemption(req, 'Processing Payout')}
                                            >
                                                Process Payout
                                            </Button>
                                         ) : req.status === 'Processing Payout' ? (
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 text-white h-9 font-bold text-[10px] uppercase"
                                                onClick={() => handleUpdateRedemption(req, 'Completed')}
                                            >
                                                Mark Completed
                                            </Button>
                                         ) : req.status === 'Rejected' ? (
                                            <div className="flex items-center gap-2 text-red-500">
                                                <Ban className="w-5 h-5" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Rejected</span>
                                            </div>
                                         ) : (
                                            <div className="flex items-center gap-2 text-green-500">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Disbursed</span>
                                            </div>
                                         )}
                                     </div>
                                </div>
                            </div>
                        </Card>
                    )) : (
                        <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 font-serif">No liquidity requests currently pending.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* MODAL: ADD PRODUCT */}
        {isAddingProduct && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto pt-20">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-secondary p-8 rounded-3xl border border-white/10 w-full max-w-4xl shadow-2xl my-auto">
                    <h3 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
                        <Building2 className="text-gold" /> Structure New Managed Product
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* BASIC INFO */}
                        <div className="space-y-6">
                            <h4 className="text-gold text-[10px] uppercase font-black tracking-widest border-b border-gold/20 pb-2">Basic Info</h4>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">Product Name</Label>
                                <Input placeholder="e.g., GCC Sovereign Energy Fund" className="bg-white/5 border-white/10 text-white" value={newProduct.name || ""} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">Commodity</Label>
                                <Select value={newProduct.commodity} onValueChange={v => setNewProduct({...newProduct, commodity: v})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Select commodity" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-secondary border-white/10 text-white">
                                        <SelectItem value="Gold">Gold (AU)</SelectItem>
                                        <SelectItem value="Silver">Silver (AG)</SelectItem>
                                        <SelectItem value="Crude Oil">Crude Oil (WTI/Brent)</SelectItem>
                                        <SelectItem value="Natural Gas">Natural Gas</SelectItem>
                                        <SelectItem value="Copper">Copper (CU)</SelectItem>
                                        <SelectItem value="Lithium">Lithium</SelectItem>
                                        <SelectItem value="Diamonds">Diamonds</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">Risk Level</Label>
                                <Select value={newProduct.risk_level} onValueChange={v => setNewProduct({...newProduct, risk_level: v as RiskLevel})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-secondary border-white/10 text-white">
                                        <SelectItem value="Low">Low Risk</SelectItem>
                                        <SelectItem value="Medium">Medium Risk</SelectItem>
                                        <SelectItem value="High">High Risk</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* INVESTMENT STRUCTURE */}
                        <div className="space-y-6">
                            <h4 className="text-gold text-[10px] uppercase font-black tracking-widest border-b border-gold/20 pb-2">Structure & Caps</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-gray-500 font-black">Unit Price ($)</Label>
                                    <Input type="number" className="bg-white/5 border-white/10 text-white" value={newProduct.unit_price} onChange={e => setNewProduct({...newProduct, unit_price: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-gray-500 font-black">Total Units</Label>
                                    <Input type="number" className="bg-white/5 border-white/10 text-white" value={newProduct.total_units} onChange={e => setNewProduct({...newProduct, total_units: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">Min. Investment ($)</Label>
                                <Input type="number" className="bg-white/5 border-white/10 text-white" value={newProduct.min_investment} onChange={e => setNewProduct({...newProduct, min_investment: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">Max. per Investor ($)</Label>
                                <Input type="number" className="bg-white/5 border-white/10 text-white" value={newProduct.max_allocation} onChange={e => setNewProduct({...newProduct, max_allocation: Number(e.target.value)})} />
                            </div>
                        </div>

                        {/* RETURNS */}
                        <div className="space-y-6">
                            <h4 className="text-gold text-[10px] uppercase font-black tracking-widest border-b border-gold/20 pb-2">Returns & Payout</h4>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">Target ROI (%)</Label>
                                <Input type="number" className="bg-white/5 border-white/10 text-white" value={newProduct.target_roi} onChange={e => setNewProduct({...newProduct, target_roi: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">ROI Type</Label>
                                <Select value={newProduct.roi_type} onValueChange={v => setNewProduct({...newProduct, roi_type: v as ROIType})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-secondary border-white/10 text-white">
                                        <SelectItem value="Fixed">Fixed Return</SelectItem>
                                        <SelectItem value="Variable">Variable Return</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">Profit Distribution</Label>
                                <Select value={newProduct.distribution_frequency} onValueChange={v => setNewProduct({...newProduct, distribution_frequency: v as DistributionFrequency})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-secondary border-white/10 text-white">
                                        <SelectItem value="End of term">End of Term</SelectItem>
                                        <SelectItem value="Monthly">Monthly Payout</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* DURATION */}
                        <div className="space-y-6">
                            <h4 className="text-gold text-[10px] uppercase font-black tracking-widest border-b border-gold/20 pb-2">Duration & Maturity</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-gray-500 font-black">Duration (Days)</Label>
                                    <Input type="number" className="bg-white/5 border-white/10 text-white" value={newProduct.duration_days} onChange={e => setNewProduct({...newProduct, duration_days: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-gray-500 font-black">Start Date</Label>
                                    <Input type="date" className="bg-white/5 border-white/10 text-white" value={newProduct.start_date} onChange={e => setNewProduct({...newProduct, start_date: e.target.value})} />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Calculated Maturity Date</p>
                                    <p className="text-white font-mono font-bold">{newProduct.maturity_date || "Pending..."}</p>
                                </div>
                                <Clock className="text-gold w-5 h-5" />
                            </div>
                        </div>

                        {/* STRATEGY & STATUS */}
                        <div className="space-y-6">
                            <h4 className="text-gold text-[10px] uppercase font-black tracking-widest border-b border-gold/20 pb-2">Strategy & Publication</h4>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">Strategy Description</Label>
                                <Textarea 
                                    className="bg-white/5 border-white/10 text-white h-24 text-xs" 
                                    placeholder="Describe the physical arbitrage or yield generation strategy..."
                                    value={newProduct.description || ""}
                                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-500 font-black">Publication Status</Label>
                                <Select value={newProduct.status} onValueChange={v => setNewProduct({...newProduct, status: v as ProductStatus})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-secondary border-white/10 text-white">
                                        <SelectItem value="Draft">Save as Draft</SelectItem>
                                        <SelectItem value="Active">Active (Publish)</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                        <Button className="flex-1 bg-gold hover:bg-gold-light text-background font-bold h-12 gap-2" onClick={handleSaveProduct}>
                            <Save className="w-4 h-4" /> {selectedProduct ? "Update Product" : "Finalize & Publish Product"}
                        </Button>
                        <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={() => setIsAddingProduct(false)}>Discard</Button>
                    </div>
                </motion.div>
            </div>
        )}

        {/* MODAL: UPDATE PERFORMANCE */}
        {isUpdatingPerformance && selectedProduct && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-secondary p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl">
                    <h3 className="text-xl font-serif text-white mb-2">Internal Valuation Update</h3>
                    <p className="text-xs text-gray-500 mb-6 font-mono uppercase tracking-widest">{selectedProduct.name}</p>
                    
                    <div className="space-y-6 mb-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-500 font-black">Current NAV (Unit Price)</Label>
                            <Input type="number" step="0.01" className="bg-white/5 border-white/10 text-white h-12 text-lg" value={performanceForm.current_nav} onChange={e => setPerformanceForm({...performanceForm, current_nav: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-500 font-black">Performance Delta (%)</Label>
                            <Input type="number" step="0.1" className="bg-white/5 border-white/10 text-white h-12 text-lg" value={performanceForm.roi_percentage} onChange={e => setPerformanceForm({...performanceForm, roi_percentage: Number(e.target.value)})} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button className="w-full bg-gold hover:bg-gold-light text-background font-bold h-12 gap-2" onClick={handleUpdatePerformance}>
                            <Save className="w-4 h-4" /> Broadcast Update
                        </Button>
                        <Button variant="ghost" className="text-gray-500 hover:text-white text-xs h-10" onClick={() => setIsUpdatingPerformance(false)}>Abort Change</Button>
                    </div>
                </motion.div>
            </div>
        )}

        {/* MODAL: SQL SETUP */}
        {showSqlModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl">
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-secondary p-8 rounded-3xl border border-white/10 w-full max-w-2xl shadow-2xl">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-serif text-white mb-2 font-medium">Finalize Cloud Database</h3>
                            <p className="text-sm text-gray-500">Run this SQL in your Supabase Editor to enable permanent persistence and marketplace visibility.</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setShowSqlModal(false)} className="text-gray-500 hover:text-white">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="bg-black/50 p-6 rounded-2xl border border-white/10 mb-6 max-h-[400px] overflow-y-auto relative">
                        <pre className="text-[10px] text-gold/80 font-mono leading-relaxed whitespace-pre-wrap">
                            {DATABASE_SETUP_SQL}
                        </pre>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="absolute top-4 right-4 bg-gold text-background hover:bg-gold-light font-bold"
                            onClick={() => {
                                navigator.clipboard.writeText(DATABASE_SETUP_SQL);
                                toast.success("Full Purchase Flow SQL copied.");
                            }}
                        >
                            <Copy className="w-3.5 h-3.5 mr-2" /> Copy SQL Code
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gold/5 border border-gold/10 mb-8">
                        <RefreshCw className="w-5 h-5 text-gold shrink-0 animate-spin-slow" />
                        <p className="text-xs text-gold/80 leading-relaxed font-bold">
                            After running this SQL, refresh this dashboard. Your local products will then sync to the cloud permanently.
                        </p>
                    </div>

                    <Button className="w-full bg-white text-background hover:bg-gray-200 font-bold h-12" onClick={() => setShowSqlModal(false)}>
                        Acknowledged
                    </Button>
                 </motion.div>
            </div>
        )}
        {/* MODAL: PROVIDE FUNDING INSTRUCTIONS */}
        {showFundingModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/95 backdrop-blur-2xl">
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-secondary p-8 rounded-3xl border border-white/10 w-full max-w-xl shadow-2xl">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-2xl font-serif text-white mb-1">Dispatch Settlement Instructions</h3>
                            <p className="text-sm text-gray-500">Provide precise Wire or Crypto parameters for this allocation.</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setShowFundingModal(null)} className="text-gray-500 hover:text-white">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-gold/5 border border-gold/10 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-gold uppercase tracking-widest font-black">Purchase Method</p>
                                <p className="text-white font-bold">{showFundingModal.payment_method}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Total Due</p>
                                <p className="text-xl text-white font-mono font-bold">${showFundingModal.total_amount.toLocaleString()}</p>
                            </div>
                        </div>

                        {showFundingModal.payment_method === 'Bank Wire' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-gray-500 font-bold">Beneficiary Entity</Label>
                                    <Input value={fundingForm.beneficiary} onChange={e => setFundingForm({...fundingForm, beneficiary: e.target.value})} className="bg-white/5 border-white/10 text-white h-10" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-gray-500 font-bold">Bank Name</Label>
                                    <Input value={fundingForm.bank} onChange={e => setFundingForm({...fundingForm, bank: e.target.value})} className="bg-white/5 border-white/10 text-white h-10" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-gray-500 font-bold">IBAN / Account</Label>
                                    <Input value={fundingForm.iban} onChange={e => setFundingForm({...fundingForm, iban: e.target.value})} className="bg-white/5 border-white/10 text-white h-10" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-gray-500 font-bold">SWIFT / BIC</Label>
                                    <Input value={fundingForm.swift} onChange={e => setFundingForm({...fundingForm, swift: e.target.value})} className="bg-white/5 border-white/10 text-white h-10" />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-gray-500 font-bold">Destination Wallet Address</Label>
                                    <Input value={fundingForm.wallet_address} onChange={e => setFundingForm({...fundingForm, wallet_address: e.target.value})} placeholder="0x..." className="bg-white/5 border-white/10 text-white font-mono h-10" />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-[10px] uppercase text-gray-500 font-bold">Network</Label>
                                        <Input value={fundingForm.network} onChange={e => setFundingForm({...fundingForm, network: e.target.value})} className="bg-white/5 border-white/10 text-white h-10" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-[10px] uppercase text-gray-500 font-bold">Asset (Ticker)</Label>
                                        <Input value={fundingForm.asset} onChange={e => setFundingForm({...fundingForm, asset: e.target.value})} className="bg-white/5 border-white/10 text-white h-10" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-500 font-bold">Reference Code (Required for ID match)</Label>
                            <Input value={fundingForm.reference_code} onChange={e => setFundingForm({...fundingForm, reference_code: e.target.value})} className="bg-white/5 border-white/10 text-gold font-mono font-bold h-10" />
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Button className="flex-1 bg-gold text-background hover:bg-gold-light font-black uppercase tracking-widest h-12" onClick={handleProvideFundingInstructions}>
                                Dispatch Instructions
                            </Button>
                            <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={() => setShowFundingModal(null)}>Cancel</Button>
                        </div>
                    </div>
                 </motion.div>
            </div>
        )}
        </div>
    </AdminLayout>
  );
}

