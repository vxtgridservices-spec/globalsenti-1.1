import { motion } from "motion/react";

const logos = [
  { 
    name: "UN", 
    component: (
      <div className="flex items-center gap-3 font-serif font-bold tracking-widest">
        <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center text-sm">
          UN
        </div>
        <span className="hidden md:inline">UNITED NATIONS</span>
      </div>
    )
  },
  { 
    name: "World Bank", 
    component: <div className="font-serif text-xl md:text-2xl font-bold tracking-widest">WORLD BANK</div> 
  },
  { 
    name: "IMF", 
    component: <div className="font-serif text-xl md:text-2xl font-bold tracking-widest">IMF</div> 
  },
  { 
    name: "WTO", 
    component: <div className="font-serif text-xl md:text-2xl font-bold tracking-[0.2em] relative"><span className="absolute -top-3 -left-3 border-t-2 border-l-2 w-4 h-4 border-current"></span>WTO</div> 
  },
  { 
    name: "OPEC", 
    component: <div className="font-serif text-xl md:text-2xl font-bold tracking-wider">OPEC</div> 
  },
];

export function LogoStrip() {
  return (
    <div className="py-12 bg-background border-t border-white/5 w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 lg:gap-24 text-white/40 hover:text-white/60 transition-colors duration-500">
          {logos.map((logo) => (
            <motion.div
              key={logo.name}
              whileHover={{ scale: 1.05, opacity: 1, color: "#ffffff" }}
              className="flex items-center justify-center cursor-pointer transition-colors duration-300"
            >
              {logo.component}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
