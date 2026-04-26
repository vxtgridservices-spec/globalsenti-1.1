export interface ChemicalProduct {
  id: string;
  name: string;
  product_code?: string;
  category: string;
  description: string;
  rich_description?: string;
  image_url?: string;
  price_per_unit: number;
  unit_type: string;
  min_order: number;
  status: 'Active' | 'Inactive';
  created_at?: string;
}

export interface ChemicalReview {
  id: string;
  product_id: string;
  user_id?: string;
  full_name: string;
  avatar_url?: string;
  rating: number; // 1-5
  comment: string;
  created_at?: string;
}

export interface ShippingInfo {
  address: string;
  city: string;
  zip: string;
  country: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
}

export interface ChemicalOrder {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  payment_method: string;
  payment_status: 'Pending' | 'Awaiting Payment' | 'Proof Submitted' | 'Verified' | 'Rejected';
  order_status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment_proof_hash?: string;
  payment_instructions?: string;
  shipping_info?: ShippingInfo;
  created_at?: string;
  updated_at?: string;
  product?: ChemicalProduct;
  profile?: { email: string; full_name?: string };
}

export interface ChemicalDocument {
  id: string;
  order_id: string;
  title: string;
  file_url: string;
  type: 'Invoice' | 'SDS' | 'Certificate';
  created_at?: string;
}
