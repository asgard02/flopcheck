# Supabase Setup

## 1. Variables d'environnement

Ajoute dans `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta_anon_key
# ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY pour la nouvelle clé publishable
SUPABASE_SERVICE_ROLE_KEY=ta_service_role_key
```

La `SUPABASE_SERVICE_ROLE_KEY` est requise pour créer les profils des utilisateurs existants (fallback). Elle ne doit **jamais** être exposée côté client.

### Codes promo

Pour permettre aux utilisateurs d’upgrader via un code, ajoute dans `.env.local` :

```
PROMO_CODES=FLOPPRO:pro:50,FLOPUNLIMITED:unlimited:999,FLOPFREE:free:10
```

Format : `CODE:plan:analyses_limit` (séparés par des virgules).

## 2. Exécuter la migration SQL

Dans le [SQL Editor](https://supabase.com/dashboard/project/_/sql) de ton projet Supabase, exécute le contenu de `migrations/001_profiles_analyses.sql`.

Cela crée :
- Table `profiles` (id, email, username, plan, status, analyses_used, analyses_limit)
- Table `analyses` (id, user_id, video_url, video_id, video_title, etc., result jsonb)
- RLS sur les deux tables
- Trigger pour auto-créer un profil à chaque signup

## 3. Si tout le monde voit les vidéos de tout le monde

Exécute `migrations/003_fix_analyses_isolation.sql` pour :
- Forcer l’isolation par `user_id` sur la table `analyses`
- Supprimer la policy "Allow all" sur l’ancienne table `analyses_history`
