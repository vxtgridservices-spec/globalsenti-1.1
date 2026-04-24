import * as React from "react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { supabase } from "@/src/lib/supabase";
import { ChemicalProduct } from "@/src/types/chemicals";
import { Search, Loader2, ArrowRight, ChevronDown, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSmartImageUrl } from "@/src/lib/imageUtils";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

export function ChemicalCatalog() {
    const navigate = useNavigate();
    const [products, setProducts] = React.useState<ChemicalProduct[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [categoryFilter, setCategoryFilter] = React.useState<string>("All");
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('chemical_products')
                .select('*')
                .eq('status', 'Active')
                .order('name', { ascending: true });
            
            if (data) setProducts(data);
            setLoading(false);
        };
        fetchProducts();
    }, []);

    const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

    const getDirectImageUrl = (url: string) => {
        if (!url) return "";
        // Convert Imgur page links to direct image links, but skip albums/galleries
        if (url.includes("imgur.com/") && !url.includes("i.imgur.com") && !url.includes("/a/") && !url.includes("/gallery/")) {
             const parts = url.split("/");
             const lastPart = parts[parts.length - 1];
             if (lastPart && !lastPart.includes(".")) {
                return `https://i.imgur.com/${lastPart}.jpg`;
             }
        }
        return url;
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            (p.product_code && p.product_code.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black flex flex-col font-sans">
            <Navbar />
            
            <main className="flex-grow pt-24 pb-32">
                {/* HEADLINE SECTION */}
                <div className="container mx-auto px-4 py-16 md:py-24 border-b border-white/5 mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="space-y-4 max-w-2xl">
                            <span className="text-gold text-[10px] uppercase font-bold tracking-[0.5em] animate-in fade-in slide-in-from-left-4 duration-700">Institutional Catalog</span>
                            <h1 className="text-5xl md:text-7xl font-serif leading-tight animate-in fade-in slide-in-from-top-4 duration-1000">The Collection</h1>
                            <p className="text-gray-500 font-light text-lg">Browse our highly refined industrial and security chemical portfolio. Precision-sourced solutions for critical enterprise operations.</p>
                        </div>
                        
                        <div className="flex items-center gap-6 pb-2">
                            <div className="flex items-center gap-1.5 opacity-50">
                                <span className="text-[10px] font-mono">{filteredProducts.length}</span>
                                <span className="text-[8px] uppercase tracking-widest">Available Items</span>
                            </div>
                            <div className="w-[1px] h-8 bg-white/10" />
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={cn(
                                    "flex items-center gap-2 text-[10px] uppercase tracking-widest font-black transition-colors hover:text-gold",
                                    isFilterOpen ? "text-gold" : "text-white"
                                )}
                            >
                                <Filter className="w-3 h-3" /> Filters
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Fast Search</label>
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-hover:text-gold transition-colors" />
                                            <Input 
                                                className="bg-white/5 border-white/10 rounded-none h-14 pl-12 text-sm focus-visible:border-gold/50 focus-visible:ring-0" 
                                                placeholder="Search by name, code or keyword..." 
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Categories</label>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setCategoryFilter(cat)}
                                                    className={cn(
                                                        "px-4 py-2 text-[10px] uppercase tracking-tighter border transition-all",
                                                        categoryFilter === cat 
                                                            ? "bg-gold border-gold text-black font-black" 
                                                            : "border-white/10 text-gray-500 hover:border-white/40 hover:text-white"
                                                    )}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* LUXURY CATALOG GRID */}
                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-gold" />
                            <p className="text-[10px] uppercase tracking-widest text-gray-700">Accessing Digital Ledger...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-32 space-y-6">
                            <h3 className="text-2xl font-serif text-gray-500 italic">No products matched your criteria.</h3>
                            <Button variant="link" onClick={() => {setSearch(""); setCategoryFilter("All");}} className="text-gold uppercase tracking-[0.3em] text-[10px] font-bold">Clear All Filters</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 border-white/10 border bg-white/5">
                            {filteredProducts.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: (i % 4) * 0.1 }}
                                    viewport={{ once: true }}
                                    className="group relative aspect-[4/5] overflow-hidden bg-black"
                                >
                                    <div className="absolute inset-0">
                                        <img 
                                            src={getSmartImageUrl(p.image_url || "https://images.unsplash.com/photo-1532187878418-9f110018b9dc?q=80&w=1000&auto=format&fit=crop", { width: 600 })} 
                                            alt={p.name}
                                            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 group-hover:opacity-40 opacity-60"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                    </div>

                                    <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
                                        <div className="flex flex-col space-y-2 md:space-y-4 transform transition-all duration-700 translate-y-8 group-hover:translate-y-0">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-gold uppercase tracking-[0.4em] bg-gold/10 px-2 py-1 backdrop-blur-sm border border-gold/20 leading-none">
                                                    {p.category}
                                                </span>
                                                {p.product_code && (
                                                    <span className="text-[10px] font-mono text-gray-500">[{p.product_code}]</span>
                                                )}
                                            </div>
                                            <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight leading-none group-hover:text-gold transition-colors">{p.name}</h2>
                                            <p className="text-gray-400 font-light text-sm md:text-base max-w-md line-clamp-1 group-hover:line-clamp-none transition-all duration-500 opacity-0 group-hover:opacity-100">
                                                {p.description}
                                            </p>
                                            <div className="pt-4 flex items-center justify-between">
                                                <Button 
                                                    onClick={() => navigate(`/chemicals/product/${p.id}`)}
                                                    className="bg-transparent border border-white/20 text-white rounded-none px-8 h-12 text-[10px] uppercase tracking-[0.3em] font-bold group-hover:bg-gold group-hover:border-gold group-hover:text-black transition-all"
                                                >
                                                    View Details
                                                </Button>
                                                <div className="text-right hidden md:block opacity-0 group-hover:opacity-100 transition-opacity transition-all duration-700 transform translate-x-4 group-hover:translate-x-0">
                                                    <p className="text-[8px] uppercase tracking-widest text-gray-600">Unit Basis</p>
                                                    <p className="text-xs font-mono text-white">Starting from {p.min_order.toLocaleString()} {p.unit_type}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ornamental Corner */}
                                    <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                                        <div className="absolute top-0 right-0 w-[1px] h-[100%] bg-gold/30" />
                                        <div className="absolute top-0 right-0 w-[100%] h-[1px] bg-gold/30" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FINAL SECTION */}
                <div className="container mx-auto px-4 mt-32 text-center space-y-12">
                    <div className="w-[1px] h-32 bg-gradient-to-b from-white/10 to-transparent mx-auto" />
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-serif uppercase tracking-widest">Can't find a specific product?</h2>
                        <p className="text-gray-500 text-sm max-w-xl mx-auto">Our custom synthesis and specialized sourcing department can assist with rare or high-volume bespoke requirements.</p>
                    </div>
                    <Button 
                        onClick={() => navigate('/contact')}
                        variant="link" 
                        className="text-gold text-[10px] uppercase tracking-[0.5em] font-black h-auto p-0"
                    >
                        Inquire Custom Order <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
