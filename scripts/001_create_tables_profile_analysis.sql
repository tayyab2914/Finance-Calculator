-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------------
-- DROP EXISTING OBJECTS (clean reset)
-----------------------------------------------------
DROP TABLE IF EXISTS public.analyses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS handle_updated_at();

DELETE FROM storage.buckets WHERE id = 'company-logos';

-----------------------------------------------------
-- CREATE TABLES
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    job_title TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_logo_url TEXT,
    default_discount_rate DECIMAL(5,2) DEFAULT 8.0,
    currency_symbol TEXT DEFAULT '$',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    client_details JSONB NOT NULL,
    current_equipment JSONB NOT NULL,
    proposed_equipment JSONB NOT NULL,
    analysis_settings JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'New'
        CHECK (status IN ('New', 'Sent', 'Approved', 'Lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------
-- STORAGE BUCKET
-----------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-----------------------------------------------------
-- ENABLE RLS
-----------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-----------------------------------------------------
-- POLICIES (Profiles)
-----------------------------------------------------
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-----------------------------------------------------
-- POLICIES (Analyses)
-----------------------------------------------------
CREATE POLICY "Users can view own analyses" ON public.analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.analyses
    FOR DELETE USING (auth.uid() = user_id);

-----------------------------------------------------
-- STORAGE POLICIES
-----------------------------------------------------
CREATE POLICY "Users can upload own company logo" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'company-logos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own company logo" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'company-logos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view company logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'company-logos');

-----------------------------------------------------
-- INDEXES
-----------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_email_idx 
    ON public.profiles(email);

CREATE INDEX IF NOT EXISTS analyses_user_id_idx 
    ON public.analyses(user_id);

CREATE INDEX IF NOT EXISTS analyses_created_at_idx 
    ON public.analyses(created_at);

CREATE INDEX IF NOT EXISTS analyses_updated_at_idx 
    ON public.analyses(updated_at);

-- Full text search on title
CREATE INDEX IF NOT EXISTS analyses_title_idx 
    ON public.analyses USING gin(to_tsvector('english', title));

-- Expression index on JSONB key "companyName"
CREATE INDEX IF NOT EXISTS analyses_client_company_idx 
    ON public.analyses ((client_details->>'companyName'));

-----------------------------------------------------
-- FUNCTION + TRIGGERS
-----------------------------------------------------
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER analyses_updated_at
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
