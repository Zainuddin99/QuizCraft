import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type SubmitAttemptBody = {
  name?: string
  email?: string
  answers?: Record<string, { optionId?: string }>
}

// POST /api/public/quizzes/[slug]/attempts - Submit attempt (public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = (await request.json()) as SubmitAttemptBody
    const name = (body.name || '').trim()
    const email = (body.email || '').trim()
    const answers = body.answers || {}

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Score: unanswered is allowed and counts as incorrect.
    const autoGraded = quiz.questions.filter(
      (q) => q.type === 'MCQ_SINGLE' || q.type === 'TRUE_FALSE'
    )
    const maxScore = autoGraded.length
    let score = 0

    const perQuestion = autoGraded.map((q) => {
      const correct = q.options.find((o) => o.isCorrect)
      const selectedOptionId = answers[q.id]?.optionId
      const isCorrect = !!(correct && selectedOptionId && selectedOptionId === correct.id)
      if (isCorrect) score += 1

      return {
        questionId: q.id,
        selectedOptionId: selectedOptionId || null,
        correctOptionId: correct?.id || null,
        isCorrect,
      }
    })

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        name,
        email,
        score,
        maxScore,
      },
    })

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      maxScore,
      breakdown: perQuestion,
    })
  } catch (error) {
    console.error('Error submitting attempt:', error)
    return NextResponse.json({ error: 'Failed to submit attempt' }, { status: 500 })
  }
}





