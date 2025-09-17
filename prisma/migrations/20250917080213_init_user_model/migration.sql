-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "pseudo" TEXT,
    "password" TEXT,
    "email" TEXT,
    "isActive" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_pseudo_key" ON "public"."User"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
