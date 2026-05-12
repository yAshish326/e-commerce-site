-- V3 widen user photo_url to text

ALTER TABLE user_profiles ALTER COLUMN photo_url TYPE text;
