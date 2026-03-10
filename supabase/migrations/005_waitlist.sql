-- Table waitlist for Clips feature signup
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for deduplication / lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist (created_at DESC);

-- RLS: allow anonymous insert (for signup)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist;
CREATE POLICY "Anyone can insert waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);
