/*
  Warnings:

  - A unique constraint covering the columns `[sleeperId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "sleeperId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Player_sleeperId_key" ON "Player"("sleeperId");
