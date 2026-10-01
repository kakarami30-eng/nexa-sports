CREATE TABLE public.swimmer_public_cards (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  name_fr text NOT NULL DEFAULT '',
  photo text,
  subscription_status text NOT NULL DEFAULT 'none' CHECK (subscription_status IN ('paid', 'unpaid', 'late', 'none')),
  expires_at date,
  edit_token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.swimmer_public_cards TO anon, authenticated;
GRANT ALL ON public.swimmer_public_cards TO service_role;
ALTER TABLE public.swimmer_public_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public QR cards are readable"
ON public.swimmer_public_cards
FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.save_swimmer_public_card(
  p_id text,
  p_name_ar text,
  p_name_fr text,
  p_photo text,
  p_subscription_status text,
  p_expires_at date,
  p_edit_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text := encode(extensions.digest(p_edit_token, 'sha256'), 'hex');
BEGIN
  IF p_id IS NULL OR length(p_id) < 8 OR p_edit_token IS NULL OR length(p_edit_token) < 24 THEN
    RAISE EXCEPTION 'Invalid card credentials';
  END IF;
  IF p_subscription_status NOT IN ('paid', 'unpaid', 'late', 'none') THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;

  INSERT INTO public.swimmer_public_cards (
    id, name_ar, name_fr, photo, subscription_status, expires_at, edit_token_hash
  ) VALUES (
    p_id, p_name_ar, COALESCE(p_name_fr, ''), p_photo, p_subscription_status, p_expires_at, v_hash
  )
  ON CONFLICT (id) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_fr = EXCLUDED.name_fr,
    photo = EXCLUDED.photo,
    subscription_status = EXCLUDED.subscription_status,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  WHERE swimmer_public_cards.edit_token_hash = v_hash;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card update denied';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_swimmer_public_card(p_id text, p_edit_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.swimmer_public_cards
  WHERE id = p_id
    AND edit_token_hash = encode(extensions.digest(p_edit_token, 'sha256'), 'hex');
END;
$$;

REVOKE ALL ON FUNCTION public.save_swimmer_public_card(text, text, text, text, text, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_swimmer_public_card(text, text, text, text, text, date, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_swimmer_public_card(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_swimmer_public_card(text, text) TO anon, authenticated;