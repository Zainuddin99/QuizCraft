-- Add identity fields to quiz_attempts
ALTER TABLE "quiz_attempts"
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '';

-- Optional: remove defaults after backfill (kept simple for local/dev)




