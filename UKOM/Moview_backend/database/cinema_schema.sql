-- ============================================================
-- MOVIEW CINEMA BOOKING SCHEMA
-- Cinema ticket ordering + Midtrans payment integration
-- ============================================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_seats;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS studios;
DROP TABLE IF EXISTS cinemas;

-- ============================================================
-- 1. CINEMAS
-- ============================================================
CREATE TABLE cinemas (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)  NOT NULL,
    location    VARCHAR(255)  NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_cinemas_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. STUDIOS
-- ============================================================
CREATE TABLE studios (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cinema_id    BIGINT UNSIGNED  NOT NULL,
    studio_name  VARCHAR(100)     NOT NULL,
    total_seats  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_at   TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_studios_cinema
        FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE,

    INDEX idx_studios_cinema (cinema_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. SEATS
-- ============================================================
CREATE TABLE seats (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    studio_id    BIGINT UNSIGNED NOT NULL,
    seat_row     CHAR(2)         NOT NULL COMMENT 'Row letter, e.g. A, B, AA',
    seat_number  TINYINT UNSIGNED NOT NULL COMMENT 'Column number, e.g. 1-20',
    seat_code    VARCHAR(10)     NOT NULL COMMENT 'Combined code, e.g. A1, B12',

    CONSTRAINT fk_seats_studio
        FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE,

    UNIQUE KEY uq_seat_in_studio (studio_id, seat_row, seat_number),
    INDEX idx_seats_studio (studio_id),
    INDEX idx_seats_code   (studio_id, seat_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. SCHEDULES
-- ============================================================
CREATE TABLE schedules (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movie_id     BIGINT UNSIGNED NOT NULL,
    studio_id    BIGINT UNSIGNED NOT NULL,
    show_date    DATE            NOT NULL,
    show_time    TIME            NOT NULL,
    ticket_price INT UNSIGNED    NOT NULL COMMENT 'Price in IDR (Rupiah)',

    CONSTRAINT fk_schedules_movie
        FOREIGN KEY (movie_id)  REFERENCES movies(id)  ON DELETE CASCADE,
    CONSTRAINT fk_schedules_studio
        FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE,

    -- Prevent double-scheduling the same studio at the same date+time
    UNIQUE KEY uq_schedule_slot (studio_id, show_date, show_time),

    INDEX idx_schedules_movie      (movie_id),
    INDEX idx_schedules_studio     (studio_id),
    INDEX idx_schedules_show_date  (show_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. ORDERS
-- ============================================================
CREATE TABLE orders (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    schedule_id  BIGINT UNSIGNED NOT NULL,
    -- user_id can be added here when user auth is integrated
    -- user_id   BIGINT UNSIGNED NOT NULL,
    order_code   VARCHAR(50)     NOT NULL UNIQUE COMMENT 'Human-readable order reference, e.g. ORD-20260312-XXXX',
    total_price  INT UNSIGNED    NOT NULL COMMENT 'Total in IDR',
    status       ENUM('pending','paid','cancelled','expired')
                                 NOT NULL DEFAULT 'pending',
    expired_at   TIMESTAMP       NOT NULL COMMENT 'Midtrans payment window deadline',
    created_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_schedule
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE RESTRICT,

    INDEX idx_orders_schedule   (schedule_id),
    INDEX idx_orders_status     (status),
    INDEX idx_orders_expired_at (expired_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. ORDER_SEATS  (booking line items)
-- ============================================================
CREATE TABLE order_seats (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT UNSIGNED NOT NULL,
    seat_id     BIGINT UNSIGNED NOT NULL,
    schedule_id BIGINT UNSIGNED NOT NULL COMMENT 'Denormalised for the unique constraint',
    price       INT UNSIGNED    NOT NULL COMMENT 'Snapshot of ticket price at booking time',

    CONSTRAINT fk_order_seats_order
        FOREIGN KEY (order_id)    REFERENCES orders(id)    ON DELETE CASCADE,
    CONSTRAINT fk_order_seats_seat
        FOREIGN KEY (seat_id)     REFERENCES seats(id)     ON DELETE RESTRICT,
    CONSTRAINT fk_order_seats_schedule
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE RESTRICT,

    -- Core constraint: one seat per schedule (prevents double-booking)
    UNIQUE KEY uq_seat_per_schedule (schedule_id, seat_id),

    INDEX idx_order_seats_order    (order_id),
    INDEX idx_order_seats_seat     (seat_id),
    INDEX idx_order_seats_schedule (schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. PAYMENTS  (Midtrans integration)
-- ============================================================
CREATE TABLE payments (
    id                       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id                 BIGINT UNSIGNED  NOT NULL,
    midtrans_transaction_id  VARCHAR(100)     UNIQUE COMMENT 'Midtrans transaction_id returned in charge response',
    midtrans_order_id        VARCHAR(100)     UNIQUE COMMENT 'order_id sent to Midtrans (= orders.order_code)',
    payment_type             VARCHAR(50)      COMMENT 'e.g. gopay, bank_transfer, credit_card, qris',
    transaction_status       VARCHAR(30)      COMMENT 'pending, capture, settlement, deny, cancel, expire, refund',
    fraud_status             VARCHAR(20)      COMMENT 'accept, challenge, deny (for credit card)',
    gross_amount             INT UNSIGNED     NOT NULL COMMENT 'Amount in IDR',
    payment_time             TIMESTAMP        NULL COMMENT 'Set when settlement notification arrives',
    midtrans_raw_response    JSON             COMMENT 'Full notification payload from Midtrans for audit',
    created_at               TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,

    INDEX idx_payments_order              (order_id),
    INDEX idx_payments_transaction_status (transaction_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. TICKETS  (issued after payment settlement)
-- ============================================================
CREATE TABLE tickets (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT UNSIGNED NOT NULL,
    seat_id     BIGINT UNSIGNED NOT NULL,
    qr_code     VARCHAR(255)    NOT NULL UNIQUE COMMENT 'UUID or signed token for QR scan validation',
    is_used     TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tickets_order
        FOREIGN KEY (order_id) REFERENCES orders(id)  ON DELETE CASCADE,
    CONSTRAINT fk_tickets_seat
        FOREIGN KEY (seat_id)  REFERENCES seats(id)   ON DELETE RESTRICT,

    -- One ticket per seat per order
    UNIQUE KEY uq_ticket_seat_order (order_id, seat_id),

    INDEX idx_tickets_order   (order_id),
    INDEX idx_tickets_seat    (seat_id),
    INDEX idx_tickets_qr_code (qr_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
