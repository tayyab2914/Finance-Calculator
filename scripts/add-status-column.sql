-- Add status column to analyses table for sales pipeline tracking
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'New' 
CHECK (status IN ('New', 'Sent', 'Approved', 'Lost'));

-- Update existing analyses to have 'New' status if null
UPDATE analyses SET status = 'New' WHERE status IS NULL;
