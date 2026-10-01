DROP FUNCTION public.get_public_swimmer_card(uuid);

GRANT SELECT ON public.swimmer_public_cards TO anon, authenticated;
GRANT ALL ON public.swimmer_public_cards TO service_role;
ALTER TABLE public.swimmer_public_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read safe swimmer cards" ON public.swimmer_public_cards FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_swimmer_public_card()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  latest_status text;
  latest_expiry date;
BEGIN
  IF TG_TABLE_NAME = 'swimmers' THEN
    IF TG_OP = 'DELETE' THEN
      DELETE FROM public.swimmer_public_cards WHERE id = OLD.id::text;
      RETURN OLD;
    END IF;
    SELECT p.status, p.expires_at INTO latest_status, latest_expiry
    FROM public.payments p WHERE p.swimmer_id = NEW.id
    ORDER BY p.paid_at DESC, p.created_at DESC LIMIT 1;
    INSERT INTO public.swimmer_public_cards(id, name_ar, name_fr, photo, subscription_status, expires_at, edit_token_hash)
    VALUES (NEW.id::text, NEW.name_ar, NEW.name_fr, NEW.photo,
      CASE WHEN latest_status = 'paid' AND latest_expiry >= CURRENT_DATE THEN 'active' ELSE 'expired' END,
      latest_expiry, encode(digest(NEW.id::text, 'sha256'), 'hex'))
    ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_fr = EXCLUDED.name_fr,
      photo = EXCLUDED.photo, subscription_status = EXCLUDED.subscription_status,
      expires_at = EXCLUDED.expires_at, updated_at = now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    SELECT p.status, p.expires_at INTO latest_status, latest_expiry
    FROM public.payments p WHERE p.swimmer_id = OLD.swimmer_id
    ORDER BY p.paid_at DESC, p.created_at DESC LIMIT 1;
    UPDATE public.swimmer_public_cards SET
      subscription_status = CASE WHEN latest_status = 'paid' AND latest_expiry >= CURRENT_DATE THEN 'active' ELSE 'expired' END,
      expires_at = latest_expiry, updated_at = now()
    WHERE id = OLD.swimmer_id::text;
    RETURN OLD;
  END IF;

  SELECT p.status, p.expires_at INTO latest_status, latest_expiry
  FROM public.payments p WHERE p.swimmer_id = NEW.swimmer_id
  ORDER BY p.paid_at DESC, p.created_at DESC LIMIT 1;
  UPDATE public.swimmer_public_cards SET
    subscription_status = CASE WHEN latest_status = 'paid' AND latest_expiry >= CURRENT_DATE THEN 'active' ELSE 'expired' END,
    expires_at = latest_expiry, updated_at = now()
  WHERE id = NEW.swimmer_id::text;
  RETURN NEW;
END;
$$;
CREATE TRIGGER sync_swimmer_card AFTER INSERT OR UPDATE OR DELETE ON public.swimmers FOR EACH ROW EXECUTE FUNCTION public.sync_swimmer_public_card();
CREATE TRIGGER sync_payment_card AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.sync_swimmer_public_card();