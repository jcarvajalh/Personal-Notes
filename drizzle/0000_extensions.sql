-- Custom SQL migration file, put your code below! --

-- Extensiones requeridas (sección 5.1 / 6).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Wrapper IMMUTABLE de unaccent necesario para la columna generada
-- pages.search_vector (sección 6.5). unaccent() por defecto es STABLE y no
-- puede usarse en columnas generadas ni en índices de expresión.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  STRICT
  PARALLEL SAFE
AS $$
  SELECT public.unaccent('public.unaccent'::regdictionary, $1);
$$;