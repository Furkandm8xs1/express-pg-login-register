-- Table: public.receipt_items
-- Create sequence first if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS receipt_items_id_seq START 1;

CREATE TABLE IF NOT EXISTS public.receipt_items
(
    id integer NOT NULL DEFAULT nextval('receipt_items_id_seq'::regclass),
    receipt_id integer NOT NULL,
    item_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric(12,2) NOT NULL DEFAULT 0,
    total_price numeric(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT receipt_items_pkey PRIMARY KEY (id),
    CONSTRAINT receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id)
        REFERENCES public.receipts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

ALTER TABLE IF EXISTS public.receipt_items
    OWNER to postgres;