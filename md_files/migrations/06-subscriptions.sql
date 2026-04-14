-- Table: public.subscriptions
-- Create sequence first if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS subscriptions_id_seq START 1;

CREATE TABLE IF NOT EXISTS public.subscriptions
(
    id integer NOT NULL DEFAULT nextval('subscriptions_id_seq'::regclass),
    user_id integer NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    monthly_price numeric(10,2) NOT NULL,
    billing_day smallint NOT NULL,
    category character varying(100) COLLATE pg_catalog."default" DEFAULT 'Diğer'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

ALTER TABLE IF EXISTS public.subscriptions
    OWNER to postgres;
-- Index: idx_subscriptions_user_billing_day

-- DROP INDEX IF EXISTS public.idx_subscriptions_user_billing_day;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_billing_day
    ON public.subscriptions USING btree
    (user_id ASC NULLS LAST, billing_day ASC NULLS LAST);
-- Index: idx_subscriptions_user_id

-- DROP INDEX IF EXISTS public.idx_subscriptions_user_id;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
    ON public.subscriptions USING btree
    (user_id ASC NULLS LAST);