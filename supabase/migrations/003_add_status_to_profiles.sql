-- Add status column to existing profiles table (if migration 001 already ran)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'suspended', 'cancelled'));

-- Update trigger to include status for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
