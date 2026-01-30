-- Fix movie_services PRIMARY KEY to allow duplicate service_id + movie_id with different availability_type
-- This allows a service like Netflix to have both 'stream' and 'rent' options for the same movie

-- Step 1: Drop foreign key constraints
ALTER TABLE movie_services 
DROP FOREIGN KEY movie_services_ibfk_1,
DROP FOREIGN KEY movie_services_ibfk_2;

-- Step 2: Drop the old composite PRIMARY KEY
ALTER TABLE movie_services 
DROP PRIMARY KEY;

-- Step 3: Add auto-increment ID as new PRIMARY KEY
ALTER TABLE movie_services 
ADD COLUMN id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY FIRST;

-- Step 4: Add UNIQUE constraint to prevent exact duplicates (same movie, service, AND availability_type)
ALTER TABLE movie_services 
ADD UNIQUE KEY unique_movie_service_type (movie_id, service_id, availability_type);

-- Step 5: Re-add foreign key constraints
ALTER TABLE movie_services 
ADD CONSTRAINT movie_services_ibfk_1 FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
ADD CONSTRAINT movie_services_ibfk_2 FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
