-- Add is_coming_soon field to movie_services table
-- This allows marking services as "Coming Soon" before their release date

ALTER TABLE movie_services 
ADD COLUMN is_coming_soon TINYINT(1) DEFAULT 0 COMMENT 'Whether this service is marked as coming soon' AFTER release_date;

-- Add index for better query performance
CREATE INDEX idx_coming_soon ON movie_services(is_coming_soon);
