import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma 7 requires explicit adapter configuration
// Create PostgreSQL connection pool
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null

// Create Prisma adapter
const adapter = pool ? new PrismaPg(pool) : undefined

// Initialize PrismaClient with adapter
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(adapter ? { adapter } : undefined)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

