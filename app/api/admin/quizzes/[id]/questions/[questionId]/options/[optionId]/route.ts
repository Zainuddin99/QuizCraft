import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

// DELETE /api/admin/quizzes/[id]/questions/[questionId]/options/[optionId] - Delete option
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string; optionId: string }> }
) {
  try {
    requireAdminAuth(request)

    const { id, questionId, optionId } = await params

    // Verify question belongs to quiz
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

    // Verify option exists and belongs to this question
    const option = await prisma.questionOption.findFirst({
      where: {
        id: optionId,
        questionId
      }
    })

    if (!option) {
      return NextResponse.json(
        { error: 'Option not found or does not belong to this question' },
        { status: 404 }
      )
    }

    // Check if this is the last correct answer
    const correctOptionsCount = await prisma.questionOption.count({
      where: {
        questionId,
        isCorrect: true
      }
    })

    if (option.isCorrect && correctOptionsCount === 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last correct answer. At least one option must be marked as correct' },
        { status: 400 }
      )
    }

    await prisma.questionOption.delete({
      where: { id: optionId }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error deleting option:', error)
    return NextResponse.json(
      { error: 'Failed to delete option' },
      { status: 500 }
    )
  }
}

