-- The area the student chose for the portfolio. Empty means it follows the enrolled course.
ALTER TABLE portfolio_profile ADD COLUMN track varchar(20);
