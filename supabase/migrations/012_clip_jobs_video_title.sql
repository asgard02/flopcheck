-- Ajouter le titre de la vidéo aux jobs de clips
ALTER TABLE public.clip_jobs
  ADD COLUMN IF NOT EXISTS video_title TEXT;

