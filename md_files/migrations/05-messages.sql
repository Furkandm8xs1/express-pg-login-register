-- Table: public.messages
-- Create sequence first if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS messages_id_seq START 1;

CREATE TABLE IF NOT EXISTS public.messages
(
    id integer NOT NULL DEFAULT nextval('messages_id_seq'::regclass),
    sender_id integer NOT NULL,
    recipient_id integer NOT NULL,
    message text COLLATE pg_catalog."default" NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

ALTER TABLE IF EXISTS public.messages
    OWNER to postgres;
-- Index: idx_messages_is_read

-- DROP INDEX IF EXISTS public.idx_messages_is_read;

CREATE INDEX IF NOT EXISTS idx_messages_is_read
    ON public.messages USING btree
    (is_read ASC NULLS LAST);
-- Index: idx_messages_recipient

-- DROP INDEX IF EXISTS public.idx_messages_recipient;

CREATE INDEX IF NOT EXISTS idx_messages_recipient
    ON public.messages USING btree
    (recipient_id ASC NULLS LAST);
-- Index: idx_messages_sender

-- DROP INDEX IF EXISTS public.idx_messages_sender;

CREATE INDEX IF NOT EXISTS idx_messages_sender
    ON public.messages USING btree
    (sender_id ASC NULLS LAST);