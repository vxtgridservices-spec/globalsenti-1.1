import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { 
  Gem, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  TrendingUp,
  Info
} from "lucide-react";
import { motion } from "motion/react";

import { Link } from "react-router-dom";

export function DealRoom() {
  const deals = [
    {
      id: "DR-2024-001",
      title: "AU Bullion - 500kg Spot",
      location: "Dubai, UAE",
      purity: "99.99%",
      price: "Market - 2%",
      status: "Available",
      type: "Gold"
    },
    {
      id: "DR-2024-002",
      title: "Rough Diamonds - 12,000 Carats",
      location: "Antwerp, Belgium",
      purity: "Mixed Clarity",
      price: "Private Offer",
      status: "Under Review",
      type: "Diamonds"
    },
    {
      id: "DR-2024-003",
      title: "Crude Oil (BLCO) - 2M Barrels",
      location: "Offshore Nigeria",
      purity: "Standard",
      price: "Platts - $4",
      status: "Available",
      type: "Crude Oil"
    }
  ];

  return (
    <PageLayout title="Private Deal Room" subtitle="Exclusive high-value commodity opportunities for verified partners.">
      <div className="container mx-auto px-4 py-12">
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-6 mb-12 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center shrink-0">
            <Lock className="text-background w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Verified Access Only</h3>
            <p className="text-gray-400">
              All listings in this room are subject to strict KYC/AML verification. Documents must be submitted via the 
              <Link to="/vault" className="text-gold hover:underline mx-1">Document Vault</Link> 
              before any transaction can proceed.
            </p>
          </div>
          <Button className="md:ml-auto bg-gold text-background font-bold whitespace-nowrap">
            Update Verification
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-serif font-bold text-white mb-6">Active Listings</h2>
            <div className="space-y-6">
              {deals.map((deal, index) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 hover:border-gold/50 transition-all group">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 rounded bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider">
                              {deal.type}
                            </span>
                            <span className="text-gray-500 text-xs">ID: {deal.id}</span>
                          </div>
                          <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">
                            {deal.title}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Location</p>
                              <p className="text-sm text-white">{deal.location}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Purity/Spec</p>
                              <p className="text-sm text-white">{deal.purity}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Pricing</p>
                              <p className="text-sm text-gold font-bold">{deal.price}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col justify-between items-end gap-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            deal.status === 'Available' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                          }`}>
                            {deal.status}
                          </span>
                          <Button className="bg-white/10 hover:bg-gold hover:text-background text-white font-bold transition-all">
                            View Full Manifest <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-white text-sm">Gold (XAU)</span>
                  <span className="text-green-500 text-sm font-bold">+1.24%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-white text-sm">Brent Crude</span>
                  <span className="text-red-500 text-sm font-bold">-0.45%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-white text-sm">Silver (XAG)</span>
                  <span className="text-green-500 text-sm font-bold">+0.82%</span>
                </div>
                <Button nativeButton={false} variant="link" className="text-gold w-full text-center mt-2" render={<Link to="/intelligence" />}>
                  View Full Market Intelligence
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                  Due Diligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-400">
                  Sentinel Group provides full escrow and inspection services for all listed deals.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white">
                    <FileCheck className="w-4 h-4 text-gold" /> SGS Inspection Guaranteed
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <FileCheck className="w-4 h-4 text-gold" /> Secure Escrow via Tier-1 Banks
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <FileCheck className="w-4 h-4 text-gold" /> Full Logistics Integration
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-gold/10 to-transparent">
              <h4 className="text-white font-bold mb-2">Need a Custom Sourcing?</h4>
              <p className="text-xs text-gray-400 mb-4">
                If you don't see what you're looking for, our global network can source specific commodities on request.
              </p>
              <Button className="w-full bg-gold text-background font-bold">
                Request Private Sourcing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
