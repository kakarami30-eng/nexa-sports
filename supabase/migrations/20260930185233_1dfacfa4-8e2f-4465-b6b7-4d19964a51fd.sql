ALTER TABLE public.swimmers ADD COLUMN legacy_qr_id text UNIQUE;
CREATE OR REPLACE FUNCTION public.sync_swimmer_public_card()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  latest_status text;
  latest_expiry date;
  card_id text;
BEGIN
  IF TG_TABLE_NAME = 'swimmers' THEN
    IF TG_OP = 'DELETE' THEN
      DELETE FROM public.swimmer_public_cards WHERE id IN (OLD.id::text, COALESCE(OLD.legacy_qr_id, OLD.id::text));
      RETURN OLD;
    END IF;
    card_id := COALESCE(NEW.legacy_qr_id, NEW.id::text);
    SELECT p.status, p.expires_at INTO latest_status, latest_expiry FROM public.payments p WHERE p.swimmer_id = NEW.id ORDER BY p.paid_at DESC, p.created_at DESC LIMIT 1;
    INSERT INTO public.swimmer_public_cards(id, name_ar, name_fr, photo, subscription_status, expires_at, edit_token_hash)
    VALUES (card_id, NEW.name_ar, NEW.name_fr, NEW.photo, CASE WHEN latest_status = 'paid' AND latest_expiry >= CURRENT_DATE THEN 'active' ELSE 'expired' END, latest_expiry, encode(digest(NEW.id::text, 'sha256'), 'hex'))
    ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_fr = EXCLUDED.name_fr, photo = EXCLUDED.photo, subscription_status = EXCLUDED.subscription_status, expires_at = EXCLUDED.expires_at, updated_at = now();
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(s.legacy_qr_id, s.id::text) INTO card_id FROM public.swimmers s WHERE s.id = OLD.swimmer_id;
    SELECT p.status, p.expires_at INTO latest_status, latest_expiry FROM public.payments p WHERE p.swimmer_id = OLD.swimmer_id ORDER BY p.paid_at DESC, p.created_at DESC LIMIT 1;
    UPDATE public.swimmer_public_cards SET subscription_status = CASE WHEN latest_status = 'paid' AND latest_expiry >= CURRENT_DATE THEN 'active' ELSE 'expired' END, expires_at = latest_expiry, updated_at = now() WHERE id = card_id;
    RETURN OLD;
  END IF;
  SELECT COALESCE(s.legacy_qr_id, s.id::text) INTO card_id FROM public.swimmers s WHERE s.id = NEW.swimmer_id;
  SELECT p.status, p.expires_at INTO latest_status, latest_expiry FROM public.payments p WHERE p.swimmer_id = NEW.swimmer_id ORDER BY p.paid_at DESC, p.created_at DESC LIMIT 1;
  UPDATE public.swimmer_public_cards SET subscription_status = CASE WHEN latest_status = 'paid' AND latest_expiry >= CURRENT_DATE THEN 'active' ELSE 'expired' END, expires_at = latest_expiry, updated_at = now() WHERE id = card_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_swimmer_public_card() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_swimmer_public_card() TO service_role;