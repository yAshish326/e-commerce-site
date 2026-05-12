-- V2 add checkout addresses

CREATE TABLE IF NOT EXISTS checkout_address_records (
  id text PRIMARY KEY,
  uid text NOT NULL,
  address_json clob NOT NULL,
  is_default boolean NOT NULL,
  created_at bigint NOT NULL
);
