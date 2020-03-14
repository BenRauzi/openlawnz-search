DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'search') LOOP
        EXECUTE 'DROP TABLE IF EXISTS search.'|| QUOTE_IDENT(r.tablename) || ' cascade;'; 
    END LOOP;
END $$;

CREATE SCHEMA IF NOT EXISTS search;