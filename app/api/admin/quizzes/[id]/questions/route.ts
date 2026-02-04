import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

// POST /api/admin/quizzes/[id]/questions - Create or Update question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdminAuth(request)

    const { id } = await params
    const body = await request.json()
    const { questionId, text, type, order } = body

    // Validate required fields
    if (!text) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      )
    }

    // Validate question type
    if (type && type !== 'MCQ_SINGLE' && type !== 'TRUE_FALSE') {
      return NextResponse.json(
        { error: 'Question type must be MCQ_SINGLE or TRUE_FALSE' },
        { status: 400 }
      )
    }

    // Validate order (if provided, must be non-negative integer)
    if (order !== undefined && order !== null) {
      if (!Number.isInteger(order) || order < 0) {
        return NextResponse.json(
          { error: 'Order must be a non-negative integer' },
          { status: 400 }
        )
      }
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // If questionId provided, update existing question
    if (questionId) {
      // Verify question belongs to this quiz
      const existingQuestion = await prisma.question.findFirst({
        where: {
          id: questionId,
          quizId: id
        }
      })

      if (!existingQuestion) {
        return NextResponse.json(
          { error: 'Question not found or does not belong to this quiz' },
          { status: 404 }
        )
      }

      // Update question
      const question = await prisma.question.update({
        where: { id: questionId },
        data: {
          text,
          type: type !== undefined ? type : existingQuestion.type,
          order: order !== undefined ? (order === null ? null : order) : existingQuestion.order
        },
        include: {
          options: true
        }
      })

      // Sort options with nulls last
      question.options.sort((a: { order: number | null }, b: { order: number | null }) => {
        if (a.order === null && b.order === null) return 0
        if (a.order === null) return 1
        if (b.order === null) return -1
        return a.order - b.order
      })

      return NextResponse.json(question)
    } else {
      // Create new question
      const question = await prisma.question.create({
        data: {
          quizId: id,
          text,
          type: type || 'TRUE_FALSE',
          order: order !== undefined ? (order === null ? null : order) : null
        },
        include: {
          options: true
        }
      })

      // Sort options with nulls last
      question.options.sort((a: { order: number | null }, b: { order: number | null }) => {
        if (a.order === null && b.order === null) return 0
        if (a.order === null) return 1
        if (b.order === null) return -1
        return a.order - b.order
      })

      return NextResponse.json(question, { status: 201 })
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error creating/updating question:', error)
    return NextResponse.json(
      { error: 'Failed to create/update question' },
      { status: 500 }
    )
  }
}

