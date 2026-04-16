import * as React from "react";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Trash2, 
  FilePlus,
  ShieldAlert,
  Clock
} from "lucide-react";
import { Input } from "@/src/components/ui/input";

export function AdminDocuments() {
  const documents = [
    { name: "AU_Bullion_Manifest_2024.pdf", type: "Manifest", size: "2.4 MB", date: "2024-04-10", security: "Restricted" },
    { name: "Diamond_Kimberley_Cert.pdf", type: "Certificate", size: "1.2 MB", date: "2024-04-08", security: "Confidential" },
    { name: "BLCO_ATS_Verification.pdf", type: "Compliance", size: "0.5 MB", date: "2024-04-05", security: "Restricted" },
    { name: "LNG_Master_Agreement.pdf", type: "Legal", size: "4.2 MB", date: "2024-04-01", security: "Top Secret" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2">Document Vault</h1>
            <p className="text-gray-400">Secure management of manifests, certificates, and compliance documentation.</p>
          </div>
          <Button className="bg-gold text-background font-bold gap-2">
            <Upload className="w-5 h-5" /> Upload Document
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Manifests", count: 12, icon: FileText },
            { label: "Certificates", count: 24, icon: ShieldAlert },
            { label: "Compliance", count: 8, icon: FilePlus },
            { label: "Archived", count: 156, icon: Clock },
          ].map((cat) => (
            <Card key={cat.label} className="bg-secondary/20 border-white/5">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <cat.icon className="w-8 h-8 text-gold mb-3" />
                <p className="text-2xl font-serif text-white">{cat.count}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{cat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-secondary/20 border-white/5">
          <CardHeader className="border-b border-white/5">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input 
                placeholder="Search documents..." 
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-gold/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium truncate max-w-[200px]">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">{doc.size}</span>
                        <span className="text-[10px] text-gold uppercase tracking-widest font-bold">{doc.security}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gold">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
