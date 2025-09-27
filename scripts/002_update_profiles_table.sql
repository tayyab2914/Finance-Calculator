-- Add subscription-related fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_discount_rate DECIMAL(5,2) DEFAULT 8.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Create function to sync subscription status from subscriptions table
CREATE OR REPLACE FUNCTION sync_profile_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile with the latest subscription status
  UPDATE profiles 
  SET 
    subscription_status = NEW.status,
    trial_ends_at = NEW.trial_end,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to sync subscription status to profiles
CREATE TRIGGER sync_subscription_status_to_profile
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_subscription_status();
