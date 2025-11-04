-- CreateEnum
CREATE TYPE "TransType" AS ENUM ('CHECKOUT', 'CHECKIN');

-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECH', 'STANDARD', 'OFFICE', 'GUEST');

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "name" TEXT,
    "typology" TEXT,
    "sku" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionCheckout" (
    "id" SERIAL NOT NULL,
    "productionName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "ente" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "restitutionDate" TIMESTAMP(3) NOT NULL,
    "techPerson" TEXT,
    "type" "TransType" NOT NULL DEFAULT 'CHECKOUT',
    "status" "CheckoutStatus" NOT NULL DEFAULT 'OPEN',
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "productionCheckoutId" INTEGER,
    "type" "TransType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "Item"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionCheckout" ADD CONSTRAINT "ProductionCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_productionCheckoutId_fkey" FOREIGN KEY ("productionCheckoutId") REFERENCES "ProductionCheckout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
