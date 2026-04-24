import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { ChemicalProduct, ChemicalReview } from '@/src/types/chemicals';
import { Navbar } from '@/src/components/layout/Navbar';
import { Footer } from '@/src/components/layout/Footer';
import { Button } from '@/src/components/ui/button';
import { ShoppingCart, Star, ArrowLeft, Send } from 'lucide-react';
import { Textarea } from '@/src/components/ui/textarea';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils';
import { getSmartImageUrl } from '@/src/lib/imageUtils';
import { motion } from 'motion/react';
import DOMPurify from 'dompurify';

function DetailImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [loaded, setLoaded] = React.useState(false);
    return (
        <div className={cn("bg-[#0A0A0A] relative overflow-hidden", className)}>
            {!loaded && (
                <div className="absolute inset-0 animate-pulse bg-white/5" />
            )}
            <img 
                src={src} 
                alt={alt}
                width={800}
                height={800}
                onLoad={() => setLoaded(true)}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-1000",
                    loaded ? "opacity-100" : "opacity-0"
                )}
            />
        </div>
    );
}

export function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = React.useState<ChemicalProduct | null>(null);
    const [reviews, setReviews] = React.useState<ChemicalReview[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [user, setUser] = React.useState<any>(null);

    const [reviewForm, setReviewForm] = React.useState({ fullName: '', rating: 5, comment: '', avatarUrl: '' });
    const [submittingReview, setSubmittingReview] = React.useState(false);
    const [profileNameLoaded, setProfileNameLoaded] = React.useState(false);
    const [showReviewForm, setShowReviewForm] = React.useState(false);

    React.useEffect(() => {
        const fetchProductData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (profile && profile.full_name) {
                    setReviewForm(prev => ({ ...prev, fullName: profile.full_name }));
                    setProfileNameLoaded(true);
                }
            }

            if (id) {
                const { data: pData } = await supabase.from('chemical_products').select('*').eq('id', id).single();
                setProduct(pData);

                // Fetch reviews manually directly or use standard
                const { data: rData } = await supabase.from('chemical_reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
                setReviews(rData || []);
            }
            setLoading(false);
        };
        fetchProductData();
    }, [id]);

    const handleOrderClick = () => {
        if (!user) {
            navigate('/portal');
            return;
        }
        navigate(`/chemicals/dashboard?productId=${id}`);
    };

    const handleSubmitReview = async () => {
        if (!reviewForm.fullName.trim() || !reviewForm.comment.trim()) {
            alert("Please provide name and comment.");
            return;
        }
        setSubmittingReview(true);
        const { error } = await supabase.from('chemical_reviews').insert([{
            product_id: id,
            user_id: user?.id,
            full_name: reviewForm.fullName,
            rating: reviewForm.rating,
            comment: reviewForm.comment,
            avatar_url: reviewForm.avatarUrl || null
        }]);

        if (error) {
            // handle error if table doesn't exist
            if (error.message.includes("relation \"chemical_reviews\" does not exist")) {
                alert("The database for reviews needs to be initialized. Please contact support.");
            } else {
                alert("Error: " + error.message);
            }
        } else {
            setReviewForm({ ...reviewForm, comment: '', rating: 5 });
            setShowReviewForm(false);
            const { data: rData } = await supabase.from('chemical_reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
            setReviews(rData || []);
        }
        setSubmittingReview(false);
    };

    if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin"></div></div>;

    if (!product) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-8 text-center flex-col"><p className="text-xl text-gray-400 mb-4">Product not found.</p><Button onClick={() => navigate('/chemicals/catalog')}>Back to Catalog</Button></div>;

    const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

    return (
        <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black flex flex-col font-sans">
            <Navbar />

            <div className="flex-1 mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <Button variant="ghost" size="sm" onClick={() => navigate('/chemicals/catalog')} className="mb-8 text-gray-500 hover:text-white hover:bg-white/5 text-[10px] uppercase tracking-widest h-8">
                    <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Return to Catalog
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Header Details */}
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            {product.image_url && (
                                <DetailImage 
                                    src={getSmartImageUrl(product.image_url, { width: 800 })} 
                                    alt={product.name} 
                                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl border border-white/10 shadow-lg shadow-black/40 shrink-0" 
                                />
                            )}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-2.5 py-0.5 bg-gold/5 border border-gold/10 text-gold text-[10px] font-semibold uppercase tracking-widest rounded">
                                        {product.category}
                                    </span>
                                    {product.product_code && (
                                        <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono rounded">
                                            {product.product_code}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 text-gold">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-semibold text-sm">{avgRating}</span>
                                        <span className="text-gray-500 text-xs ml-0.5">({reviews.length} reviews)</span>
                                    </div>
                                </div>
                                <h1 className="text-4xl sm:text-6xl font-serif mb-6 leading-tight tracking-tight">{product.name}</h1>
                                <p className="text-gray-400 text-base leading-relaxed font-light">{product.description}</p>
                            </div>
                        </div>

                        {/* Rich Description */}
                        {product.rich_description && (
                            <div className="prose prose-sm prose-invert prose-gold max-w-none prose-headings:font-serif prose-headings:text-lg prose-a:text-gold prose-p:leading-relaxed bg-[#111] border border-white/5 rounded-xl p-6"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.rich_description, {
                                    ADD_ATTR: ['style', 'src', 'alt', 'width', 'height'],
                                    ADD_TAGS: ['img']
                                }) }}>
                            </div>
                        )}

                        {/* Reviews Section */}
                        <div className="border-t border-white/5 pt-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-serif">Customer Reviews</h2>
                                {!showReviewForm && (
                                    <Button 
                                        onClick={() => setShowReviewForm(true)}
                                        size="sm"
                                        className="bg-gold/10 border border-gold/20 text-gold hover:bg-gold hover:text-black transition-all h-8 text-xs rounded-lg"
                                    >
                                        Write a Review
                                    </Button>
                                )}
                            </div>
                            
                            {/* Add Review Form */}
                            {showReviewForm && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#111] border border-white/10 p-5 rounded-xl space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-medium text-sm">Your Review</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] text-gray-400">Full Name</label>
                                            <Input 
                                                placeholder="Enter your name" 
                                                className="bg-black/50 border-white/10 text-sm h-9 rounded-lg" 
                                                value={reviewForm.fullName}
                                                onChange={(e) => setReviewForm({ ...reviewForm, fullName: e.target.value })}
                                                disabled={profileNameLoaded}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] text-gray-400 flex justify-between">
                                                <span>Profile Image (optional)</span>
                                                <span>Max 2MB</span>
                                            </label>
                                            <div className="flex gap-2 items-center">
                                                {reviewForm.avatarUrl && (
                                                    <img src={reviewForm.avatarUrl} alt="Preview" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                                )}
                                                <Input 
                                                    type="file" 
                                                    accept="image/*"
                                                    className="bg-black/50 border-white/10 h-9 w-full text-xs rounded-lg cursor-pointer file:text-xs file:bg-white/5 file:border-0 file:text-gray-300 file:rounded file:px-2 file:py-0.5 file:mr-2 hover:file:bg-white/10"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            if (file.size > 2 * 1024 * 1024) {
                                                                alert("File size must be less than 2MB");
                                                                return;
                                                            }
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setReviewForm({ ...reviewForm, avatarUrl: reader.result as string });
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] text-gray-400">Rating</label>
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button key={star} onClick={() => setReviewForm({...reviewForm, rating: star})} className="transition-transform hover:scale-110">
                                                    <Star className={`w-5 h-5 ${star <= reviewForm.rating ? 'fill-gold text-gold' : 'text-gray-700 hover:text-gold/50'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] text-gray-400">Comment</label>
                                        <Textarea 
                                            className="bg-black/50 border-white/10 min-h-[80px] text-sm rounded-lg resize-none" 
                                            placeholder="Share your experience..."
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)} className="text-gray-400 h-8 text-xs rounded-lg">Discard</Button>
                                        <Button size="sm" onClick={handleSubmitReview} disabled={submittingReview} className="bg-gold text-black hover:bg-gold-dark font-medium h-8 text-xs px-5 rounded-lg transition-transform active:scale-95">
                                            {submittingReview ? 'Posting...' : 'Post Review'} <Send className="w-3 h-3 ml-1.5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Reviews List */}
                            <div className="space-y-3">
                                {reviews.length === 0 ? (
                                    <p className="text-gray-500 text-sm italic">No reviews yet. Be the first to review this product.</p>
                                ) : (
                                    reviews.map((review) => (
                                        <div key={review.id} className="p-4 bg-[#111] border border-white/5 rounded-xl space-y-3 hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    {review.avatar_url ? (
                                                        <img src={review.avatar_url} alt={review.full_name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center font-semibold text-sm border border-gold/20 shrink-0">
                                                            {review.full_name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-200">{review.full_name}</p>
                                                        <p className="text-[10px] text-gray-500">{review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Just now'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5 mt-0.5">
                                                    {[1,2,3,4,5].map(star => (
                                                        <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-gold text-gold' : 'text-white/10'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-400 leading-relaxed text-sm">{review.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Order Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 p-8 border border-white/10 bg-white/5 backdrop-blur-3xl rounded-none space-y-8 shadow-2xl">
                            <div className="space-y-2">
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Standard Price Basis</p>
                                <p className="text-4xl font-mono tracking-tighter text-white">${product.price_per_unit.toLocaleString(undefined, { minimumFractionDigits: 2 })}<span className="text-sm text-gray-600 ml-2 font-sans font-light capitalize">Per {product.unit_type}</span></p>
                            </div>
                            
                            <div className="p-6 bg-black/40 rounded-none space-y-4 border border-white/5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 uppercase tracking-widest">Minimum Allocation</span>
                                    <span className="font-bold text-white">{product.min_order} {product.unit_type}s</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 uppercase tracking-widest">Global Status</span>
                                    <span className="font-bold text-green-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                        {product.status}
                                    </span>
                                </div>
                            </div>

                            <Button 
                                onClick={handleOrderClick} 
                                className="w-full h-16 bg-gold hover:bg-gold-dark text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-none transition-all shadow-2xl hover:scale-105 active:scale-95"
                            >
                                {user ? "Initiate Acquisition" : "Authentication Required"} <ShoppingCart className="w-4 h-4 ml-3" />
                            </Button>

                            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                                Requires Global Sentinel verified account. Orders are subject to compliance checks.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
