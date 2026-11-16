-- Read-only audit of callable SECURITY DEFINER functions involved in household sharing.
-- Review every row before enabling sharing. This query does not prove that
-- authorization checks inside the function are correct.
select n.nspname as function_schema,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_userbyid(p.proowner) as owner_name,
       p.prosecdef as security_definer,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       coalesce(array_to_string(p.proconfig, ', '), '<unset>') as function_settings,
       case when p.prosecdef and not exists (
         select 1 from unnest(coalesce(p.proconfig,array[]::text[])) setting
         where setting like 'search_path=%'
       ) then 'REVIEW_MISSING_FIXED_SEARCH_PATH'
       when p.prosecdef and has_function_privilege('anon',p.oid,'EXECUTE')
         then 'REVIEW_ANON_EXECUTE'
       when p.prosecdef and has_function_privilege('authenticated',p.oid,'EXECUTE')
         then 'REVIEW_AUTHENTICATED_EXECUTE'
       else 'INFORMATIONAL' end as finding
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and (p.proname ilike '%household%'
       or p.proname ilike '%membership%'
       or p.proname ilike '%invitation%'
       or p.proname ilike '%shared%')
order by finding,function_name,arguments;
