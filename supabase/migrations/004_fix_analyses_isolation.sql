-- ============================================
-- Isolation des analyses par user_id
-- Exécute cette migration si tout le monde voit les vidéos de tout le monde
-- ============================================

-- 1. S'assurer que la table analyses existe avec user_id
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  video_title TEXT,
  video_thumbnail TEXT,
  view_count TEXT,
  subscriber_count TEXT,
  score NUMERIC,
  result JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ajouter user_id si la table existait sans (migration depuis ancienne structure)
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. RLS strict sur analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses FORCE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies pour éviter les conflits
DROP POLICY IF EXISTS "Users can view own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON public.analyses;

-- Policies strictes : uniquement ses propres données
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Restreindre analyses_history (ancienne table sans user_id)
-- Supprime la policy "Allow all" qui permettait à tout le monde de tout voir :
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analyses_history') THEN
    DROP POLICY IF EXISTS "Allow all for analyses_history" ON public.analyses_history;
    -- Sans policy, plus personne n'y a accès. L'app utilise maintenant "analyses".
  END IF;
END $$;
