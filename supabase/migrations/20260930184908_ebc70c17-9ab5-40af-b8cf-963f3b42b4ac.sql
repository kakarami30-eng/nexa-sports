ALTER FUNCTION public.sync_swimmer_public_card() SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.sync_swimmer_public_card() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_swimmer_public_card() TO service_role;