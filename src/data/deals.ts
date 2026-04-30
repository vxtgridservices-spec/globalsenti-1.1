export interface Deal {
  id: string;
  broker_id?: string;
  buyer_id?: string;
  type: string;
  title: string;
  location: string;
  purity: string;
  price: string;
  status: "Available" | "Under Review" | "Closed";
  commodityType: string;
  quantity: string;
  form: string;
  origin: string;
  pricing: {
    type: string;
    marketPosition: string;
    currency: string;
    paymentTerms: string;
  };
  logistics: {
    deliveryTerms: string;
    shippingPort: string;
    inspectionAgency: string;
    insurance: string;
  };
  documents: { name: string; size: string; url?: string }[];
  compliance: {
    kyc: string;
    aml: string;
    sellerStatus: string;
  };
  conditions: {
    moq: string;
    contractDuration: string;
    exclusivity: string;
  };
  is_private?: boolean;
  computed_tier?: string;
  is_admin_deal?: boolean;
}

export const deals: Deal[] = [
  {
    id: "DR-2026-001",
    broker_id: "admin-system",
    type: "Gold",
    title: "AU Bullion - 500kg Spot",
    location: "Dubai, UAE",
    purity: "99.99% (24K)",
    price: "Market - 2%",
    status: "Available",
    commodityType: "Gold Bullion",
    quantity: "500 Kilograms",
    form: "1kg Standard Bars",
    origin: "Ghana / Mali",
    pricing: {
      type: "Spot Purchase",
      marketPosition: "LBMA Market - 2% Gross / -1.5% Net",
      currency: "USD",
      paymentTerms: "MT103 / SBLC / Escrow"
    },
    logistics: {
      deliveryTerms: "FOB (Free On Board)",
      shippingPort: "Dubai International Airport (DXB)",
      inspectionAgency: "SGS / Alex Stewart International",
      insurance: "Full Transit Insurance (110% Value)"
    },
    documents: [
      { name: "Certificate of Origin", size: "2.4 MB" },
      { name: "Assay Report (SGS)", size: "1.8 MB" },
      { name: "Export License", size: "3.1 MB" },
      { name: "Bill of Lading (Draft)", size: "0.9 MB" }
    ],
    compliance: {
      kyc: "Verified",
      aml: "Compliant",
      sellerStatus: "Tier-1 Verified Seller"
    },
    conditions: {
      moq: "50kg",
      contractDuration: "Spot (One-time)",
      exclusivity: "Non-Exclusive until LOI"
    }
  },
  {
    id: "DR-2026-002",
    type: "Diamonds",
    title: "Rough Diamonds - 12,000 Carats",
    location: "Antwerp, Belgium",
    purity: "Mixed Clarity (D-H)",
    price: "Private Offer",
    status: "Under Review",
    commodityType: "Rough Diamonds",
    quantity: "12,000 Carats",
    form: "Uncut Stones",
    origin: "Botswana / Namibia",
    pricing: {
      type: "Contract Sale",
      marketPosition: "Rapaport - 12%",
      currency: "USD",
      paymentTerms: "Bank Guarantee / Escrow"
    },
    logistics: {
      deliveryTerms: "CIF (Cost, Insurance, Freight)",
      shippingPort: "Antwerp Diamond District",
      inspectionAgency: "GIA / HRD Antwerp",
      insurance: "Lloyds of London Specialty Coverage"
    },
    documents: [
      { name: "Kimberley Process Certificate", size: "1.2 MB" },
      { name: "GIA Valuation Report", size: "4.5 MB" },
      { name: "Mining License", size: "2.8 MB" },
      { name: "Insurance Certificate", size: "1.5 MB" }
    ],
    compliance: {
      kyc: "Verified",
      aml: "Compliant",
      sellerStatus: "Sightholder Verified"
    },
    conditions: {
      moq: "2,000 Carats",
      contractDuration: "Annual (Renewable)",
      exclusivity: "Exclusive for 30 Days"
    }
  },
  {
    id: "DR-2026-003",
    type: "Crude Oil",
    title: "Bonny Light Crude - 2M Barrels",
    location: "Offshore Nigeria",
    purity: "API 35",
    price: "Platts - $4",
    status: "Available",
    commodityType: "Crude Oil (BLCO)",
    quantity: "2,000,000 Barrels",
    form: "Bulk Liquid",
    origin: "Nigeria (NNPC)",
    pricing: {
      type: "Spot Contract",
      marketPosition: "Platts Dated Brent - $4.00",
      currency: "USD",
      paymentTerms: "DLC / SBLC / MT103"
    },
    logistics: {
      deliveryTerms: "TTO (Tanker Take Over)",
      shippingPort: "Bonny Terminal",
      inspectionAgency: "Saybolt / SGS",
      insurance: "Q&Q Inspection Guaranteed"
    },
    documents: [
      { name: "Authority to Sell (ATS)", size: "0.5 MB" },
      { name: "Cargo Manifest", size: "1.1 MB" },
      { name: "Vessel Q88", size: "2.2 MB" },
      { name: "NNPC Allocation Letter", size: "3.4 MB" }
    ],
    compliance: {
      kyc: "Verified",
      aml: "Compliant",
      sellerStatus: "NNPC Registered"
    },
    conditions: {
      moq: "1,000,000 Barrels",
      contractDuration: "Spot / TTM",
      exclusivity: "First-come, First-served"
    }
  },
  {
    id: "DR-2026-004",
    type: "Natural Gas",
    title: "LNG Supply - 50,000 MT",
    location: "Qatar",
    purity: "Pipeline Grade",
    price: "Contract Based",
    status: "Available",
    commodityType: "Liquefied Natural Gas (LNG)",
    quantity: "50,000 Metric Tons",
    form: "Cryogenic Liquid",
    origin: "Qatar (QatarEnergy)",
    pricing: {
      type: "Contract Based",
      marketPosition: "JKM / Henry Hub Linked",
      currency: "USD",
      paymentTerms: "LC / SBLC / Escrow"
    },
    logistics: {
      deliveryTerms: "DES (Delivered Ex Ship)",
      shippingPort: "Ras Laffan",
      inspectionAgency: "SGS / Intertek",
      insurance: "Marine Cargo Insurance Included"
    },
    documents: [
      { name: "Certificate of Quality", size: "1.5 MB" },
      { name: "Master Sales Agreement", size: "4.2 MB" },
      { name: "Vessel Nomination", size: "0.8 MB" }
    ],
    compliance: {
      kyc: "Verified",
      aml: "Compliant",
      sellerStatus: "State-Owned Enterprise"
    },
    conditions: {
      moq: "10,000 MT",
      contractDuration: "Long-term / Spot",
      exclusivity: "Subject to Allocation"
    }
  },
  {
    id: "DR-2026-005",
    type: "Industrial Minerals",
    title: "Rare Earth Minerals - 5,000 MT",
    location: "Australia",
    purity: "High Grade",
    price: "Negotiable",
    status: "Under Review",
    commodityType: "Rare Earth Oxides",
    quantity: "5,000 Metric Tons",
    form: "Concentrate Powder",
    origin: "Western Australia",
    pricing: {
      type: "Negotiable",
      marketPosition: "Market Price + Premium",
      currency: "USD",
      paymentTerms: "Wire Transfer / LC"
    },
    logistics: {
      deliveryTerms: "CIF (Cost, Insurance, Freight)",
      shippingPort: "Port of Fremantle",
      inspectionAgency: "Bureau Veritas",
      insurance: "Full Industrial Coverage"
    },
    documents: [
      { name: "Technical Specification Sheet", size: "2.1 MB" },
      { name: "Environmental Compliance", size: "3.5 MB" },
      { name: "Export Permit", size: "1.9 MB" }
    ],
    compliance: {
      kyc: "Verified",
      aml: "Compliant",
      sellerStatus: "Publicly Traded Entity"
    },
    conditions: {
      moq: "500 MT",
      contractDuration: "Quarterly Supply",
      exclusivity: "Non-Exclusive"
    }
  },
  {
    id: "DR-2026-006",
    type: "Precious Stones",
    title: "Mixed Gemstones - 8,000 Carats",
    location: "Sri Lanka",
    purity: "Certified",
    price: "Private Offer",
    status: "Available",
    commodityType: "Sapphires & Rubies",
    quantity: "8,000 Carats",
    form: "Rough & Cut Mix",
    origin: "Ratnapura, Sri Lanka",
    pricing: {
      type: "Private Offer",
      marketPosition: "Appraised Value - 15%",
      currency: "USD",
      paymentTerms: "Escrow / Secure Wire"
    },
    logistics: {
      deliveryTerms: "Hand Carry / Secure Courier",
      shippingPort: "Colombo International",
      inspectionAgency: "GIC / GRS Certified",
      insurance: "Brinks / Malca-Amit Secured"
    },
    documents: [
      { name: "Gemological Certificates", size: "8.4 MB" },
      { name: "Valuation Report", size: "2.2 MB" },
      { name: "Export Authorization", size: "1.1 MB" }
    ],
    compliance: {
      kyc: "Verified",
      aml: "Compliant",
      sellerStatus: "Licensed Gem Dealer"
    },
    conditions: {
      moq: "500 Carats",
      contractDuration: "Spot Sale",
      exclusivity: "Exclusive for 48 Hours"
    }
  }
];
