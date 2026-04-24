import * as React from "react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { supabase } from "@/src/lib/supabase";
import { ChemicalProduct } from "@/src/types/chemicals";
import { ShoppingCart, FlaskConical, Factory, ShieldCheck, ArrowRight, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

export function ChemicalMarketplace() {
    const navigate = useNavigate();
    const [products, setProducts] = React.useState<ChemicalProduct[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [categoryFilter, setCategoryFilter] = React.useState<string>("All");
    const [user, setUser] = React.useState<any>(null);
    const [heroImage, setHeroImage] = React.useState<string>("https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2070&auto=format&fit=crop");
    const [imageLoaded, setImageLoaded] = React.useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // Fetch Products and Hero Image Settings
            const [productRes, settingsRes] = await Promise.all([
                supabase
                    .from('chemical_products')
                    .select('*')
                    .eq('status', 'Active')
                    .order('category', { ascending: true })
                    .order('name', { ascending: true }),
                supabase
                    .from('site_settings')
                    .select('*')
                    .eq('key', 'chemical_hero_image')
                    .single()
            ]);
                
            if (productRes.data) {
                setProducts(productRes.data);
            }

            if (settingsRes.data) {
                const url = settingsRes.data.value.url;
                setHeroImage(url);
                
                // Preload high-res image
                const img = new Image();
                img.src = url;
                img.onload = () => setImageLoaded(true);
                img.onerror = () => setImageLoaded(true); // Still reveal even if error
            } else {
                setImageLoaded(true);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    const handleOrderClick = (product: ChemicalProduct) => {
        if (!user) {
            navigate('/portal');
            return;
        }
        navigate(`/chemicals/dashboard?productId=${product.id}`);
    };

    const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            (p.product_code && p.product_code.toLowerCase().includes(search.toLowerCase())) ||
            p.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col font-sans">
            <Navbar />
            
            <main className="flex-grow pb-24">
                {/* Premium Hero Section */}
                <section className="relative w-full min-h-[550px] flex items-center mt-16 md:mt-0 overflow-hidden bg-[#050505]">
                    {!imageLoaded && (
                        <div className="absolute inset-0 z-0 bg-[#0A0A0A] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
                        </div>
                    )}
                    
                    <div className={cn(
                        "absolute inset-0 z-0 transition-opacity duration-1000",
                        imageLoaded ? "opacity-100" : "opacity-0"
                    )}>
                        <img 
                            src={heroImage} 
                            alt="Advanced Chemical Solutions" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent"></div>
                    </div>
                    
                    <div className="container mx-auto px-4 z-10 relative py-20 md:py-32">
                        <div className="grid lg:grid-cols-5 gap-12 items-center">
                            {loading && !imageLoaded ? (
                                <div className="lg:col-span-3 space-y-8 animate-pulse">
                                    <div className="space-y-4">
                                        <div className="h-4 w-32 bg-white/5 rounded" />
                                        <div className="h-16 w-full max-w-md bg-white/5 rounded-lg" />
                                        <div className="h-16 w-3/4 bg-white/5 rounded-lg" />
                                    </div>
                                    <div className="h-20 w-full max-w-lg bg-white/5 rounded mt-8" />
                                    <div className="flex gap-4 pt-4">
                                        <div className="h-12 w-40 bg-white/5 rounded-lg" />
                                        <div className="h-12 w-40 bg-white/5 rounded-lg" />
                                    </div>
                                </div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }} 
                                    animate={{ opacity: imageLoaded ? 1 : 0, y: imageLoaded ? 0 : 30 }} 
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="lg:col-span-3 space-y-8"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-[1px] w-8 bg-gold/50" />
                                            <span className="text-gold text-[10px] sm:text-xs uppercase font-bold tracking-[0.3em] font-mono">Precision Excellence</span>
                                        </div>
                                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-[1.05] tracking-tight">
                                            Advanced <span className="text-gold italic">Chemical</span> <br /> Solutions
                                        </h1>
                                    </div>
                                    
                                    <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-xl font-light">
                                        High-grade laboratory-certified chemical products for industrial, mining, and institutional use. Verified sourcing, precision quality, and streamlined procurement.
                                    </p>
                                    
                                    <div className="pt-4 flex flex-wrap gap-4">
                                        <Button 
                                            onClick={() => navigate('/contact')}
                                            className="bg-gold hover:bg-gold/90 text-black font-bold uppercase tracking-widest h-12 px-10 rounded-lg text-xs transition-all shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Contact Us <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                        <Button
                                            onClick={() => navigate('/chemicals/dashboard')}
                                            variant="outline"
                                            className="border-white/10 text-white hover:bg-white/5 h-12 px-10 rounded-lg text-xs uppercase tracking-widest transition-all font-mono"
                                        >
                                            Client Portal
                                        </Button>
                                        <div className="w-full pt-4 flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-gold/60" />
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">ISO Certified</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Factory className="w-4 h-4 text-gold/60" />
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Global Logistics</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 0.95 }} 
                                transition={{ duration: 1, delay: 0.3 }}
                                className="lg:col-span-2 hidden lg:block"
                            >
                                <div className="relative p-1">
                                    <div className="absolute inset-0 bg-gold/10 blur-[100px] rounded-full" />
                                    <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-3xl rounded-2xl overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-4">
                                            <FlaskConical className="w-8 h-8 text-gold/20" />
                                        </div>
                                        <CardContent className="p-8 space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-white text-lg font-serif">Quick Marketplace Stats</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                        <p className="text-gold text-2xl font-mono leading-none">500+</p>
                                                        <p className="text-[10px] text-gray-400 uppercase mt-1">Chemicals Available</p>
                                                    </div>
                                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                        <p className="text-gold text-2xl font-mono leading-none">24/7</p>
                                                        <p className="text-[10px] text-gray-400 uppercase mt-1">Global Procurement</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                className="w-full border-gold/30 text-gold hover:bg-gold hover:text-black transition-all h-10 text-[10px] uppercase tracking-widest font-bold"
                                                onClick={() => {
                                                    const catalog = document.getElementById('catalog');
                                                    catalog?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                            >
                                                Explore Catalog
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-20" id="catalog">
                    {/* Catalog Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-xl font-serif text-white">Product Catalog</h3>
                                <p className="text-xs text-gray-500 mt-1">Institutional-grade supply allocation</p>
                            </div>
                            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <Input 
                                        placeholder="Search chemicals..." 
                                        className="pl-9 bg-black/40 border-white/10 text-sm text-white w-full sm:w-64 h-9 rounded-lg focus-visible:ring-1 focus-visible:ring-gold/50"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar w-full sm:w-auto">
                                    {categories.map(cat => (
                                        <Button
                                            key={cat}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCategoryFilter(cat)}
                                            className={cn(
                                                "border-white/10 shrink-0 h-9 text-xs rounded-lg transition-colors",
                                                categoryFilter === cat ? "bg-gold text-black border-gold hover:bg-gold/90" : "text-gray-400 hover:text-white bg-transparent"
                                            )}
                                        >
                                            {cat}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="w-6 h-6 animate-spin text-gold" />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-16 bg-[#111] border border-white/5 rounded-xl">
                                <FlaskConical className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">No chemical products found matching your search.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredProducts.map(product => (
                                    <Card key={product.id} className="bg-[#111] border border-white/5 hover:border-gold/30 hover:shadow-lg hover:shadow-black/50 transition-all group overflow-hidden flex flex-col rounded-xl">
                                        <CardHeader className="pb-2 pt-4 px-4">
                                            {product.image_url && (
                                                <div className="w-full h-24 mb-3 rounded-lg overflow-hidden border border-white/10 relative">
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start mb-1.5 relative z-10">
                                                <span className="text-[8px] uppercase font-bold tracking-widest text-gold bg-gold/5 border border-gold/10 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                    {product.category} {product.product_code && <span className="ml-1 text-gray-400">[{product.product_code}]</span>}
                                                </span>
                                                <span className="text-[9px] font-mono text-gray-500 bg-black/60 border border-white/5 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                    Min: {product.min_order.toLocaleString()} {product.unit_type}
                                                </span>
                                            </div>
                                            <CardTitle className="text-sm text-white font-medium line-clamp-1 group-hover:text-gold transition-colors">{product.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col px-4 pb-4 pt-0">
                                            <p className="text-[11px] text-gray-400 mb-3 flex-1 line-clamp-2 leading-relaxed font-light">
                                                {product.description}
                                            </p>
                                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                                <div>
                                                    <p className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold">Price/{product.unit_type}</p>
                                                    <p className="text-xs font-mono text-white">${product.price_per_unit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <Button 
                                                    className="bg-white/5 hover:bg-gold text-white hover:text-black transition-colors h-7 text-[10px] px-2.5 rounded-lg flex items-center"
                                                    onClick={() => navigate(`/chemicals/product/${product.id}`)}
                                                >
                                                    View <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
