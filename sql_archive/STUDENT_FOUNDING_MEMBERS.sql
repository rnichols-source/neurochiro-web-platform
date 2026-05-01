-- Mark all current students with active accounts as Student Pro (founding members)
-- They were paying before the free tier existed — they get everything

UPDATE profiles
SET tier = 'pro'
WHERE role = 'student'
AND tier IN ('starter', 'free', 'foundation');
