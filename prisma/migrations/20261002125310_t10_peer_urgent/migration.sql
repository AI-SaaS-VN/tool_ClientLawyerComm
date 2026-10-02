-- AlterTable
ALTER TABLE "notification_tasks" ADD COLUMN     "sender_user_id" UUID;

-- CreateIndex
CREATE INDEX "notification_tasks_sender_user_id_idx" ON "notification_tasks"("sender_user_id");

-- AddForeignKey
ALTER TABLE "notification_tasks" ADD CONSTRAINT "notification_tasks_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
