import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Shield, 
  Bell, 
  User, 
  Settings,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { motion } from "motion/react";

import { Link } from "react-router-dom";

export function Dashboard() {
  const stats = [
    { label: "Active Contracts", value: "12", icon: FileText, color: "text-blue-500" },
    { label: "Pending Shipments", value: "4", icon: Briefcase, color: "text-gold" },
    { label: "Security Alerts", value: "0", icon: Shield, color: "text-green-500" },
    { label: "Notifications", value: "3", icon: Bell, color: "text-gold" },
  ];

  const recentActivity = [
    { title: "Shipment GS-9921 Arrived", time: "2 hours ago", status: "Completed" },
    { title: "New Compliance Document Uploaded", time: "5 hours ago", status: "Action Required" },
    { title: "Contract Renewal: Sector 7", time: "1 day ago", status: "Pending" },
    { title: "Security Briefing: West Africa", time: "2 days ago", status: "Read" },
  ];

  return (
    <PageLayout title="Client Dashboard" subtitle="Secure overview of your global operations and assets.">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
                    </div>
                    <div className={`p-3 rounded-lg bg-white/5 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Active Operations</CardTitle>
                <CardDescription className="text-gray-400">Real-time status of your global security and logistics projects.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                          <Briefcase className="text-gold w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Operation Sentinel {i}</h4>
                          <p className="text-xs text-gray-400">Logistics • Maritime Security • Gulf of Aden</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-500/20 text-green-500 uppercase tracking-wider">
                          In Progress
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Updated 15m ago</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="text-gold mt-4 p-0 h-auto">
                  View All Operations <ArrowUpRight className="ml-1 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gold" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button nativeButton={false} variant="outline" className="border-white/10 text-white hover:bg-white/5 justify-start h-auto py-3 px-4" render={<Link to="/contact" />}>
                    New Request
                  </Button>
                  <Button nativeButton={false} variant="outline" className="border-white/10 text-white hover:bg-white/5 justify-start h-auto py-3 px-4" render={<Link to="/vault" />}>
                    Document Vault
                  </Button>
                  <Button nativeButton={false} variant="outline" className="border-white/10 text-white hover:bg-white/5 justify-start h-auto py-3 px-4" render={<Link to="/contact" />}>
                    Contact Agent
                  </Button>
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 justify-start h-auto py-3 px-4">
                    Billing
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-gold" />
                    Account Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden">
                      <img src="https://picsum.photos/seed/manager/100/100" alt="Manager" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Alexander Vance</h4>
                      <p className="text-xs text-gray-400">Senior Strategic Advisor</p>
                    </div>
                  </div>
                  <Button className="w-full bg-gold text-background font-bold">
                    Secure Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="relative pl-6 border-l border-white/10 pb-6 last:pb-0">
                      <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-gold" />
                      <h5 className="text-white text-sm font-medium">{activity.title}</h5>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      <span className="text-[10px] text-gold font-bold uppercase tracking-wider mt-2 block">
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gold border-none text-background">
              <CardHeader>
                <CardTitle className="text-background">Private Deal Room</CardTitle>
                <CardDescription className="text-background/80">Exclusive access to high-value commodity listings.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">You have 3 new listings matching your profile in the precious metals sector.</p>
                <Button nativeButton={false} variant="secondary" className="w-full bg-background text-white hover:bg-background/90" render={<Link to="/deal-room" />}>
                  Enter Deal Room
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
