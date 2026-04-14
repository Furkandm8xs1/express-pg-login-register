-- Table: public.receipts
-- Create sequence first if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS receipts_id_seq START 1;

CREATE TABLE IF NOT EXISTS public.receipts
(
    id integer NOT NULL DEFAULT nextval('receipts_id_seq'::regclass),
    user_id integer NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    purchase_date date,
    image_url character varying(500) COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    image_path character varying(500) COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    sector character varying(100) COLLATE pg_catalog."default" DEFAULT 'Diğer'::character varying,
    notes text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    merchant_id integer,
    transaction_date date,
    transaction_time time without time zone,
    receipt_no character varying(100) COLLATE pg_catalog."default",
    total_tax numeric(12,2) DEFAULT 0,
    payment_method character varying(50) COLLATE pg_catalog."default" DEFAULT 'Nakit'::character varying,
    raw_api_response jsonb,
    CONSTRAINT receipts_pkey PRIMARY KEY (id),
    CONSTRAINT receipts_merchant_fk FOREIGN KEY (merchant_id)
        REFERENCES public.merchants (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT receipts_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT receipts_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

ALTER TABLE IF EXISTS public.receipts
    OWNER to postgres;
-- Index: idx_receipts_sector

-- DROP INDEX IF EXISTS public.idx_receipts_sector;

CREATE INDEX IF NOT EXISTS idx_receipts_sector
    ON public.receipts USING btree
    (sector COLLATE pg_catalog."default" ASC NULLS LAST);
-- Index: idx_receipts_user_date

-- DROP INDEX IF EXISTS public.idx_receipts_user_date;

CREATE INDEX IF NOT EXISTS idx_receipts_user_date
    ON public.receipts USING btree
    (user_id ASC NULLS LAST, purchase_date ASC NULLS LAST);
-- Index: idx_receipts_user_id

-- DROP INDEX IF EXISTS public.idx_receipts_user_id;

CREATE INDEX IF NOT EXISTS idx_receipts_user_id
    ON public.receipts USING btree
    (user_id ASC NULLS LAST);
-- Index: idx_receipts_user_sector

-- DROP INDEX IF EXISTS public.idx_receipts_user_sector;

CREATE INDEX IF NOT EXISTS idx_receipts_user_sector
    ON public.receipts USING btree
    (user_id ASC NULLS LAST, sector COLLATE pg_catalog."default" ASC NULLS LAST);