-- CreateTable
CREATE TABLE "derole" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "DELETOR" TEXT NOT NULL,

    CONSTRAINT "derole_pkey" PRIMARY KEY ("id")
);
