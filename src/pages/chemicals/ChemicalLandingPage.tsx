import * as React from "react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { AccessGuard } from "@/src/components/security/AccessGuard";
import { Button } from "@/src/components/ui/button";
import { supabase } from "@/src/lib/supabase";
import { ChemicalProduct } from "@/src/types/chemicals";
import { ArrowRight, Play, X, ChevronRight, FlaskConical, Factory, ShieldCheck, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSmartImageUrl } from "@/src/lib/imageUtils";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

export function ChemicalLandingPage() {
    const navigate = useNavigate();
    const [products, setProducts] = React.useState<ChemicalProduct[]>([]);
    const [settings, setSettings] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [activeVideo, setActiveVideo] = React.useState<string | null>(null);
    const [activeImage, setActiveImage] = React.useState<string | null>(null);

    const [heroLoaded, setHeroLoaded] = React.useState(false);
    const [welcomeLoaded, setWelcomeLoaded] = React.useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // Safety timeout: force reveal after 8 seconds if images/data take too long
            const safetyTimer = setTimeout(() => {
                setHeroLoaded(true);
                setWelcomeLoaded(true);
                setLoading(false);
            }, 8000);

            const [pRes, sRes] = await Promise.all([
                supabase.from('chemical_products').select('*').eq('status', 'Active').limit(4),
                supabase.from('site_settings').select('*')
            ]);
            
            clearTimeout(safetyTimer);
            
            if (pRes.data) setProducts(pRes.data);
            if (sRes.data) {
                const settingsMap = new Map(sRes.data.map(s => [s.key, s.value]));
                const data = Object.fromEntries(settingsMap);
                setSettings(data);

                // Preload Hero immediately
                const heroUrl = getSmartImageUrl(data.chem_landing_hero?.image_url || "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2070&auto=format&fit=crop", { width: 1920 });
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = heroUrl;
                document.head.appendChild(link);
            } else {
                setSettings({});
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const hero = settings?.chem_landing_hero || {
        title: "",
        subtitle: "",
        image_url: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2070&auto=format&fit=crop"
    };

    const welcome = settings?.chem_landing_welcome || {
        title: "",
        rich_text: "",
        image_url: "https://images.unsplash.com/photo-1532187878418-9f110018b9dc?q=80&w=1000&auto=format&fit=crop"
    };

    const offerings = settings?.chem_landing_offerings || [
        { title: "Industrial Chemical Solutions", description: "Standardized compounds for heavy industrial manufacturing.", image_url: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=400&fit=crop" },
        { title: "Currency Processing Chemicals", description: "Specialized solutions for financial institution requirements.", image_url: "https://images.unsplash.com/photo-1532187878418-9f110018b9dc?q=80&w=1000&auto=format&fit=crop" },
        { title: "Security Ink Activation", description: "High-precision activators for secure document processing.", image_url: "https://images.unsplash.com/photo-1588600841306-2f741ec85043?q=80&w=400&fit=crop" },
        { title: "Preservation & Stability", description: "Compounds designed for long-term material stability.", image_url: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?q=80&w=400&fit=crop" }
    ];

    const gallery = settings?.chem_landing_gallery || [];
    const videos = settings?.chem_landing_videos || [];

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const scrollToNext = () => {
        const next = document.getElementById('welcome');
        next?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <AccessGuard section="chemicals">
        <div className="min-h-screen bg-black text-white font-sans selection:bg-gold selection:text-black overflow-x-hidden">
            {(loading || !heroLoaded || !welcomeLoaded) && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl text-white">
                    <div className="text-center space-y-4 animate-pulse">
                        <div className="w-12 h-[2px] bg-gold mx-auto" />
                        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Accessing Secured Laboratory</p>
                    </div>
                </div>
            )}
            <Navbar />

            {/* 1. HERO SECTION */}
            <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <div className="w-full h-full relative overflow-hidden">
                        <img 
                            src={getSmartImageUrl(hero.image_url, { width: 1920 })} 
                            onLoad={() => setHeroLoaded(true)}
                            onError={() => setHeroLoaded(true)}
                            className={cn(
                                "w-full h-full object-cover transition-all duration-[800ms] ease-out",
                                heroLoaded ? "opacity-100 grayscale-[20%] scale-105" : "opacity-0 scale-100"
                            )}
                            alt="Laboratory Hero" 
                            width={1920}
                            height={1080}
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
                </div>

                <div className="container mx-auto px-4 z-10 text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-4"
                    >
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight leading-[1.1]">
                            {hero.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 font-light max-w-3xl mx-auto tracking-wide">
                            {hero.subtitle}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
                    >
                        <Button 
                            onClick={scrollToNext}
                            className="bg-gold hover:bg-gold-dark text-black px-12 h-14 rounded-none text-xs uppercase tracking-[0.3em] font-bold transition-all hover:scale-105"
                        >
                            Explore Products
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => navigate('/contact')}
                            className="border-white/20 text-white hover:bg-white/5 px-12 h-14 rounded-none text-xs uppercase tracking-[0.3em] font-bold"
                        >
                            Contact Us
                        </Button>
                    </motion.div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={scrollToNext}>
                    <div className="w-[1px] h-12 bg-gold mx-auto" />
                </div>
            </section>

            {/* 2. WELCOME / INTRO SECTION */}
            <section id="welcome" className="-mt-24 py-24 md:py-32 bg-[#050505]">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold">Introduction</span>
                                <h2 className="text-4xl md:text-5xl font-serif leading-tight">{welcome.title}</h2>
                            </div>
                            <div 
                                className="prose prose-invert prose-gold max-w-none text-gray-400 font-light leading-relaxed text-lg"
                                dangerouslySetInnerHTML={{ __html: welcome.rich_text }}
                            />
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                             className="relative group aspect-[4/5] rounded-lg overflow-hidden border border-white/5 shadow-2xl bg-[#0A0A0A]"
                        >
                            {!welcomeLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-10 text-white font-mono text-xs italic">
                                    Loading...
                                </div>
                            )}
                            <img 
                                src={getSmartImageUrl(welcome.image_url, { width: 1000 })} 
                                onLoad={() => setWelcomeLoaded(true)}
                                onError={() => setWelcomeLoaded(true)}
                                loading="lazy"
                                width={800}
                                height={1000}
                                className={cn(
                                    "w-full h-full object-cover transition-all duration-1000 group-hover:scale-110",
                                    welcomeLoaded ? "opacity-100" : "opacity-0"
                                )}
                                alt="Welcome"
                            />
                            <div className="absolute inset-0 bg-gold/10 mix-blend-overlay" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. OFFERINGS SECTION */}
            <section className="py-24 bg-black">
                <div className="container mx-auto px-4 text-center mb-16">
                    <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold">Capabilities</span>
                    <h2 className="text-3xl md:text-4xl font-serif mt-2">Specialized Offerings</h2>
                </div>
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 bg-transparent">
                        {offerings.map((item: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative aspect-[3/4] overflow-hidden"
                            >
                                <div className="w-full h-full bg-[#0A0A0A] animate-pulse absolute inset-0" />
                                <img 
                                    src={getSmartImageUrl(item.image_url, { width: 600 })} 
                                    loading="lazy"
                                    width={400}
                                    height={533}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-0 data-[loaded=true]:opacity-100" 
                                    onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
                                    alt={item.title} 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8 space-y-2">
                                    <h3 className="text-xl font-serif text-white">{item.title}</h3>
                                    <p className="text-xs text-gray-300 font-light leading-relaxed transition-all duration-500">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gold/40 group-hover:text-gold group-hover:border-gold transition-all duration-500">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. MEDIA SHOWCASE SECTION */}
            <section className="py-24 bg-[#050505]">
                <div className="container mx-auto px-4 mb-16 flex justify-between items-end">
                    <div className="space-y-2">
                        <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold">Portfolio</span>
                        <h2 className="text-3xl md:text-4xl font-serif">Media Showcase</h2>
                    </div>
                    <div className="hidden md:block w-32 h-[1px] bg-white/10" />
                </div>
                
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[250px]">
                        {/* Custom Masonry-like grid using grid-area-style rows/cols */}
                        {gallery[0] && (
                            <div className="md:col-span-8 md:row-span-2 cursor-pointer group overflow-hidden bg-[#0A0A0A] border border-white/5 relative" onClick={() => setActiveImage(getSmartImageUrl(gallery[0], { width: 1600 }))}>
                                <img 
                                    src={getSmartImageUrl(gallery[0], { width: 1200 })} 
                                    loading="lazy" 
                                    width={1200}
                                    height={800}
                                    onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
                                    className="opacity-0 data-[loaded=true]:opacity-100 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-60" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                            </div>
                        )}
                        {gallery[1] && (
                            <div className="md:col-span-4 md:row-span-1 cursor-pointer group overflow-hidden bg-[#0A0A0A] border border-white/5 relative" onClick={() => setActiveImage(getSmartImageUrl(gallery[1], { width: 1200 }))}>
                                <img 
                                    src={getSmartImageUrl(gallery[1], { width: 600 })} 
                                    loading="lazy" 
                                    width={600}
                                    height={400}
                                    onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
                                    className="opacity-0 data-[loaded=true]:opacity-100 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-60" 
                                />
                            </div>
                        )}
                        {gallery[2] && (
                            <div className="md:col-span-4 md:row-span-1 cursor-pointer group overflow-hidden bg-[#0A0A0A] border border-white/5 relative" onClick={() => setActiveImage(getSmartImageUrl(gallery[2], { width: 1200 }))}>
                                <img 
                                    src={getSmartImageUrl(gallery[2], { width: 600 })} 
                                    loading="lazy" 
                                    width={600}
                                    height={400}
                                    onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
                                    className="opacity-0 data-[loaded=true]:opacity-100 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-60" 
                                />
                            </div>
                        )}
                        {gallery[3] && (
                            <div className="md:col-span-6 md:row-span-2 cursor-pointer group overflow-hidden bg-[#0A0A0A] border border-white/5 relative" onClick={() => setActiveImage(getSmartImageUrl(gallery[3], { width: 1600 }))}>
                                <img 
                                    src={getSmartImageUrl(gallery[3], { width: 1000 })} 
                                    loading="lazy" 
                                    width={800}
                                    height={600}
                                    onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
                                    className="opacity-0 data-[loaded=true]:opacity-100 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-60" 
                                />
                            </div>
                        )}
                        {gallery[4] && (
                            <div className="md:col-span-6 md:row-span-2 cursor-pointer group overflow-hidden bg-[#0A0A0A] border border-white/5 relative" onClick={() => setActiveImage(getSmartImageUrl(gallery[4], { width: 1600 }))}>
                                <img 
                                    src={getSmartImageUrl(gallery[4], { width: 1000 })} 
                                    loading="lazy" 
                                    width={800}
                                    height={600}
                                    onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
                                    className="opacity-0 data-[loaded=true]:opacity-100 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-60" 
                                />
                            </div>
                        )}
                    </div>

                    {/* VIDEO SECTION */}
                    {videos.filter(Boolean).length > 0 && (
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {videos.filter(Boolean).map((v: string, i: number) => {
                                const yid = getYoutubeId(v);
                                return (
                                    <div 
                                        key={i} 
                                        className="relative aspect-video group cursor-pointer overflow-hidden rounded bg-black border border-white/10"
                                        onClick={() => setActiveVideo(v)}
                                    >
                                        {yid ? (
                                            <img src={`https://img.youtube.com/vi/${yid}/maxresdefault.jpg`} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white/5">Video {i+1}</div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-gold group-hover:border-gold group-hover:text-black transition-all transform group-hover:scale-110">
                                                <Play className="w-6 h-6 fill-current" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* 5. PRODUCT PREVIEW SECTION */}
            <section className="py-24 bg-black overflow-hidden px-4 md:px-0">
                <div className="container mx-auto px-4 mb-16 text-center space-y-4">
                    <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold">Innovation</span>
                    <h2 className="text-4xl md:text-5xl font-serif">Explore Our Chemical Product Range</h2>
                </div>

                <div className="w-full max-w-[2000px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                        {products.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative aspect-[16/10] overflow-hidden bg-[#0A0A0A]"
                            >
                                <div className="w-full h-full bg-[#0A0A0A] animate-pulse absolute inset-0" />
                                <img 
                                    src={getSmartImageUrl(p.image_url, { width: 800 }) || "https://images.unsplash.com/photo-1532187878418-9f110018b9dc?q=80&w=1000&auto=format&fit=crop"} 
                                    loading="lazy"
                                    width={1000}
                                    height={625}
                                    onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
                                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 opacity-0 data-[loaded=true]:opacity-100" 
                                    alt={p.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 p-8 flex flex-col justify-end transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-gold font-bold uppercase tracking-widest">{p.category}</span>
                                        <h3 className="text-2xl md:text-3xl font-serif text-white">{p.name}</h3>
                                        <p className="text-gray-400 text-sm font-light max-w-xs line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                            {p.description}
                                        </p>
                                    </div>
                                    <Button 
                                        variant="link" 
                                        onClick={() => navigate(`/chemicals/product/${p.id}`)}
                                        className="text-white hover:text-gold w-fit px-0 mt-4 uppercase tracking-[0.3em] text-[10px] font-bold transition-colors"
                                    >
                                        View Details <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. CTA SECTION */}
            <section className="py-32 bg-[#050505] border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 blur-[150px] rounded-full pointer-events-none" />
                
                <div className="container mx-auto px-4 text-center space-y-12 relative z-10">
                    <div className="space-y-4 max-w-2xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-serif leading-tight">Access Our Full Chemical Catalog</h2>
                        <p className="text-gray-500 font-light tracking-widest uppercase text-xs">Certified Institutional Grade Supply</p>
                    </div>
                    
                    <Button 
                        onClick={() => navigate('/chemicals/catalog')}
                        className="bg-gold hover:bg-gold-dark text-black px-16 h-16 rounded-none text-xs uppercase tracking-[0.4em] font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-gold/20"
                    >
                        {settings?.chem_catalog_btn_text || "View Full Catalog"}
                    </Button>

                    <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-white/5 max-w-4xl mx-auto">
                        <div className="space-y-1">
                            <FlaskConical className="w-5 h-5 text-gold/40 mx-auto" />
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Lab Certified</p>
                        </div>
                        <div className="space-y-1">
                            <Factory className="w-5 h-5 text-gold/40 mx-auto" />
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Direct Supply</p>
                        </div>
                        <div className="space-y-1">
                            <ShieldCheck className="w-5 h-5 text-gold/40 mx-auto" />
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Secure Escrow</p>
                        </div>
                        <div className="space-y-1">
                            <Mail className="w-5 h-5 text-gold/40 mx-auto" />
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest">24/7 Support</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />

            {/* LIGHTBOX MODALS */}
            <AnimatePresence>
                {activeImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
                        onClick={() => setActiveImage(null)}
                    >
                        <button className="absolute top-8 right-8 text-white/50 hover:text-white"><X className="w-8 h-8" /></button>
                        <motion.img 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={activeImage} 
                            className="max-w-full max-h-full object-contain shadow-2xl" 
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}

                {activeVideo && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
                        onClick={() => setActiveVideo(null)}
                    >
                        <button className="absolute top-8 right-8 text-white/50 hover:text-white"><X className="w-8 h-8" /></button>
                        <div className="w-full max-w-5xl aspect-video bg-black shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                            {getYoutubeId(activeVideo) ? (
                                <iframe 
                                    src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`}
                                    className="w-full h-full border-0"
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">Invalid Video URL</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </AccessGuard>
    );
}
