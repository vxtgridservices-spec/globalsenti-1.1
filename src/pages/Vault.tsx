import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { 
  Download, 
  FileText, 
  Shield, 
  Lock, 
  Search,
  Filter,
  FileCheck,
  Clock
} from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { motion } from "motion/react";

export function Vault() {
  const documents = [
    { name: "Corporate Compliance Framework 2024", type: "PDF", size: "2.4 MB", category: "Compliance", date: "Jan 12, 2024" },
    { name: "Global Security Protocols & Standards", type: "PDF", size: "5.1 MB", category: "Security", date: "Feb 05, 2024" },
    { name: "Commodity Trading License - UAE", type: "PDF", size: "1.2 MB", category: "Legal", date: "Dec 20, 2023" },
    { name: "Anti-Money Laundering (AML) Policy", type: "PDF", size: "3.8 MB", category: "Compliance", date: "Mar 15, 2024" },
    { name: "Logistics & Supply Chain Insurance", type: "PDF", size: "4.5 MB", category: "Insurance", date: "Nov 30, 2023" },
    { name: "Corporate Brochure - Premium Edition", type: "PDF", size: "12.4 MB", category: "Corporate", date: "Apr 01, 2024" },
  ];

  return (
    <PageLayout title="Document Vault" subtitle="Secure repository for compliance, legal, and corporate documentation.">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input className="pl-10 bg-white/5 border-white/10 text-white" placeholder="Search documents..." />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button className="bg-gold text-background font-bold gap-2 ml-auto md:ml-0">
              <Lock className="w-4 h-4" /> Request Access
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm uppercase tracking-widest">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["All Documents", "Compliance", "Legal", "Security", "Insurance", "Corporate"].map((cat) => (
                  <button
                    key={cat}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      cat === "All Documents" ? "bg-gold text-background font-bold" : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm uppercase tracking-widest">Storage Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Vault Capacity</span>
                    <span className="text-white">45% Used</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gold w-[45%]" />
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Your account has 50GB of secure encrypted storage.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Document Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {documents.map((doc, index) => (
                    <motion.tr
                      key={doc.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gold/10 flex items-center justify-center shrink-0">
                            <FileText className="text-gold w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium group-hover:text-gold transition-colors">{doc.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{doc.type} • {doc.size}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-xs text-gray-400">{doc.category}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" /> {doc.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gold hover:bg-gold/10">
                          <Download className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-center">
              <Shield className="text-gold w-12 h-12 mb-4 opacity-50" />
              <h4 className="text-white font-bold mb-2">Secure Upload</h4>
              <p className="text-sm text-gray-400 mb-6 max-w-md">
                Need to submit documents for verification? Drag and drop files here or click to browse. 
                All files are encrypted end-to-end.
              </p>
              <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-background font-bold">
                Select Files to Upload
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
