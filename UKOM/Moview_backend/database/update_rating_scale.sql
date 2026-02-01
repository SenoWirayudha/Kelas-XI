-- Update rating column to use 0-5 scale instead of 0-10
-- This should be run after updating the application code

ALTER TABLE ratings 
MODIFY rating TINYINT UNSIGNED NOT NULL DEFAULT 0 
COMMENT 'Rating 0-5 stars (0 = watched without rating, 1-5 = star rating)';

-- Note: Existing data with ratings 6-10 should be adjusted manually or via migration
-- Example: UPDATE ratings SET rating = CEIL(rating / 2) WHERE rating > 5;
