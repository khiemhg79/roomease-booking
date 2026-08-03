-- Run when an existing Supabase database was created with SMALLINT/CHAR(3)
-- while the Java entities use Integer/String.
ALTER TABLE public.properties
    ALTER COLUMN star_rating TYPE INTEGER USING star_rating::INTEGER;

ALTER TABLE public.property_policies
    ALTER COLUMN age_restriction TYPE INTEGER USING age_restriction::INTEGER;

ALTER TABLE public.room_types
    ALTER COLUMN max_adults TYPE INTEGER USING max_adults::INTEGER,
    ALTER COLUMN max_children TYPE INTEGER USING max_children::INTEGER,
    ALTER COLUMN max_guests TYPE INTEGER USING max_guests::INTEGER,
    ALTER COLUMN bathroom_count TYPE INTEGER USING bathroom_count::INTEGER;

ALTER TABLE public.inventory_calendar
    ALTER COLUMN min_stay TYPE INTEGER USING min_stay::INTEGER,
    ALTER COLUMN max_stay TYPE INTEGER USING max_stay::INTEGER;

ALTER TABLE public.rate_calendar
    ALTER COLUMN currency TYPE VARCHAR(3) USING currency::VARCHAR;

ALTER TABLE public.bookings
    ALTER COLUMN currency TYPE VARCHAR(3) USING currency::VARCHAR;

ALTER TABLE public.payments
    ALTER COLUMN currency TYPE VARCHAR(3) USING currency::VARCHAR;
