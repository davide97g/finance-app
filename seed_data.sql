-- ============================================================================
-- SEED DATA SCRIPT
-- ============================================================================

-- Clean up existing data (optional, be careful in production!)
-- TRUNCATE public.transactions, public.recurring_transactions, public.category_budgets, public.categories, public.contexts, public.group_members, public.groups, public.user_settings, public.profiles CASCADE;
-- DELETE FROM auth.users;

DO $$
DECLARE
  -- User IDs
  user_a_id uuid := 'b71c594d-0f53-4408-873f-d210c53bd7aa';
  user_b_id uuid := 'b74f26db-c1cd-45c9-8e2e-56221e42506e';
  
  -- Group IDs
  group_ab_id uuid := uuid_generate_v4(); -- Shared A & B
  group_abc_id uuid := uuid_generate_v4(); -- Shared A & B & Guest
  
  -- Member IDs (we need these for transactions)
  member_a_ab_id uuid := uuid_generate_v4();
  member_b_ab_id uuid := uuid_generate_v4();
  
  member_a_abc_id uuid := uuid_generate_v4();
  member_b_abc_id uuid := uuid_generate_v4();
  member_guest_abc_id uuid := uuid_generate_v4(); -- The Guest
  
  -- Category IDs (A)
  cat_a_food uuid := uuid_generate_v4();
  cat_a_transp uuid := uuid_generate_v4();
  cat_a_salary uuid := uuid_generate_v4();
  cat_a_invest uuid := uuid_generate_v4();
  
  -- Category IDs (B)
  cat_b_food uuid := uuid_generate_v4();
  cat_b_fun uuid := uuid_generate_v4();
  
  -- Shared Category IDs (Group AB)
  cat_ab_groceries uuid := uuid_generate_v4();
  cat_ab_rent uuid := uuid_generate_v4();
  
  -- Shared Category IDs (Group ABC)
  cat_abc_trip uuid := uuid_generate_v4();
  cat_abc_dinner uuid := uuid_generate_v4();
  
  -- Context IDs
  ctx_a_work uuid := uuid_generate_v4();
  ctx_a_trip uuid := uuid_generate_v4();
  
  -- Dates
  date_today date := CURRENT_DATE;
  i integer;
  
BEGIN

  -- 1. Create Auth Users (We insert directly into auth.users provided we have permissions)
  -- Password for both is 'password123' (hashed usually, but here we just mock existence for FKs)
  -- NOTE: In a real Supabase instance, you might not be able to insert into auth.users easily from SQL editor without being postgres role.
  -- Assuming this runs in a local dev env or with sufficient privs.
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_a_id) THEN
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (user_a_id, 'authenticated', 'authenticated', 'alice@example.com', 'scrypt_hash_placeholder', now(), '{"full_name": "Alice Wonderland", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice"}');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_b_id) THEN
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (user_b_id, 'authenticated', 'authenticated', 'bob@example.com', 'scrypt_hash_placeholder', now(), '{"full_name": "Bob Builder", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob"}');
  END IF;

  -- 2. User Settings
  INSERT INTO public.user_settings (user_id, currency, language) VALUES (user_a_id, 'EUR', 'en') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_settings (user_id, currency, language) VALUES (user_b_id, 'USD', 'en') ON CONFLICT DO NOTHING;

  -- 3. Categories (Personal)
  INSERT INTO public.categories (id, user_id, group_id, name, icon, color, type) VALUES
    (cat_a_food, user_a_id, NULL, 'Food', 'Utensils', '#EF4444', 'expense'),
    (cat_a_transp, user_a_id, NULL, 'Transport', 'Car', '#3B82F6', 'expense'),
    (cat_a_salary, user_a_id, NULL, 'Salary', 'Wallet', '#10B981', 'income'),
    (cat_a_invest, user_a_id, NULL, 'Crypto', 'Bitcoin', '#8B5CF6', 'investment'),
    
    (cat_b_food, user_b_id, NULL, 'Food', 'Utensils', '#EF4444', 'expense'),
    (cat_b_fun, user_b_id, NULL, 'Fun', 'PartyPopper', '#F59E0B', 'expense');

  -- 4. Contexts
  INSERT INTO public.contexts (id, user_id, name, description) VALUES
    (ctx_a_work, user_a_id, 'Work', 'Office expenses'),
    (ctx_a_trip, user_a_id, 'Paris Trip', 'Holiday 2024');

  -- 5. Groups
  INSERT INTO public.groups (id, name, description, created_by) VALUES
    (group_ab_id, 'Alice & Bob Home', 'Household expenses', user_a_id),
    (group_abc_id, 'Roadtrip 2024', 'Summer vacation', user_a_id);

  -- 6. Group Members
  -- Group AB
  INSERT INTO public.group_members (id, group_id, user_id, share) VALUES
    (member_a_ab_id, group_ab_id, user_a_id, 60), -- Alice pays 60%
    (member_b_ab_id, group_ab_id, user_b_id, 40); -- Bob pays 40%

  -- Group ABC (Alice, Bob, Guest "Charlie")
  INSERT INTO public.group_members (id, group_id, user_id, guest_name, is_guest, share) VALUES
    (member_a_abc_id, group_abc_id, user_a_id, NULL, false, 33.33),
    (member_b_abc_id, group_abc_id, user_b_id, NULL, false, 33.33),
    (member_guest_abc_id, group_abc_id, NULL, 'Charlie Mock', true, 33.34);

  -- 7. Categories (Group)
  INSERT INTO public.categories (id, user_id, group_id, name, icon, color, type) VALUES
    (cat_ab_groceries, user_a_id, group_ab_id, 'Groceries', 'ShoppingCart', '#10B981', 'expense'),
    (cat_ab_rent, user_a_id, group_ab_id, 'Rent', 'Home', '#6366F1', 'expense'),
    (cat_abc_trip, user_a_id, group_abc_id, 'Travel', 'Plane', '#3B82F6', 'expense'),
    (cat_abc_dinner, user_a_id, group_abc_id, 'Restaurants', 'Utensils', '#EF4444', 'expense');
    
    
  -- 8. Recurring Transactions
  -- Rent (Paid by Alice in Group AB)
  INSERT INTO public.recurring_transactions (user_id, group_id, paid_by_member_id, type, category_id, amount, description, frequency, start_date) VALUES
  (user_a_id, group_ab_id, member_a_ab_id, 'expense', cat_ab_rent, 1200.00, 'Monthly Rent', 'monthly', '2024-01-01');

  -- Netflix (Personal Alice)
  INSERT INTO public.recurring_transactions (user_id, group_id, paid_by_member_id, type, category_id, amount, description, frequency, start_date) VALUES
  (user_a_id, NULL, NULL, 'expense', cat_a_transp, 15.99, 'Netflix Sub', 'monthly', '2024-01-01');


  -- 9. GENERATE 30 TRANSACTIONS FOR ALICE (Mixed)
  FOR i IN 1..10 LOOP
    -- Personal Expense
    INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) 
    VALUES (user_a_id, cat_a_food, 'expense', (random() * 50 + 5)::numeric(10,2), date_today - (i * 2), 'Lunch #' || i);
    
    -- Personal Income
    IF i % 5 = 0 THEN
      INSERT INTO public.transactions (user_id, category_id, type, amount, date, description) 
      VALUES (user_a_id, cat_a_salary, 'income', 2500.00, date_today - (i * 2), 'Salary Payment');
    END IF;
    
    -- Investment
    IF i % 8 = 0 THEN
      INSERT INTO public.transactions (user_id, category_id, type, amount, date, description, context_id) 
      VALUES (user_a_id, cat_a_invest, 'investment', 100.00, date_today - (i * 2), 'Bitcoin Buy', ctx_a_work);
    END IF;
  END LOOP;
  
  -- 10. GENERATE 20 GROUP TRANSACTIONS FOR GROUP AB (Alice vs Bob)
  FOR i IN 1..10 LOOP
    -- Paid by Alice
    INSERT INTO public.transactions (user_id, group_id, paid_by_member_id, category_id, type, amount, date, description) 
    VALUES (user_a_id, group_ab_id, member_a_ab_id, cat_ab_groceries, 'expense', (random() * 100 + 20)::numeric(10,2), date_today - (i * 3), 'Groceries A');
    
    -- Paid by Bob (Created by Bob, but inserted by script logic)
    INSERT INTO public.transactions (user_id, group_id, paid_by_member_id, category_id, type, amount, date, description) 
    VALUES (user_b_id, group_ab_id, member_b_ab_id, cat_ab_groceries, 'expense', (random() * 100 + 20)::numeric(10,2), date_today - (i * 3 + 1), 'Groceries B');
  END LOOP;
  
  -- 11. GENERATE 15 GROUP TRANSACTIONS FOR GROUP ABC (With Guest)
  FOR i IN 1..5 LOOP
    -- Paid by Guest Charlie
    INSERT INTO public.transactions (user_id, group_id, paid_by_member_id, category_id, type, amount, date, description, context_id) 
    VALUES (user_a_id, group_abc_id, member_guest_abc_id, cat_abc_dinner, 'expense', (random() * 200 + 50)::numeric(10,2), date_today - (i * 5), 'Dinner paid by Charlie', ctx_a_trip);
    
    -- Paid by Alice
    INSERT INTO public.transactions (user_id, group_id, paid_by_member_id, category_id, type, amount, date, description) 
    VALUES (user_a_id, group_abc_id, member_a_abc_id, cat_abc_trip, 'expense', 50.00, date_today - (i * 5 + 2), 'Ticket A');
    
    -- Paid by Bob
    INSERT INTO public.transactions (user_id, group_id, paid_by_member_id, category_id, type, amount, date, description) 
    VALUES (user_b_id, group_abc_id, member_b_abc_id, cat_abc_trip, 'expense', 50.00, date_today - (i * 5 + 2), 'Ticket B');
  END LOOP;

END $$;
