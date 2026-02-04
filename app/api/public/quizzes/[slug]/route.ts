import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/quizzes/[slug] - Fetch quiz for taking (public, no answers leaked)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      include: {
        questions: {
          include: {
            options: {
              select: {
                id: true,
                questionId: true,
                text: true,
                order: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Sort questions/options by order (nulls last)
    quiz.questions.sort((a: { order: number | null }, b: { order: number | null }) => {
      if (a.order === null && b.order === null) return 0
      if (a.order === null) return 1
      if (b.order === null) return -1
      return a.order - b.order
    })
    quiz.questions.forEach((q: { options: Array<{ order: number | null }> }) => {
      q.options.sort((a: { order: number | null }, b: { order: number | null }) => {
        if (a.order === null && b.order === null) return 0
        if (a.order === null) return 1
        if (b.order === null) return -1
        return a.order - b.order
      })
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching public quiz:', error)
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 })
  }
}





