import React from 'react';
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { supabase } from "@/src/lib/supabase";
import { NewsArticle } from "@/src/types/chemicals";

export function News() {
  const [news, setNews] = React.useState<NewsArticle[]>([]);

  React.useEffect(() => {
    supabase.from('chemical_news').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setNews(data);
    });
  }, []);

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-12 border-b border-white/10 pb-6 text-gold">Latest News</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map(n => (
                <div key={n.id} className="bg-[#0A0A0A] p-4 border border-white/10 rounded-xl space-y-4">
                    {n.image_url && <img src={n.image_url} className="w-full h-48 object-cover rounded-lg" />}
                    <h2 className="text-xl font-bold">{n.title}</h2>
                    <p className="text-sm text-gray-400 font-mono">{new Date(n.created_at).toLocaleDateString()}</p>
                    <p className="text-gray-300 text-sm">{n.content}</p>
                </div>
            ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
