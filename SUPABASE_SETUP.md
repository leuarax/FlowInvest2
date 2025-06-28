# Supabase & Vercel Setup Guide

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `flowinvest` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - Project URL
   - Anon public key

### 3. Set Up Environment Variables

Create a `.env` file in your project root with:

```env
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Create Database Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- User profiles table (stores onboarding data)
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  experience TEXT,
  risk_tolerance TEXT,
  interests TEXT[],
  primary_goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investments table
CREATE TABLE investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(15,2),
  date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real estate investments table
CREATE TABLE real_estate_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  property_type TEXT,
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  monthly_rent DECIMAL(10,2),
  location TEXT,
  purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_investments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own investments" ON investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" ON investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" ON investments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments" ON investments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own real estate" ON real_estate_investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own real estate" ON real_estate_investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own real estate" ON real_estate_investments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own real estate" ON real_estate_investments
  FOR DELETE USING (auth.uid() = user_id);
```

### 5. Configure Authentication

1. Go to Authentication → Settings in your Supabase dashboard
2. Configure your site URL:
   - For development: `http://localhost:3000`
   - For production: `https://your-vercel-domain.vercel.app`
3. Add redirect URLs:
   - `http://localhost:3000/dashboard`
   - `https://your-vercel-domain.vercel.app/dashboard`

### 6. Set Up Social Authentication (Optional)

#### Google OAuth:
1. Go to Authentication → Providers → Google
2. Enable Google provider
3. Create OAuth credentials in Google Cloud Console
4. Add Client ID and Client Secret

#### Apple OAuth:
1. Go to Authentication → Providers → Apple
2. Enable Apple provider
3. Configure with your Apple Developer account credentials

## Vercel Deployment

### 1. Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the same environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

### 2. Update Supabase Site URL

After deploying to Vercel, update your Supabase Authentication settings with your production domain.

### 3. Deploy

Your app should now deploy successfully with Supabase integration!

## Features Implemented

- ✅ User authentication (email/password)
- ✅ Social authentication (Google/Apple)
- ✅ User profile storage (onboarding data)
- ✅ Investment data storage
- ✅ Real estate investment storage
- ✅ Row Level Security (RLS) for data protection
- ✅ Automatic user session management

## Next Steps

1. Test the authentication flow locally
2. Deploy to Vercel
3. Test the production deployment
4. Add additional features like password reset, email verification, etc. 