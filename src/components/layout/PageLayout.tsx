import * as React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion } from "motion/react";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function PageLayout({ children, title, subtitle }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Page Header */}
      <section className="pt-40 pb-20 bg-secondary/20 border-b border-white/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            {subtitle && (
              <p className="text-gold font-bold tracking-[0.3em] uppercase text-sm mb-4">
                {subtitle}
              </p>
            )}
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              {title}
            </h1>
          </motion.div>
        </div>
      </section>

      <main className="flex-grow">
        {children}
      </main>

      <Footer />
    </div>
  );
}
