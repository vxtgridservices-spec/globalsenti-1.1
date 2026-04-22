
-- Part 6: CREATE TABLES

-- funding_submissions table
CREATE TABLE IF NOT EXISTS funding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES investment_subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_proof_hash TEXT NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- redemption_requests table
CREATE TABLE IF NOT EXISTS redemption_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID REFERENCES investor_positions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    units NUMERIC(20, 4) NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    redemption_type TEXT CHECK (redemption_type IN ('Partial', 'Full')),
    payment_destination JSONB NOT NULL,
    status TEXT DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Rejected', 'Processing Payout', 'Completed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- investor_transactions table
CREATE TABLE IF NOT EXISTS investor_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES investment_subscriptions(id) ON DELETE SET NULL,
    position_id UUID REFERENCES investor_positions(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('deposit', 'allocation', 'redemption', 'withdrawal', 'roi_accrual')),
    amount NUMERIC(20, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE funding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own funding submissions" ON funding_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own funding submissions" ON funding_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own redemption requests" ON redemption_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own redemption requests" ON redemption_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON investor_transactions FOR SELECT USING (auth.uid() = user_id);
