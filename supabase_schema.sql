-- ViralRoad Supabase Schema

-- 1. Profiles Table (Creator Data)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    profile_type TEXT DEFAULT 'Influenciador Geral',
    specialization TEXT DEFAULT 'Geral',
    subscription_status TEXT DEFAULT 'none',
    current_plan TEXT DEFAULT 'starter',
    settings JSONB DEFAULT '{}'::jsonb,
    social_profiles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Usage Limits Table
CREATE TABLE IF NOT EXISTS public.usage_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE NOT NULL,
    plan TEXT DEFAULT 'starter',
    monthly_limit INTEGER DEFAULT 100,
    used_this_month INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Content Blueprints Table
CREATE TABLE IF NOT EXISTS public.content_blueprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT,
    type TEXT NOT NULL, -- 'blueprint' or 'content'
    segment TEXT,
    platform TEXT,
    format TEXT,
    funnel_stage TEXT,
    target_audience TEXT,
    objective TEXT,
    script TEXT,
    caption TEXT,
    hashtags TEXT,
    creative_direction TEXT,
    status TEXT DEFAULT 'ideia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Hooks Library Table
CREATE TABLE IF NOT EXISTS public.hooks_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    viral_percentage INTEGER,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Performance Metrics Table (New)
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    followers INTEGER,
    following INTEGER,
    likes INTEGER,
    posts INTEGER,
    views INTEGER,
    engagement_rate DECIMAL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Engagement Analytics Table (New)
CREATE TABLE IF NOT EXISTS public.engagement_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,
    viral_score INTEGER,
    best_format TEXT,
    frequency_suggestion TEXT,
    content_pillars JSONB,
    diagnostic JSONB,
    next_post_recommendation JSONB,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hooks_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_analytics ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Usage Limits: Users can view their own limits
CREATE POLICY "Users can view own usage" ON public.usage_limits FOR SELECT USING (auth.uid() = user_id);

-- Content Blueprints: Users can manage their own blueprints
CREATE POLICY "Users can manage own blueprints" ON public.content_blueprints FOR ALL USING (auth.uid() = user_id);

-- Hooks Library: Users can manage their own hooks
CREATE POLICY "Users can manage own hooks" ON public.hooks_library FOR ALL USING (auth.uid() = user_id);

-- Performance Metrics: Users can manage their own metrics
CREATE POLICY "Users can manage own metrics" ON public.performance_metrics FOR ALL USING (auth.uid() = user_id);

-- Engagement Analytics: Users can manage their own analytics
CREATE POLICY "Users can manage own analytics" ON public.engagement_analytics FOR ALL USING (auth.uid() = user_id);

-- 7. Functions & Triggers

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.usage_limits (user_id, used_this_month)
    VALUES (user_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        used_this_month = usage_limits.used_this_month + 1,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile and usage limits on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');

  INSERT INTO public.usage_limits (user_id, plan, monthly_limit)
  VALUES (new.id, 'starter', 100);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;
