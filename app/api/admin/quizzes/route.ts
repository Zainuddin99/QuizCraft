import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'
import { QuestionType } from '@prisma/client'

// GET /api/admin/quizzes - List all quizzes
export async function GET(request: NextRequest) {
  try {
    requireAdminAuth(request)

    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    })

    // Sort questions and options with nulls last
    quizzes.forEach((quiz: { questions: Array<{ order: number | null; options: Array<{ order: number | null }> }> }) => {
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
    })

    return NextResponse.json(quizzes)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}

// POST /api/admin/quizzes - Create quiz
export async function POST(request: NextRequest) {
  try {
    requireAdminAuth(request)

    const body = await request.json()
    const { title, description, questions } = body

    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Title and questions are required' },
        { status: 400 }
      )
    }

    // Generate slug from title with UUID suffix for uniqueness
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80)
    
    // Add short UUID suffix (8 chars) for uniqueness
    const uuidSuffix = crypto.randomUUID().substring(0, 8)
    const finalSlug = `${baseSlug}-${uuidSuffix}`

    // Create quiz with questions and options
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || null,
        slug: finalSlug,
        questions: {
          create: questions.map((q: { text: string; type?: string; order?: number; options?: Array<{ text: string; isCorrect?: boolean; order?: number }> }, index: number) => ({
            text: q.text,
            type: (q.type as QuestionType) || QuestionType.TRUE_FALSE, // Default to TRUE_FALSE
            order: q.order !== undefined ? (q.order === null ? null : q.order) : null,
            options: {
              create: q.options?.map((opt: { text: string; isCorrect?: boolean; order?: number }, optIndex: number) => ({
                text: opt.text,
                isCorrect: opt.isCorrect || false,
                order: opt.order !== undefined ? (opt.order === null ? null : opt.order) : null
              })) || []
            }
          }))
        }
      },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json(quiz, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error creating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    )
  }
}

