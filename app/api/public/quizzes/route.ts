import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/quizzes - List quizzes (public)
export async function GET(_request: NextRequest) {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching public quizzes:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}





