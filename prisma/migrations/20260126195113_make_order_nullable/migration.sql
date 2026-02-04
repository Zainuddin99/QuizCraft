-- AlterTable
ALTER TABLE "question_options" ALTER COLUMN "order" DROP NOT NULL;

-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "order" DROP NOT NULL;
