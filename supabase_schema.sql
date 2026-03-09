-- Tabela users_profiles
CREATE TABLE IF NOT EXISTS users_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  plan TEXT DEFAULT 'FREE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela social_profiles
CREATE TABLE IF NOT EXISTS social_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT,
  username TEXT,
  profile_url TEXT,
  avatar_url TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  engagement_rate DECIMAL(10,2) DEFAULT 0,
  road_score INTEGER DEFAULT 0,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela road_strategies
CREATE TABLE IF NOT EXISTS road_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT,
  niche TEXT,
  objective TEXT,
  strategy_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela usage_limits
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  generations_used INTEGER DEFAULT 0,
  generations_limit INTEGER DEFAULT 20,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- RLS Policies (Exemplo básico)
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON users_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON users_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own social profiles" ON social_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own social profiles" ON social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own strategies" ON road_strategies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own strategies" ON road_strategies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage limits" ON usage_limits FOR SELECT USING (auth.uid() = user_id);
