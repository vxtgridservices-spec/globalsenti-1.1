import { motion } from "motion/react";

const logos = [
  { name: "UN", icon: "https://www.vectorlogo.zone/logos/un/un-icon.svg" },
  { name: "World Bank", icon: "https://www.vectorlogo.zone/logos/worldbank/worldbank-icon.svg" },
  { name: "IMF", icon: "https://www.vectorlogo.zone/logos/imf/imf-icon.svg" },
  { name: "WTO", icon: "https://www.vectorlogo.zone/logos/wto/wto-icon.svg" },
  { name: "OPEC", icon: "https://upload.wikimedia.org/wikipedia/commons/e/e0/OPEC_logo.svg" },
];

export function LogoStrip() {
  return (
    <div className="py-12 bg-background border-t border-white/5 w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo) => (
            <motion.div
              key={logo.name}
              whileHover={{ scale: 1.1, opacity: 0.6 }}
              className="h-8 md:h-12"
            >
              <img src={logo.icon} alt={logo.name} className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
