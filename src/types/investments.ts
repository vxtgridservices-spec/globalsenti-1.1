export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ProductStatus = 'Draft' | 'Active' | 'Closed' | 'Funded' | 'Matured';
export type PositionStatus = 'Active' | 'Matured' | 'Payout Available';
export type SubscriptionStatus = 'Awaiting Funding Instructions' | 'Awaiting Payment' | 'Funding Submitted' | 'Funded' | 'Cancelled' | 'Matured';
export type ROIType = 'Fixed' | 'Variable';
export type DistributionFrequency = 'End of term' | 'Monthly';

export interface PerformanceUpdate {
    id?: string;
    product_id: string;
    current_nav: number;
    roi_percentage: number;
    created_at: string;
}

export interface InvestorPosition {
  id: string;
  user_id: string;
  product_id: string;
  units: number;
  total_invested: number;
  status: PositionStatus;
  created_at: string;
  product?: InvestmentProduct;
}

export interface InvestmentProduct {
  id: string;
  name: string;
  commodity: string;
  min_investment: number;
  max_allocation: number;
  unit_price: number;
  units_available: number;
  total_units: number;
  target_roi: number;
  roi_type: ROIType;
  distribution_frequency: DistributionFrequency;
  duration_days: number;
  start_date: string;
  maturity_date: string;
  risk_level: RiskLevel;
  status: ProductStatus;
  description: string;
  strategy_notes?: string;
  created_at: string;
}

export interface FundingDetails {
  beneficiary?: string;
  bank?: string;
  swift?: string;
  iban?: string;
  wallet_address?: string;
  network?: string;
  asset?: string;
  reference_code: string;
}

export interface InvestmentSubscription {
  id: string;
  user_id: string;
  product_id: string;
  units: number;
  unit_price_at_purchase: number;
  total_amount: number;
  payment_method: string;
  status: SubscriptionStatus;
  payment_proof_hash?: string;
  funding_details?: FundingDetails;
  created_at: string;
  funded_at?: string;
  product?: InvestmentProduct;
}

export interface InvestmentPosition extends InvestorPosition {
  product_name?: string;
  total_value?: number;
}

export interface FundingSubmission {
  id: string;
  subscription_id: string;
  user_id: string;
  payment_proof_hash: string;
  amount: number;
  status: 'Pending' | 'Verified' | 'Rejected';
  admin_notes?: string;
  created_at: string;
  verified_at?: string;
  profile?: {
    email: string;
    full_name?: string;
  };
  subscription?: InvestmentSubscription;
}

export interface RedemptionRequest {
  id: string;
  position_id: string;
  user_id: string;
  units: number;
  amount: number;
  redemption_type: 'Partial' | 'Full';
  payment_destination: any;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Processing Payout' | 'Completed';
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
  profile?: {
    email: string;
    full_name?: string;
  };
  position?: InvestorPosition;
}

export interface InvestorTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  position_id?: string;
  type: 'deposit' | 'allocation' | 'redemption' | 'withdrawal' | 'roi_accrual';
  amount: number;
  currency: string;
  description: string;
  metadata?: any;
  created_at: string;
}

export interface PriceHistory {
    id: string;
    product_id: string;
    price: number;
    timestamp: string;
}
