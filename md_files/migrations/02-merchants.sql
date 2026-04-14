-- Table: public.merchants
-- Create sequence first if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS merchants_id_seq START 1;

CREATE TABLE IF NOT EXISTS public.merchants
(
    id integer NOT NULL DEFAULT nextval('merchants_id_seq'::regclass),
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    branch character varying(255) COLLATE pg_catalog."default",
    address text COLLATE pg_catalog."default",
    tax_number character varying(50) COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT merchants_pkey PRIMARY KEY (id),
    CONSTRAINT merchants_tax_number_key UNIQUE (tax_number)
);

ALTER TABLE IF EXISTS public.merchants
    OWNER to postgres;