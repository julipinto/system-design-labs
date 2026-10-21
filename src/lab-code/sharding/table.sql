CREATE DATABASE ecommerce;
\c ecommerce;

CREATE SCHEMA analytics;

CREATE TABLE analytics.sales (
    id BIGSERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    sale_date DATE NOT NULL,
    region TEXT NOT NULL
) PARTITION BY RANGE (sale_date);