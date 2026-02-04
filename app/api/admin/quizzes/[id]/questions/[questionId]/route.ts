import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

// DELETE /api/admin/quizzes/[id]/questions/[questionId] - Delete question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    requireAdminAuth(request)

    const { id, questionId } = await params

    // Verify question exists and belongs to this quiz
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

    // Delete question (cascade will delete options)
    await prisma.question.delete({
      where: { id: questionId }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    )
  }
}

