import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const commodities = [
  {
    name: "GOLD",
    description: "Secure. Verified. Valuable.",
    image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800",
    tag: "GOLD",
  },
  {
    name: "DIAMONDS",
    description: "Certified. Authentic. Rare.",
    image: "https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?auto=format&fit=crop&q=80&w=800",
    tag: "DIAMONDS",
  },
  {
    name: "CRUDE OIL",
    description: "Energy. Power. Progress.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800",
    tag: "CRUDE OIL",
  },
  {
    name: "NATURAL GAS",
    description: "Clean Energy. Global Future.",
    image: "https://images.unsplash.com/photo-1542336391-ae2936d8efe4?auto=format&fit=crop&q=80&w=800",
    tag: "NATURAL GAS",
  },
];

export function Commodities() {
  return (
    <section className="py-24 bg-secondary/10 w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <SectionHeader
            subtitle="HIGH-VALUE COMMODITIES"
            title="Resources That Build Nations"
            centered={false}
            className="mb-0"
          />
        </div>

        <div className="flex flex-row overflow-x-auto pb-8 gap-6 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:snap-none no-scrollbar">
          {commodities.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-xl aspect-[3/2] cursor-pointer min-w-[300px] md:min-w-0 snap-center"
            >
              <img
                src={item.image}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
              
              <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end space-y-4">
                <h3 className="text-xl md:text-3xl font-bold text-white group-hover:text-gold transition-colors duration-500 font-serif tracking-tight">
                  {item.name}
                </h3>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                  {item.description}
                </p>
                <Button nativeButton={false} variant="link" className="text-gold p-0 h-auto font-bold text-[10px] tracking-[0.3em] uppercase justify-start gap-3 opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-4 group-hover:translate-y-0 hover:gap-5" render={<Link to="/deal-room" />}>
                  REQUEST DEAL ACCESS
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
