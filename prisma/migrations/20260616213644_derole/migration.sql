/*
  Warnings:

  - A unique constraint covering the columns `[guildId]` on the table `derole` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "derole_guildId_key" ON "derole"("guildId");
