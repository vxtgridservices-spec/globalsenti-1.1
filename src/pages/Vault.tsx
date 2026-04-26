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
  Clock,
  Loader2,
  Check
} from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { motion } from "motion/react";
import { jsPDF } from "jspdf";

interface VaultDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  category: string;
  date: string;
  status: 'active' | 'generating';
}

const INITIAL_DOCS: VaultDocument[] = [
  { id: '1', name: "Corporate Compliance Framework 2026", type: "PDF", size: "2.4 MB", category: "Compliance", date: "Jan 12, 2026", status: 'active' },
  { id: '2', name: "Global Security Protocols & Standards", type: "PDF", size: "5.1 MB", category: "Security", date: "Feb 05, 2026", status: 'active' },
  { id: '3', name: "Commodity Trading License - UAE", type: "PDF", size: "1.2 MB", category: "Legal", date: "Dec 20, 2023", status: 'active' },
  { id: '4', name: "Anti-Money Laundering (AML) Policy", type: "PDF", size: "3.8 MB", category: "Compliance", date: "Mar 15, 2026", status: 'active' },
  { id: '5', name: "Logistics & Supply Chain Insurance", type: "PDF", size: "4.5 MB", category: "Insurance", date: "Nov 30, 2023", status: 'active' },
  { id: '6', name: "Corporate Brochure - Premium Edition", type: "PDF", size: "12.4 MB", category: "Corporate", date: "Apr 01, 2026", status: 'active' },
];

export function Vault() {
  const [documents, setDocuments] = React.useState<VaultDocument[]>(INITIAL_DOCS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All Documents");
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const categories = ["All Documents", "Compliance", "Legal", "Security", "Insurance", "Corporate"];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Documents" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Simulate secure upload and encryption
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newDocs: VaultDocument[] = Array.from(files as Iterable<File> | ArrayLike<File>).map((file: File, index) => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        id: `upl-${Date.now()}-${index}`,
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        size: `${sizeMb === '0.0' ? '<0.1' : sizeMb} MB`,
        category: selectedCategory !== "All Documents" ? selectedCategory : "Corporate",
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: 'active'
      };
    });

    setDocuments(prev => [...newDocs, ...prev]);
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDownload = async (id: string, name: string) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, status: 'generating' } : doc));
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate secure PDF
    const pdf = new jsPDF();
    pdf.setFillColor(10, 10, 10);
    pdf.rect(0, 0, 210, 297, "F"); 
    pdf.setFillColor(212, 175, 55);
    pdf.rect(0, 0, 210, 10, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("GLOBAL SENTINEL GROUP", 105, 30, { align: "center" });
    pdf.setFontSize(14);
    pdf.setTextColor(212, 175, 55); 
    pdf.text("SECURE DOCUMENT VAULT", 105, 45, { align: "center" });
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(18);
    pdf.text(name, 105, 70, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Date Assessed: ${new Date().toLocaleDateString()}`, 20, 100);
    pdf.text(`Status: VERIFIED ENCRYPTED CONTENT`, 20, 110);
    pdf.text(`Vault ID: VLT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 20, 120);

    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    let contentText = `This document ("${name}") is a certified copy retrieved from the secure vault \nof Global Sentinel Group. \n\nThis transmission is end-to-end encrypted and intended solely for the authorized \naccount holder. Unauthorized distribution is strictly prohibited under \ninternational compliance regulations.`;

    if (name.includes("Anti-Money Laundering")) {
      contentText = `ANTI-MONEY LAUNDERING (AML) POLICY & FRAMEWORK\n\n1. SCOPE AND PURPOSE\nGlobal Sentinel Group (GSG) is committed strictly to preventing the use of its operations for money\nlaundering or terrorist financing. This document outlines the protocols compliant with international\nFATF recommendations.\n\n2. CUSTOMER DUE DILIGENCE (CDD)\nAll counterparties must undergo rigorous Know Your Customer (KYC) screening prior to any\nfinancial transaction or physical commodity transfer. Enhanced Due Diligence (EDD) is mandated\nfor high-risk jurisdictions.\n\n3. REPORTING OF SUSPICIOUS TRANSACTIONS\nEmployees and affiliates are legally bound to report any suspicious trading activity, irregularities in\nfund origins, or opaque beneficial ownership structures to the Chief Compliance Officer.`;
    } else if (name.includes("Compliance Framework")) {
      contentText = `CORPORATE COMPLIANCE FRAMEWORK 2026\n\n1. REGULATORY ADHERENCE\nAll operations pertaining to strategic resource acquisition, logistics, and private security must align\nwith extraterritorial regulations including the FCPA and UK Bribery Act.\n\n2. AUDIT & REPORTING\nInternal audits are conducted quarterly on all supply chain nodes. Discrepancies exceeding 0.1%\nin physical inventory vs. ledger records mandate an immediate operational freeze and investigation.\n\n3. CODE OF CONDUCT\nIntegrity and precision are non-negotiable. GSG personnel are expected to maintain the highest\nstandard of discretion and professional ethics in all global deployments.`;
    } else if (name.includes("Security Protocols")) {
      contentText = `GLOBAL SECURITY PROTOCOLS & STANDARDS\n\n1. THREAT LEVEL ASSESSMENT\nAll logistics routes are continuously monitored by our global intelligence division. Assets in transit\nare escorted by armed personnel where legally permissible and necessary.\n\n2. ASSET SAFEGUARDING\nPhysical vaults utilize multi-factor biometric access, 24/7 seismic monitoring, and constant\narmed overwatch. Transit vehicles are armored to STANAG Level IV.\n\n3. BREACH RESPONSE\nIn the event of a security breach, "Protocol Omega" is initiated, securing all nodes locally while\nthe tactical response team is deployed. Local authorities are engaged per host-nation agreements.`;
    } else if (name.includes("License")) {
      contentText = `COMMODITY TRADING LICENSE & AUTHORIZATION\n\nISSUING AUTHORITY: Dubai Multi Commodities Centre (DMCC)\nLICENSE TYPE: Trading in Precious Metals & Strategic Resources\nSTATUS: ACTIVE & IN GOOD STANDING\n\nThis document certifies that Global Sentinel Group is legally authorized to engage in the import,\nexport, and trading of high-value commodities in the specified jurisdiction. All trading activities are\nsubject to the regulations set forth by the governing authority and the central bank.`;
    } else if (name.includes("Insurance")) {
       contentText = `LOGISTICS & SUPPLY CHAIN INSURANCE DECLARATION\n\n1. COVERAGE SCOPE\nComprehensive All-Risk coverage for goods in transit via terrestrial, maritime, and aerial routes.\nMaximum liability per shipment: USD $500,000,000.\n\n2. INSURED PERILS\nCoverage encompasses theft, hijacking, acts of god, natural disasters, and geopolitical disruptions,\nexcluding active war zones declared prior to shipment initiation.\n\n3. UNDERWRITER SYNDICATE\nCoverage is backed by a syndicate of tier-1 Lloyd's underwriters. Claims must be filed within\n48 hours of an incident report generated by the GSG Operations Center.`;
    }

    // Wrap text if needed, but jsPDF text doesn't auto-wrap well with \n if it's too long, so I've manually added \n above.
    const splitText = pdf.splitTextToSize(contentText, 170);
    pdf.text(splitText, 20, 140);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text("--- End of Vault Document ---", 105, 280, { align: "center" });
    
    pdf.save(`${name.replace(/\s+/g, "_")}_Secure_Vault.pdf`);

    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, status: 'active' } : doc));
  };

  return (
    <PageLayout title="Document Vault" subtitle="Secure repository for compliance, legal, and corporate documentation.">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input 
              className="pl-10 bg-white/5 border-white/10 text-white" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      cat === selectedCategory ? "bg-gold text-background font-bold" : "text-gray-400 hover:text-white hover:bg-white/5"
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
                  {filteredDocs.map((doc, index) => (
                    <motion.tr
                      key={doc.id}
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-400 hover:text-gold hover:bg-gold/10"
                          onClick={() => handleDownload(doc.id, doc.name)}
                          disabled={doc.status === 'generating'}
                        >
                          {doc.status === 'generating' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredDocs.length === 0 && (
                     <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                           No documents found matching your criteria.
                        </td>
                     </tr>
                  )}
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
              
              <input 
                type="file" 
                multiple
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              
              <Button 
                variant="outline" 
                className="border-gold text-gold hover:bg-gold hover:text-background font-bold transition-all"
                onClick={triggerFileInput}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Encrypting Files...
                  </>
                ) : (
                  'Select Files to Upload'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
