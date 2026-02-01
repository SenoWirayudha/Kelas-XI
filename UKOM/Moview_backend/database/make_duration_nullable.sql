-- Make duration column nullable in movies table
ALTER TABLE movies MODIFY COLUMN duration INT NULL;
