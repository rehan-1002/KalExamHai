-- ==============================================================================
-- KalExamHai: Phase 2 Schema & Provisioning Migration
-- Tables: profiles, credit_ledger
-- Triggers: Auto-provisioning, role assignment, tutor +2 credit bonus, admin superuser
-- Security: Strict Row Level Security (RLS) & Atomic Stored Procedures
-- ==============================================================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index on email and role for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Create Credit Ledger Table (Append-Only)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits spent
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'signup_bonus', 'starter_pack', 'iat_generation', 'end_sem_generation', 'admin_provision'
  reference_id TEXT, -- e.g. order_id, paper_id, or generation session ID
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON public.credit_ledger(user_id, created_at DESC);

-- 3. Automatic User Provisioning Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_initial_credits INTEGER := 0;
  v_reason TEXT := 'account_created';
BEGIN
  -- Determine role from metadata, default to 'student'
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  
  -- Master Admin override for rehxnnn0@gmail.com
  IF lower(new.email) = 'rehxnnn0@gmail.com' THEN
    v_role := 'admin';
    v_initial_credits := 9999;
    v_reason := 'admin_provision';
  ELSIF v_role = 'tutor' THEN
    -- Tutor 2 free credits bonus on signup
    v_initial_credits := 2;
    v_reason := 'signup_bonus';
  ELSE
    v_role := 'student';
    v_initial_credits := 0;
    v_reason := 'student_welcome';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = CASE WHEN lower(new.email) = 'rehxnnn0@gmail.com' THEN 'admin' ELSE public.profiles.role END,
      updated_at = now();

  -- Record initial ledger entry
  INSERT INTO public.credit_ledger (user_id, amount, balance_after, reason, reference_id)
  VALUES (new.id, v_initial_credits, v_initial_credits, v_reason, 'welcome');

  RETURN new;
END;
$$;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Atomic Credit Reservation Stored Procedure (Anti-Race Condition & Anti-Exploit)
CREATE OR REPLACE FUNCTION public.reserve_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER := 0;
  v_new_balance INTEGER;
  v_user_role TEXT;
BEGIN
  -- Validate amount is positive deduction
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credit amount');
  END IF;

  -- Lock latest ledger entry for this user
  SELECT balance_after INTO v_current_balance
  FROM public.credit_ledger
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  -- Check if user exists in profiles
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Admins have infinite bypass
  IF v_user_role = 'admin' THEN
    RETURN jsonb_build_object('success', true, 'balance_after', 9999, 'role', 'admin');
  END IF;

  -- If no prior ledger row exists, default balance is 0
  v_current_balance := COALESCE(v_current_balance, 0);

  -- Check sufficient credits
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'current_balance', v_current_balance,
      'required', p_amount
    );
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Append to immutable ledger
  INSERT INTO public.credit_ledger (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, -p_amount, v_new_balance, p_reason, p_reference_id);

  RETURN jsonb_build_object(
    'success', true,
    'balance_after', v_new_balance,
    'deducted', p_amount
  );
END;
$$;

-- 5. Refund Stored Procedure (Safe compensation if LLM generation fails)
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER := 0;
  v_new_balance INTEGER;
BEGIN
  SELECT balance_after INTO v_current_balance
  FROM public.credit_ledger
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  v_current_balance := COALESCE(v_current_balance, 0);
  v_new_balance := v_current_balance + p_amount;

  INSERT INTO public.credit_ledger (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, p_amount, v_new_balance, p_reason, p_reference_id);

  RETURN jsonb_build_object(
    'success', true,
    'balance_after', v_new_balance,
    'refunded', p_amount
  );
END;
$$;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can update their own display name" ON public.profiles;
CREATE POLICY "Users can update their own display name"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevent role self-escalation
  );

-- Credit Ledger Policies
DROP POLICY IF EXISTS "Users can view their own credit history" ON public.credit_ledger;
CREATE POLICY "Users can view their own credit history"
  ON public.credit_ledger
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Direct client INSERT / UPDATE / DELETE is strictly prohibited
-- All mutations must go through SECURITY DEFINER functions (reserve_credits, handle_new_user)
