-- CreateTable
CREATE TABLE "regrole" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "REGISTRATOR" TEXT NOT NULL,

    CONSTRAINT "regrole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regrole_guildId_key" ON "regrole"("guildId");
