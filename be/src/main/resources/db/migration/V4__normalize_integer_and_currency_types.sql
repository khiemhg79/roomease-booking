ALTER TABLE properties
    ALTER COLUMN star_rating TYPE INTEGER USING star_rating::INTEGER;

ALTER TABLE property_policies
    ALTER COLUMN age_restriction TYPE INTEGER USING age_restriction::INTEGER;

ALTER TABLE room_types
    ALTER COLUMN max_adults TYPE INTEGER USING max_adults::INTEGER,
    ALTER COLUMN max_children TYPE INTEGER USING max_children::INTEGER,
    ALTER COLUMN max_guests TYPE INTEGER USING max_guests::INTEGER,
    ALTER COLUMN bathroom_count TYPE INTEGER USING bathroom_count::INTEGER;

ALTER TABLE inventory_calendar
    ALTER COLUMN min_stay TYPE INTEGER USING min_stay::INTEGER,
    ALTER COLUMN max_stay TYPE INTEGER USING max_stay::INTEGER;

ALTER TABLE rate_calendar
    ALTER COLUMN currency TYPE VARCHAR(3) USING currency::VARCHAR;

ALTER TABLE bookings
    ALTER COLUMN currency TYPE VARCHAR(3) USING currency::VARCHAR;

ALTER TABLE payments
    ALTER COLUMN currency TYPE VARCHAR(3) USING currency::VARCHAR;
