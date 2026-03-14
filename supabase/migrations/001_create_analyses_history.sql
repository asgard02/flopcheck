-- Table pour l'historique des analyses Vyrll
create table if not exists public.analyses_history (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  video_url text not null,
  video_title text not null,
  channel_title text not null,
  view_count text not null default '0',
  duration text not null default '',
  score integer not null,
  diagnosis jsonb not null default '{}',
  video_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Colonne video_data si la table existait déjà
alter table public.analyses_history add column if not exists video_data jsonb not null default '{}';

-- Index pour trier par date
create index if not exists idx_analyses_history_created_at
  on public.analyses_history (created_at desc);

-- RLS : permettre lecture/écriture (à restreindre si tu ajoutes l'auth)
alter table public.analyses_history enable row level security;

create policy "Allow all for analyses_history"
  on public.analyses_history
  for all
  using (true)
  with check (true);
