-- postgres
-- Create the schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS microservice;

-- Create the table inside the schema
CREATE TABLE IF NOT EXISTS microservice.customers (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    created_at      BIGINT NOT NULL,
    password_salt   VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    CONSTRAINT uq_customers_email UNIQUE (email)
    );

-- Create the index inside the schema
CREATE INDEX idx_customers_created_at ON microservice.customers (created_at);


CREATE TABLE IF NOT EXISTS microservice.orders (
    order_id CHAR(36) NOT NULL PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at BIGINT NOT NULL
    );

CREATE TABLE IF NOT EXISTS microservice.order_outbox (
    id CHAR(36) NOT NULL PRIMARY KEY,
    aggregate_id CHAR(36) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    available_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_error TEXT NULL,
    attempts INT NOT NULL DEFAULT 0
    );

CREATE INDEX microservice.idx_order_outbox_status_available
    ON order_outbox (status, available_at);