import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

// POST /api/admin/quizzes/[id]/questions/[questionId]/options - Create or Update option
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    requireAdminAuth(request)

    const { id, questionId } = await params
    const body = await request.json()
    const { optionId, text, isCorrect, order } = body

    // Validate order (if provided, must be non-negative integer)
    if (order !== undefined && order !== null) {
      if (!Number.isInteger(order) || order < 0) {
        return NextResponse.json(
          { error: 'Order must be a non-negative integer' },
          { status: 400 }
        )
      }
    }

    // Verify question exists and belongs to quiz
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        quizId: id
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found or does not belong to this quiz' },
        { status: 404 }
      )
    }

    // If optionId provided, update existing option
    if (optionId) {
      // Verify option belongs to this question
      const existingOption = await prisma.questionOption.findFirst({
        where: {
          id: optionId,
          questionId
        }
      })

      if (!existingOption) {
        return NextResponse.json(
          { error: 'Option not found or does not belong to this question' },
          { status: 404 }
        )
      }

      // Resolve text (use existing if not provided)
      const nextText = text !== undefined ? text : existingOption.text
      if (!nextText) {
        return NextResponse.json(
          { error: 'Option text is required' },
          { status: 400 }
        )
      }

      // Check if updating isCorrect to false would leave no correct answers
      const newIsCorrect = isCorrect !== undefined ? isCorrect : existingOption.isCorrect
      if (!newIsCorrect) {
        const otherCorrectOptions = await prisma.questionOption.count({
          where: {
            questionId,
            isCorrect: true,
            id: { not: optionId }
          }
        })

        if (otherCorrectOptions === 0) {
          return NextResponse.json(
            { error: 'At least one option must be marked as correct' },
            { status: 400 }
          )
        }
      }

      // Enforce single-correct for MCQ_SINGLE / TRUE_FALSE
      const needsSingle = question.type === 'MCQ_SINGLE' || question.type === 'TRUE_FALSE'
      let updatedOption
      if (needsSingle && newIsCorrect) {
        const [, opt] = await prisma.$transaction([
          prisma.questionOption.updateMany({
            where: { questionId, id: { not: optionId } },
            data: { isCorrect: false }
          }),
          prisma.questionOption.update({
            where: { id: optionId },
            data: {
              text: nextText,
              isCorrect: true,
              order: order !== undefined ? (order === null ? null : order) : existingOption.order
            }
          })
        ])
        updatedOption = opt
      } else {
        updatedOption = await prisma.questionOption.update({
          where: { id: optionId },
          data: {
            text: nextText,
            isCorrect: newIsCorrect,
            order: order !== undefined ? (order === null ? null : order) : existingOption.order
          }
        })
      }

      // Return updated question with options (sorted)
      const updatedQuestion = await prisma.question.findUnique({
        where: { id: questionId },
        include: { options: true }
      })

      updatedQuestion?.options.sort((a: { order: number | null }, b: { order: number | null }) => {
        if (a.order === null && b.order === null) return 0
        if (a.order === null) return 1
        if (b.order === null) return -1
        return a.order - b.order
      })

      return NextResponse.json(updatedQuestion)
    } else {
      // Create new option
      if (!text) {
        return NextResponse.json(
          { error: 'Option text is required' },
          { status: 400 }
        )
      }

      const needsSingle = question.type === 'MCQ_SINGLE' || question.type === 'TRUE_FALSE'

      // Enforce max 2 options for TRUE_FALSE
      if (question.type === 'TRUE_FALSE') {
        const optionCount = await prisma.questionOption.count({
          where: { questionId }
        })
        if (optionCount >= 2) {
          return NextResponse.json(
            { error: 'True/False questions can have at most 2 options' },
            { status: 400 }
          )
        }
      }

      let createdOption
      if (needsSingle && isCorrect) {
        const [, opt] = await prisma.$transaction([
          prisma.questionOption.updateMany({
            where: { questionId },
            data: { isCorrect: false }
          }),
          prisma.questionOption.create({
            data: {
              questionId,
              text,
              isCorrect: true,
              order: order !== undefined ? (order === null ? null : order) : null
            }
          })
        ])
        createdOption = opt
      } else {
        createdOption = await prisma.questionOption.create({
          data: {
            questionId,
            text,
            isCorrect: isCorrect || false,
            order: order !== undefined ? (order === null ? null : order) : null
          }
        })
      }

      // Validate at least one correct answer exists for this question
      const correctOptions = await prisma.questionOption.count({
        where: {
          questionId,
          isCorrect: true
        }
      })

      if (correctOptions === 0) {
        // Delete the option we just created if validation fails
        await prisma.questionOption.delete({ where: { id: createdOption.id } })
        return NextResponse.json(
          { error: 'At least one option must be marked as correct' },
          { status: 400 }
        )
      }

      const updatedQuestion = await prisma.question.findUnique({
        where: { id: questionId },
        include: { options: true }
      })

      updatedQuestion?.options.sort((a: { order: number | null }, b: { order: number | null }) => {
        if (a.order === null && b.order === null) return 0
        if (a.order === null) return 1
        if (b.order === null) return -1
        return a.order - b.order
      })

      return NextResponse.json(updatedQuestion, { status: 201 })
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error creating/updating option:', error)
    return NextResponse.json(
      { error: 'Failed to create/update option' },
      { status: 500 }
    )
  }
}

