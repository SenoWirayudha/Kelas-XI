-- ============================================================
-- ALTER cinemas table for full cinema-booking management
-- Renames name → cinema_name, location → address
-- Adds service_id (FK to services), city, updated_at
-- Run ONCE on an existing database
-- ============================================================

ALTER TABLE cinemas
    ADD COLUMN service_id  BIGINT UNSIGNED NULL          AFTER id,
    CHANGE COLUMN `name`     `cinema_name` VARCHAR(150)  NOT NULL,
    CHANGE COLUMN `location` `address`     VARCHAR(255)  NOT NULL DEFAULT '',
    ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT ''     AFTER cinema_name,
    ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL    AFTER created_at,

    ADD CONSTRAINT fk_cinemas_service
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,

    ADD INDEX idx_cinemas_service (service_id),
    ADD INDEX idx_cinemas_city    (city);
