-- ============================================================================
-- SEED DATA - Test data for user 0720b074-fe5a-44e1-8932-da78e9a22f26
-- Run this AFTER the schema setup
-- ============================================================================

-- User ID variable (for easy modification)
DO $$
DECLARE
  v_user_id uuid := '0720b074-fe5a-44e1-8932-da78e9a22f26';
  
  -- Context IDs
  ctx_vacanze uuid := uuid_generate_v4();
  ctx_lavoro uuid := uuid_generate_v4();
  ctx_famiglia uuid := uuid_generate_v4();
  
  -- Category IDs - EXPENSE Parents
  cat_casa uuid := uuid_generate_v4();
  cat_spesa uuid := uuid_generate_v4();
  cat_trasporti uuid := uuid_generate_v4();
  cat_ristoranti uuid := uuid_generate_v4();
  cat_intrattenimento uuid := uuid_generate_v4();
  cat_abbigliamento uuid := uuid_generate_v4();
  cat_salute uuid := uuid_generate_v4();
  cat_abbonamenti uuid := uuid_generate_v4();
  
  -- Category IDs - EXPENSE Children (Casa)
  cat_affitto uuid := uuid_generate_v4();
  cat_utenze uuid := uuid_generate_v4();
  cat_manutenzione_casa uuid := uuid_generate_v4();
  
  -- Category IDs - EXPENSE Children (Spesa)
  cat_supermercato uuid := uuid_generate_v4();
  cat_mercato uuid := uuid_generate_v4();
  
  -- Category IDs - EXPENSE Children (Trasporti)
  cat_auto uuid := uuid_generate_v4();
  cat_moto uuid := uuid_generate_v4();
  cat_auto_carburante uuid := uuid_generate_v4();
  cat_auto_manutenzione uuid := uuid_generate_v4();
  cat_auto_assicurazione uuid := uuid_generate_v4();
  cat_moto_carburante uuid := uuid_generate_v4();
  cat_moto_manutenzione uuid := uuid_generate_v4();
  cat_moto_assicurazione uuid := uuid_generate_v4();
  cat_trasporto_pubblico uuid := uuid_generate_v4();
  
  -- Category IDs - EXPENSE Children (Ristoranti)
  cat_pranzo uuid := uuid_generate_v4();
  cat_cena uuid := uuid_generate_v4();
  cat_aperitivo uuid := uuid_generate_v4();
  cat_delivery uuid := uuid_generate_v4();
  
  -- Category IDs - EXPENSE Children (Intrattenimento)
  cat_cinema uuid := uuid_generate_v4();
  cat_concerti uuid := uuid_generate_v4();
  cat_sport uuid := uuid_generate_v4();
  cat_viaggi uuid := uuid_generate_v4();
  
  -- Category IDs - EXPENSE Children (Salute)
  cat_farmacia uuid := uuid_generate_v4();
  cat_visite uuid := uuid_generate_v4();
  cat_palestra uuid := uuid_generate_v4();
  
  -- Category IDs - EXPENSE Children (Abbonamenti)
  cat_streaming uuid := uuid_generate_v4();
  cat_telefono uuid := uuid_generate_v4();
  cat_internet uuid := uuid_generate_v4();
  cat_cloud uuid := uuid_generate_v4();
  
  -- Category IDs - INCOME Parents
  cat_stipendio uuid := uuid_generate_v4();
  cat_bonus uuid := uuid_generate_v4();
  cat_rimborsi uuid := uuid_generate_v4();
  cat_freelance uuid := uuid_generate_v4();
  
  -- Category IDs - INVESTMENT Parents
  cat_etf uuid := uuid_generate_v4();
  cat_risparmi uuid := uuid_generate_v4();
  cat_crypto uuid := uuid_generate_v4();

BEGIN

  -- ==========================================================================
  -- INSERT CONTEXTS
  -- ==========================================================================
  INSERT INTO public.contexts (id, user_id, name, description, active) VALUES
    (ctx_vacanze, v_user_id, 'Vacanze', 'Spese durante le vacanze', true),
    (ctx_lavoro, v_user_id, 'Lavoro', 'Spese legate al lavoro', true),
    (ctx_famiglia, v_user_id, 'Famiglia', 'Spese per la famiglia', true);

  -- ==========================================================================
  -- INSERT CATEGORIES - EXPENSE (with hierarchy)
  -- ==========================================================================
  
  -- Level 1: Parent categories
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_casa, v_user_id, 'Casa', 'Home', '#6366f1', 'expense', NULL, true),
    (cat_spesa, v_user_id, 'Spesa', 'ShoppingCart', '#10b981', 'expense', NULL, true),
    (cat_trasporti, v_user_id, 'Trasporti', 'Car', '#f59e0b', 'expense', NULL, true),
    (cat_ristoranti, v_user_id, 'Ristoranti', 'Utensils', '#ef4444', 'expense', NULL, true),
    (cat_intrattenimento, v_user_id, 'Intrattenimento', 'Gamepad2', '#8b5cf6', 'expense', NULL, true),
    (cat_abbigliamento, v_user_id, 'Abbigliamento', 'Shirt', '#ec4899', 'expense', NULL, true),
    (cat_salute, v_user_id, 'Salute', 'Heart', '#14b8a6', 'expense', NULL, true),
    (cat_abbonamenti, v_user_id, 'Abbonamenti', 'Smartphone', '#64748b', 'expense', NULL, true);
  
  -- Level 2: Casa children
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_affitto, v_user_id, 'Affitto', 'Home', '#6366f1', 'expense', cat_casa, true),
    (cat_utenze, v_user_id, 'Utenze', 'Lightbulb', '#6366f1', 'expense', cat_casa, true),
    (cat_manutenzione_casa, v_user_id, 'Manutenzione', 'Wrench', '#6366f1', 'expense', cat_casa, true);
  
  -- Level 2: Spesa children
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_supermercato, v_user_id, 'Supermercato', 'ShoppingCart', '#10b981', 'expense', cat_spesa, true),
    (cat_mercato, v_user_id, 'Mercato', 'ShoppingBag', '#10b981', 'expense', cat_spesa, true);
  
  -- Level 2: Trasporti children (Auto e Moto)
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_auto, v_user_id, 'Auto', 'Car', '#f59e0b', 'expense', cat_trasporti, true),
    (cat_moto, v_user_id, 'Moto', 'Bike', '#f59e0b', 'expense', cat_trasporti, true),
    (cat_trasporto_pubblico, v_user_id, 'Trasporto Pubblico', 'Train', '#f59e0b', 'expense', cat_trasporti, true);
  
  -- Level 3: Auto children
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_auto_carburante, v_user_id, 'Carburante Auto', 'Fuel', '#f59e0b', 'expense', cat_auto, true),
    (cat_auto_manutenzione, v_user_id, 'Manutenzione Auto', 'Wrench', '#f59e0b', 'expense', cat_auto, true),
    (cat_auto_assicurazione, v_user_id, 'Assicurazione Auto', 'Star', '#f59e0b', 'expense', cat_auto, true);
  
  -- Level 3: Moto children
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_moto_carburante, v_user_id, 'Carburante Moto', 'Fuel', '#f59e0b', 'expense', cat_moto, true),
    (cat_moto_manutenzione, v_user_id, 'Manutenzione Moto', 'Wrench', '#f59e0b', 'expense', cat_moto, true),
    (cat_moto_assicurazione, v_user_id, 'Assicurazione Moto', 'Star', '#f59e0b', 'expense', cat_moto, true);
  
  -- Level 2: Ristoranti children
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_pranzo, v_user_id, 'Pranzo', 'Sun', '#ef4444', 'expense', cat_ristoranti, true),
    (cat_cena, v_user_id, 'Cena', 'Moon', '#ef4444', 'expense', cat_ristoranti, true),
    (cat_aperitivo, v_user_id, 'Aperitivo', 'Coffee', '#ef4444', 'expense', cat_ristoranti, true),
    (cat_delivery, v_user_id, 'Delivery', 'Bike', '#ef4444', 'expense', cat_ristoranti, true);
  
  -- Level 2: Intrattenimento children
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_cinema, v_user_id, 'Cinema', 'Tv', '#8b5cf6', 'expense', cat_intrattenimento, true),
    (cat_concerti, v_user_id, 'Concerti & Eventi', 'Music', '#8b5cf6', 'expense', cat_intrattenimento, true),
    (cat_sport, v_user_id, 'Sport & Hobby', 'Dumbbell', '#8b5cf6', 'expense', cat_intrattenimento, true),
    (cat_viaggi, v_user_id, 'Viaggi', 'Plane', '#8b5cf6', 'expense', cat_intrattenimento, true);
  
  -- Level 2: Salute children
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_farmacia, v_user_id, 'Farmacia', 'Pill', '#14b8a6', 'expense', cat_salute, true),
    (cat_visite, v_user_id, 'Visite Mediche', 'Stethoscope', '#14b8a6', 'expense', cat_salute, true),
    (cat_palestra, v_user_id, 'Palestra', 'Dumbbell', '#14b8a6', 'expense', cat_salute, true);
  
  -- Level 2: Abbonamenti children
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_streaming, v_user_id, 'Streaming', 'Tv', '#64748b', 'expense', cat_abbonamenti, true),
    (cat_telefono, v_user_id, 'Telefono', 'Smartphone', '#64748b', 'expense', cat_abbonamenti, true),
    (cat_internet, v_user_id, 'Internet', 'Wifi', '#64748b', 'expense', cat_abbonamenti, true),
    (cat_cloud, v_user_id, 'Cloud & Software', 'Zap', '#64748b', 'expense', cat_abbonamenti, true);

  -- ==========================================================================
  -- INSERT CATEGORIES - INCOME
  -- ==========================================================================
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_stipendio, v_user_id, 'Stipendio', 'DollarSign', '#22c55e', 'income', NULL, true),
    (cat_bonus, v_user_id, 'Bonus', 'Gift', '#22c55e', 'income', NULL, true),
    (cat_rimborsi, v_user_id, 'Rimborsi', 'TrendingUp', '#22c55e', 'income', NULL, true),
    (cat_freelance, v_user_id, 'Freelance', 'Briefcase', '#22c55e', 'income', NULL, true);

  -- ==========================================================================
  -- INSERT CATEGORIES - INVESTMENT
  -- ==========================================================================
  INSERT INTO public.categories (id, user_id, name, icon, color, type, parent_id, active) VALUES
    (cat_etf, v_user_id, 'ETF', 'TrendingUp', '#3b82f6', 'investment', NULL, true),
    (cat_risparmi, v_user_id, 'Conto Risparmio', 'DollarSign', '#3b82f6', 'investment', NULL, true),
    (cat_crypto, v_user_id, 'Crypto', 'Zap', '#3b82f6', 'investment', NULL, true);

  -- ==========================================================================
  -- INSERT USER SETTINGS
  -- ==========================================================================
  INSERT INTO public.user_settings (user_id, currency, theme, start_of_week, default_view, include_investments_in_expense_totals, include_group_expenses, last_sync_token)
  VALUES (v_user_id, 'EUR', 'system', 'monday', 'list', false, false, 0)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now();

  -- ==========================================================================
  -- INSERT TRANSACTIONS - 2024 & 2025
  -- ==========================================================================
  
  -- Monthly recurring: Stipendio (27 del mese)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_stipendio, 'income', 2850, '2024-01-27', 'Stipendio Gennaio'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-02-27', 'Stipendio Febbraio'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-03-27', 'Stipendio Marzo'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-04-27', 'Stipendio Aprile'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-05-27', 'Stipendio Maggio'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-06-27', 'Stipendio Giugno'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-07-27', 'Stipendio Luglio'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-08-27', 'Stipendio Agosto'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-09-27', 'Stipendio Settembre'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-10-27', 'Stipendio Ottobre'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-11-27', 'Stipendio Novembre'),
    (v_user_id, cat_stipendio, 'income', 2850, '2024-12-27', 'Stipendio Dicembre'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-01-27', 'Stipendio Gennaio (aumento)'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-02-27', 'Stipendio Febbraio'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-03-27', 'Stipendio Marzo'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-04-27', 'Stipendio Aprile'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-05-27', 'Stipendio Maggio'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-06-27', 'Stipendio Giugno'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-07-27', 'Stipendio Luglio'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-08-27', 'Stipendio Agosto'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-09-27', 'Stipendio Settembre'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-10-27', 'Stipendio Ottobre'),
    (v_user_id, cat_stipendio, 'income', 2950, '2025-11-27', 'Stipendio Novembre');

  -- Bonus (Luglio e Dicembre)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_bonus, 'income', 1500, '2024-07-15', 'Bonus semestrale'),
    (v_user_id, cat_bonus, 'income', 2000, '2024-12-20', 'Tredicesima'),
    (v_user_id, cat_bonus, 'income', 1800, '2025-07-15', 'Bonus semestrale');

  -- Freelance occasionale
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id) VALUES
    (v_user_id, cat_freelance, 'income', 500, '2024-03-10', 'Progetto web freelance', ctx_lavoro),
    (v_user_id, cat_freelance, 'income', 750, '2024-06-20', 'Consulenza IT', ctx_lavoro),
    (v_user_id, cat_freelance, 'income', 400, '2024-10-05', 'Logo design', ctx_lavoro),
    (v_user_id, cat_freelance, 'income', 600, '2025-02-15', 'Sito web piccola impresa', ctx_lavoro),
    (v_user_id, cat_freelance, 'income', 900, '2025-08-10', 'App mobile prototipo', ctx_lavoro);

  -- Rimborsi
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id) VALUES
    (v_user_id, cat_rimborsi, 'income', 120, '2024-02-15', 'Rimborso spese trasferta', ctx_lavoro),
    (v_user_id, cat_rimborsi, 'income', 85, '2024-05-20', 'Rimborso parcheggio', ctx_lavoro),
    (v_user_id, cat_rimborsi, 'income', 200, '2024-09-10', 'Rimborso formazione', ctx_lavoro),
    (v_user_id, cat_rimborsi, 'income', 150, '2025-03-25', 'Rimborso viaggio lavoro', ctx_lavoro),
    (v_user_id, cat_rimborsi, 'income', 95, '2025-07-12', 'Rimborso materiale', ctx_lavoro);

  -- Monthly recurring: Affitto (1 del mese)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_affitto, 'expense', 750, '2024-01-01', 'Affitto Gennaio'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-02-01', 'Affitto Febbraio'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-03-01', 'Affitto Marzo'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-04-01', 'Affitto Aprile'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-05-01', 'Affitto Maggio'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-06-01', 'Affitto Giugno'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-07-01', 'Affitto Luglio'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-08-01', 'Affitto Agosto'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-09-01', 'Affitto Settembre'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-10-01', 'Affitto Ottobre'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-11-01', 'Affitto Novembre'),
    (v_user_id, cat_affitto, 'expense', 750, '2024-12-01', 'Affitto Dicembre'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-01-01', 'Affitto Gennaio (rinnovo)'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-02-01', 'Affitto Febbraio'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-03-01', 'Affitto Marzo'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-04-01', 'Affitto Aprile'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-05-01', 'Affitto Maggio'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-06-01', 'Affitto Giugno'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-07-01', 'Affitto Luglio'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-08-01', 'Affitto Agosto'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-09-01', 'Affitto Settembre'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-10-01', 'Affitto Ottobre'),
    (v_user_id, cat_affitto, 'expense', 780, '2025-11-01', 'Affitto Novembre');

  -- Utenze (bimestrali)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_utenze, 'expense', 95, '2024-01-15', 'Bolletta luce'),
    (v_user_id, cat_utenze, 'expense', 65, '2024-01-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 110, '2024-03-15', 'Bolletta luce'),
    (v_user_id, cat_utenze, 'expense', 45, '2024-03-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 85, '2024-05-15', 'Bolletta luce'),
    (v_user_id, cat_utenze, 'expense', 35, '2024-05-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 120, '2024-07-15', 'Bolletta luce (AC)'),
    (v_user_id, cat_utenze, 'expense', 30, '2024-07-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 130, '2024-09-15', 'Bolletta luce'),
    (v_user_id, cat_utenze, 'expense', 40, '2024-09-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 100, '2024-11-15', 'Bolletta luce'),
    (v_user_id, cat_utenze, 'expense', 75, '2024-11-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 105, '2025-01-15', 'Bolletta luce'),
    (v_user_id, cat_utenze, 'expense', 85, '2025-01-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 98, '2025-03-15', 'Bolletta luce'),
    (v_user_id, cat_utenze, 'expense', 55, '2025-03-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 82, '2025-05-15', 'Bolletta luce'),
    (v_user_id, cat_utenze, 'expense', 32, '2025-05-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 145, '2025-07-15', 'Bolletta luce (AC)'),
    (v_user_id, cat_utenze, 'expense', 28, '2025-07-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 125, '2025-09-15', 'Bolletta luce'),
    (v_user_id, cat_utenze, 'expense', 38, '2025-09-20', 'Bolletta gas'),
    (v_user_id, cat_utenze, 'expense', 95, '2025-11-15', 'Bolletta luce');

  -- Manutenzione casa occasionale
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_manutenzione_casa, 'expense', 150, '2024-04-10', 'Idraulico - rubinetto'),
    (v_user_id, cat_manutenzione_casa, 'expense', 80, '2024-08-22', 'Sostituzione lampadine LED'),
    (v_user_id, cat_manutenzione_casa, 'expense', 250, '2025-02-18', 'Riparazione lavatrice'),
    (v_user_id, cat_manutenzione_casa, 'expense', 120, '2025-06-05', 'Manutenzione caldaia');

  -- Supermercato (settimanale, ~4 volte al mese)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_supermercato, 'expense',
    (random() * 40 + 50)::numeric(10,2),
    (date '2024-01-01' + (n * 7) * interval '1 day')::date,
    CASE (n % 4)
      WHEN 0 THEN 'Spesa settimanale Esselunga'
      WHEN 1 THEN 'Spesa settimanale Coop'
      WHEN 2 THEN 'Spesa settimanale Lidl'
      ELSE 'Spesa settimanale Carrefour'
    END
  FROM generate_series(0, 99) n
  WHERE (date '2024-01-01' + (n * 7) * interval '1 day')::date <= '2025-11-26';

  -- Mercato (mensile)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_mercato, 'expense',
    (random() * 20 + 25)::numeric(10,2),
    (date '2024-01-06' + (n * interval '1 month'))::date,
    'Mercato rionale'
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-06' + (n * interval '1 month'))::date <= '2025-11-26';

  -- Auto - Carburante (ogni 2 settimane circa)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_auto_carburante, 'expense',
    (random() * 20 + 55)::numeric(10,2),
    (date '2024-01-05' + (n * 14) * interval '1 day')::date,
    CASE (n % 3)
      WHEN 0 THEN 'Benzina Q8'
      WHEN 1 THEN 'Benzina Eni'
      ELSE 'Benzina IP'
    END
  FROM generate_series(0, 50) n
  WHERE (date '2024-01-05' + (n * 14) * interval '1 day')::date <= '2025-11-26';

  -- Auto - Manutenzione (occasionale)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_auto_manutenzione, 'expense', 350, '2024-03-20', 'Tagliando auto'),
    (v_user_id, cat_auto_manutenzione, 'expense', 180, '2024-06-15', 'Cambio gomme estive'),
    (v_user_id, cat_auto_manutenzione, 'expense', 95, '2024-09-10', 'Cambio olio'),
    (v_user_id, cat_auto_manutenzione, 'expense', 200, '2024-11-05', 'Cambio gomme invernali'),
    (v_user_id, cat_auto_manutenzione, 'expense', 380, '2025-03-18', 'Tagliando + revisione'),
    (v_user_id, cat_auto_manutenzione, 'expense', 150, '2025-06-10', 'Cambio gomme estive'),
    (v_user_id, cat_auto_manutenzione, 'expense', 280, '2025-09-22', 'Sostituzione freni');

  -- Auto - Assicurazione (annuale)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_auto_assicurazione, 'expense', 650, '2024-02-01', 'Assicurazione auto annuale'),
    (v_user_id, cat_auto_assicurazione, 'expense', 620, '2025-02-01', 'Assicurazione auto annuale');

  -- Moto - Carburante (mensile, meno dell'auto)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_moto_carburante, 'expense',
    (random() * 10 + 25)::numeric(10,2),
    (date '2024-01-12' + (n * interval '1 month'))::date,
    'Benzina moto'
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-12' + (n * interval '1 month'))::date <= '2025-11-26';

  -- Moto - Manutenzione
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_moto_manutenzione, 'expense', 180, '2024-04-15', 'Tagliando moto'),
    (v_user_id, cat_moto_manutenzione, 'expense', 220, '2024-08-20', 'Cambio gomme moto'),
    (v_user_id, cat_moto_manutenzione, 'expense', 200, '2025-04-12', 'Tagliando moto'),
    (v_user_id, cat_moto_manutenzione, 'expense', 85, '2025-09-05', 'Cambio catena');

  -- Moto - Assicurazione (annuale)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_moto_assicurazione, 'expense', 280, '2024-03-01', 'Assicurazione moto annuale'),
    (v_user_id, cat_moto_assicurazione, 'expense', 265, '2025-03-01', 'Assicurazione moto annuale');

  -- Trasporto pubblico (occasionale)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id) VALUES
    (v_user_id, cat_trasporto_pubblico, 'expense', 2.20, '2024-02-10', 'Biglietto metro', NULL),
    (v_user_id, cat_trasporto_pubblico, 'expense', 15, '2024-04-22', 'Treno regionale', ctx_lavoro),
    (v_user_id, cat_trasporto_pubblico, 'expense', 2.20, '2024-07-05', 'Biglietto bus', NULL),
    (v_user_id, cat_trasporto_pubblico, 'expense', 35, '2024-09-15', 'Frecciarossa Roma', ctx_lavoro),
    (v_user_id, cat_trasporto_pubblico, 'expense', 2.20, '2025-01-18', 'Biglietto metro', NULL),
    (v_user_id, cat_trasporto_pubblico, 'expense', 28, '2025-05-10', 'Treno Milano', ctx_lavoro),
    (v_user_id, cat_trasporto_pubblico, 'expense', 2.20, '2025-08-22', 'Biglietto bus', NULL);

  -- Pranzo fuori (2-3 volte al mese)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id)
  SELECT 
    v_user_id, cat_pranzo, 'expense',
    (random() * 8 + 12)::numeric(10,2),
    (date '2024-01-08' + (n * 12) * interval '1 day')::date,
    CASE (n % 4)
      WHEN 0 THEN 'Pranzo lavoro'
      WHEN 1 THEN 'Pausa pranzo'
      WHEN 2 THEN 'Pranzo veloce'
      ELSE 'Panino bar'
    END,
    CASE WHEN n % 3 = 0 THEN ctx_lavoro ELSE NULL END
  FROM generate_series(0, 60) n
  WHERE (date '2024-01-08' + (n * 12) * interval '1 day')::date <= '2025-11-26';

  -- Cena fuori (1-2 volte al mese)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id)
  SELECT 
    v_user_id, cat_cena, 'expense',
    (random() * 25 + 30)::numeric(10,2),
    (date '2024-01-15' + (n * 20) * interval '1 day')::date,
    CASE (n % 5)
      WHEN 0 THEN 'Cena pizzeria'
      WHEN 1 THEN 'Cena sushi'
      WHEN 2 THEN 'Cena trattoria'
      WHEN 3 THEN 'Cena ristorante'
      ELSE 'Cena anniversario'
    END,
    CASE WHEN n % 4 = 0 THEN ctx_famiglia ELSE NULL END
  FROM generate_series(0, 35) n
  WHERE (date '2024-01-15' + (n * 20) * interval '1 day')::date <= '2025-11-26';

  -- Aperitivo (1-2 volte al mese)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_aperitivo, 'expense',
    (random() * 8 + 10)::numeric(10,2),
    (date '2024-01-19' + (n * 18) * interval '1 day')::date,
    CASE (n % 3)
      WHEN 0 THEN 'Aperitivo con amici'
      WHEN 1 THEN 'Spritz centro'
      ELSE 'Happy hour'
    END
  FROM generate_series(0, 40) n
  WHERE (date '2024-01-19' + (n * 18) * interval '1 day')::date <= '2025-11-26';

  -- Delivery (2-3 volte al mese)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_delivery, 'expense',
    (random() * 12 + 18)::numeric(10,2),
    (date '2024-01-11' + (n * 14) * interval '1 day')::date,
    CASE (n % 5)
      WHEN 0 THEN 'Deliveroo pizza'
      WHEN 1 THEN 'Just Eat sushi'
      WHEN 2 THEN 'Glovo hamburger'
      WHEN 3 THEN 'Deliveroo thai'
      ELSE 'Just Eat cinese'
    END
  FROM generate_series(0, 50) n
  WHERE (date '2024-01-11' + (n * 14) * interval '1 day')::date <= '2025-11-26';

  -- Cinema (mensile)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_cinema, 'expense',
    (random() * 5 + 10)::numeric(10,2),
    (date '2024-01-20' + (n * interval '1 month'))::date,
    'Cinema'
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-20' + (n * interval '1 month'))::date <= '2025-11-26';

  -- Concerti & Eventi (occasionale)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_concerti, 'expense', 55, '2024-03-15', 'Concerto teatro'),
    (v_user_id, cat_concerti, 'expense', 85, '2024-06-22', 'Festival estivo'),
    (v_user_id, cat_concerti, 'expense', 45, '2024-10-10', 'Stand-up comedy'),
    (v_user_id, cat_concerti, 'expense', 120, '2025-02-28', 'Concerto arena'),
    (v_user_id, cat_concerti, 'expense', 75, '2025-07-05', 'Festival musica'),
    (v_user_id, cat_concerti, 'expense', 35, '2025-10-18', 'Teatro');

  -- Sport & Hobby
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_sport, 'expense', 45, '2024-02-10', 'Attrezzatura running'),
    (v_user_id, cat_sport, 'expense', 30, '2024-05-18', 'Pallone calcetto'),
    (v_user_id, cat_sport, 'expense', 85, '2024-09-05', 'Scarpe trekking'),
    (v_user_id, cat_sport, 'expense', 120, '2025-01-15', 'Racchetta padel'),
    (v_user_id, cat_sport, 'expense', 55, '2025-06-20', 'Abbigliamento sportivo'),
    (v_user_id, cat_sport, 'expense', 25, '2025-09-10', 'Palline padel');

  -- Abbigliamento (bimestrale)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_abbigliamento, 'expense',
    (random() * 60 + 40)::numeric(10,2),
    (date '2024-01-25' + (n * interval '2 months'))::date,
    CASE (n % 4)
      WHEN 0 THEN 'Magliette Zara'
      WHEN 1 THEN 'Jeans H&M'
      WHEN 2 THEN 'Giacca invernale'
      ELSE 'Scarpe casual'
    END
  FROM generate_series(0, 11) n
  WHERE (date '2024-01-25' + (n * interval '2 months'))::date <= '2025-11-26';

  -- Farmacia (mensile)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_farmacia, 'expense',
    (random() * 20 + 15)::numeric(10,2),
    (date '2024-01-10' + (n * interval '1 month'))::date,
    CASE (n % 3)
      WHEN 0 THEN 'Vitamine'
      WHEN 1 THEN 'Medicinali vari'
      ELSE 'Integratori'
    END
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-10' + (n * interval '1 month'))::date <= '2025-11-26';

  -- Visite Mediche (occasionale)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_visite, 'expense', 120, '2024-02-20', 'Visita dentista'),
    (v_user_id, cat_visite, 'expense', 80, '2024-06-10', 'Visita oculista'),
    (v_user_id, cat_visite, 'expense', 150, '2024-10-25', 'Visita dermatologo'),
    (v_user_id, cat_visite, 'expense', 100, '2025-03-15', 'Pulizia dentale'),
    (v_user_id, cat_visite, 'expense', 90, '2025-07-20', 'Controllo generale'),
    (v_user_id, cat_visite, 'expense', 130, '2025-11-05', 'Visita specialistica');

  -- Palestra (mensile)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_palestra, 'expense',
    45,
    (date '2024-01-05' + (n * interval '1 month'))::date,
    'Abbonamento palestra'
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-05' + (n * interval '1 month'))::date <= '2025-11-26';

  -- Abbonamenti fissi mensili
  -- Streaming
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_streaming, 'expense',
    12.99,
    (date '2024-01-08' + (n * interval '1 month'))::date,
    'Netflix'
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-08' + (n * interval '1 month'))::date <= '2025-11-26';

  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_streaming, 'expense',
    5.99,
    (date '2024-01-08' + (n * interval '1 month'))::date,
    'Spotify'
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-08' + (n * interval '1 month'))::date <= '2025-11-26';

  -- Telefono
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_telefono, 'expense',
    9.99,
    (date '2024-01-10' + (n * interval '1 month'))::date,
    'Iliad mobile'
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-10' + (n * interval '1 month'))::date <= '2025-11-26';

  -- Internet
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_internet, 'expense',
    29.90,
    (date '2024-01-12' + (n * interval '1 month'))::date,
    'Fibra casa'
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-12' + (n * interval '1 month'))::date <= '2025-11-26';

  -- Cloud & Software (annuale, pagato a gennaio)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_cloud, 'expense', 99, '2024-01-15', 'iCloud annuale'),
    (v_user_id, cat_cloud, 'expense', 36, '2024-01-15', 'Google One annuale'),
    (v_user_id, cat_cloud, 'expense', 99, '2025-01-15', 'iCloud annuale'),
    (v_user_id, cat_cloud, 'expense', 36, '2025-01-15', 'Google One annuale');

  -- ==========================================================================
  -- VACANZA AGOSTO 2024 (2 settimane in Sardegna)
  -- ==========================================================================
  
  -- Volo
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id) VALUES
    (v_user_id, cat_viaggi, 'expense', 180, '2024-08-01', 'Volo A/R Sardegna', ctx_vacanze);
  
  -- Alloggio  
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id) VALUES
    (v_user_id, cat_viaggi, 'expense', 850, '2024-08-01', 'Airbnb 2 settimane Costa Smeralda', ctx_vacanze);
  
  -- Noleggio auto
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id) VALUES
    (v_user_id, cat_viaggi, 'expense', 420, '2024-08-01', 'Noleggio auto 14 giorni', ctx_vacanze);
  
  -- Spese giornaliere vacanza
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id) VALUES
    -- Giorno 1-2: Arrivo
    (v_user_id, cat_cena, 'expense', 65, '2024-08-01', 'Cena arrivo ristorante sul mare', ctx_vacanze),
    (v_user_id, cat_supermercato, 'expense', 85, '2024-08-02', 'Spesa vacanza', ctx_vacanze),
    (v_user_id, cat_pranzo, 'expense', 35, '2024-08-02', 'Pranzo spiaggia', ctx_vacanze),
    
    -- Giorno 3-4: Spiaggia
    (v_user_id, cat_pranzo, 'expense', 28, '2024-08-03', 'Panino bar spiaggia', ctx_vacanze),
    (v_user_id, cat_aperitivo, 'expense', 22, '2024-08-03', 'Aperitivo tramonto', ctx_vacanze),
    (v_user_id, cat_cena, 'expense', 55, '2024-08-04', 'Cena pizzeria', ctx_vacanze),
    (v_user_id, cat_auto_carburante, 'expense', 45, '2024-08-04', 'Benzina auto noleggio', ctx_vacanze),
    
    -- Giorno 5-6: Escursione
    (v_user_id, cat_viaggi, 'expense', 80, '2024-08-05', 'Gita in barca', ctx_vacanze),
    (v_user_id, cat_pranzo, 'expense', 42, '2024-08-05', 'Pranzo isola', ctx_vacanze),
    (v_user_id, cat_cena, 'expense', 70, '2024-08-06', 'Cena pesce fresco', ctx_vacanze),
    
    -- Giorno 7-8: Relax
    (v_user_id, cat_pranzo, 'expense', 25, '2024-08-07', 'Piadina spiaggia', ctx_vacanze),
    (v_user_id, cat_supermercato, 'expense', 55, '2024-08-07', 'Spesa settimanale', ctx_vacanze),
    (v_user_id, cat_aperitivo, 'expense', 30, '2024-08-08', 'Aperitivo Porto Cervo', ctx_vacanze),
    (v_user_id, cat_cena, 'expense', 85, '2024-08-08', 'Cena ristorante tipico', ctx_vacanze),
    
    -- Giorno 9-10: Trekking
    (v_user_id, cat_pranzo, 'expense', 20, '2024-08-09', 'Pranzo al sacco', ctx_vacanze),
    (v_user_id, cat_auto_carburante, 'expense', 40, '2024-08-09', 'Benzina', ctx_vacanze),
    (v_user_id, cat_cena, 'expense', 48, '2024-08-10', 'Cena agriturismo', ctx_vacanze),
    
    -- Giorno 11-12: Spiagge Sud
    (v_user_id, cat_pranzo, 'expense', 38, '2024-08-11', 'Pranzo chiosco', ctx_vacanze),
    (v_user_id, cat_viaggi, 'expense', 25, '2024-08-11', 'Lettini ombrellone', ctx_vacanze),
    (v_user_id, cat_cena, 'expense', 52, '2024-08-12', 'Cena trattoria', ctx_vacanze),
    (v_user_id, cat_aperitivo, 'expense', 18, '2024-08-12', 'Gelato artigianale', ctx_vacanze),
    
    -- Giorno 13-14: Ultimi giorni
    (v_user_id, cat_supermercato, 'expense', 35, '2024-08-13', 'Ultime provviste', ctx_vacanze),
    (v_user_id, cat_pranzo, 'expense', 32, '2024-08-13', 'Pranzo vista mare', ctx_vacanze),
    (v_user_id, cat_abbigliamento, 'expense', 45, '2024-08-13', 'Souvenir e regali', ctx_vacanze),
    (v_user_id, cat_auto_carburante, 'expense', 50, '2024-08-14', 'Pieno finale', ctx_vacanze),
    (v_user_id, cat_cena, 'expense', 75, '2024-08-14', 'Cena ultima sera', ctx_vacanze);

  -- ==========================================================================
  -- INVESTMENTS (mensili)
  -- ==========================================================================
  
  -- ETF (mensile, PAC)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description)
  SELECT 
    v_user_id, cat_etf, 'investment',
    200,
    (date '2024-01-03' + (n * interval '1 month'))::date,
    'PAC ETF MSCI World'
  FROM generate_series(0, 22) n
  WHERE (date '2024-01-03' + (n * interval '1 month'))::date <= '2025-11-26';

  -- Conto Risparmio (ogni 2-3 mesi)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_risparmi, 'investment', 500, '2024-02-15', 'Versamento conto risparmio'),
    (v_user_id, cat_risparmi, 'investment', 400, '2024-05-10', 'Versamento conto risparmio'),
    (v_user_id, cat_risparmi, 'investment', 600, '2024-08-20', 'Versamento conto risparmio'),
    (v_user_id, cat_risparmi, 'investment', 500, '2024-11-15', 'Versamento conto risparmio'),
    (v_user_id, cat_risparmi, 'investment', 700, '2025-01-20', 'Versamento conto risparmio'),
    (v_user_id, cat_risparmi, 'investment', 450, '2025-04-12', 'Versamento conto risparmio'),
    (v_user_id, cat_risparmi, 'investment', 550, '2025-07-18', 'Versamento conto risparmio'),
    (v_user_id, cat_risparmi, 'investment', 600, '2025-10-25', 'Versamento conto risparmio');

  -- Crypto (occasionale)
  INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) VALUES
    (v_user_id, cat_crypto, 'investment', 100, '2024-01-20', 'Acquisto BTC'),
    (v_user_id, cat_crypto, 'investment', 150, '2024-04-15', 'Acquisto ETH'),
    (v_user_id, cat_crypto, 'investment', 200, '2024-09-10', 'Acquisto BTC'),
    (v_user_id, cat_crypto, 'investment', 100, '2025-02-05', 'Acquisto ETH'),
    (v_user_id, cat_crypto, 'investment', 250, '2025-06-20', 'Acquisto BTC');

  RAISE NOTICE 'Seed data inserted successfully!';
  
END $$;

-- Verify counts
SELECT 'Categories' as table_name, COUNT(*) as count FROM public.categories
UNION ALL
SELECT 'Contexts', COUNT(*) FROM public.contexts
UNION ALL
SELECT 'Transactions', COUNT(*) FROM public.transactions;
