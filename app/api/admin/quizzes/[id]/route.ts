import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

// GET /api/admin/quizzes/[id] - Get quiz by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdminAuth(request)

    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(quiz)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/quizzes/[id] - Update quiz (only title and description)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdminAuth(request)

    const { id } = await params
    const body = await request.json()
    const { title, description } = body

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id }
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Update only title and description (slug remains unchanged)
    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingQuiz.title,
        description: description !== undefined ? description : existingQuiz.description
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    })

    // Sort questions and options with nulls last
    if (quiz) {
      quiz.questions.sort((a: { order: number | null }, b: { order: number | null }) => {
        if (a.order === null && b.order === null) return 0
        if (a.order === null) return 1
        if (b.order === null) return -1
        return a.order - b.order
      })
      quiz.questions.forEach((question: { options: Array<{ order: number | null }> }) => {
        question.options.sort((a: { order: number | null }, b: { order: number | null }) => {
          if (a.order === null && b.order === null) return 0
          if (a.order === null) return 1
          if (b.order === null) return -1
          return a.order - b.order
        })
      })
    }

    return NextResponse.json(quiz)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    )
  }
}

