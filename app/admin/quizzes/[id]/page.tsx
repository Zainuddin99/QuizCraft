'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthGuard from '@/components/admin/AuthGuard'
import QuestionEditor from '@/components/admin/QuestionEditor'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import {
  getQuiz,
  updateQuiz,
  saveQuestion,
  deleteQuestion,
  saveOption,
  deleteOption,
  type Quiz,
  type Question,
  type QuestionOption,
} from '@/lib/api'

export default function EditQuizPage() {
  return (
    <AuthGuard>
      <EditQuizContent />
    </AuthGuard>
  )
}

function EditQuizContent() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const debouncedPersistQuestion = useDebouncedCallback(
    async (questionId: string, next: Question) => {
      try {
        const updated = await saveQuestion(quizId, {
          questionId,
          text: next.text,
          type: next.type,
          order: next.order,
        })

        setQuiz((prev) =>
          prev
            ? {
                ...prev,
                questions: prev.questions.map((q) => (q.id === questionId ? updated : q)),
              }
            : prev
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update question')
      }
    },
    500
  )

  const debouncedPersistOption = useDebouncedCallback(
    async (questionId: string, optionId: string, next: QuestionOption) => {
      try {
        const updatedQuestion = await saveOption(quizId, questionId, {
          optionId,
          text: next.text,
          order: next.order,
          isCorrect: next.isCorrect,
        })

        setQuiz((prev) =>
          prev
            ? {
                ...prev,
                questions: prev.questions.map((q) =>
                  q.id === questionId ? updatedQuestion : q
                ),
              }
            : prev
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update option')
      }
    },
    500
  )

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await getQuiz(quizId)
        setQuiz(data)
        setTitle(data.title)
        setDescription(data.description || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }
    loadQuiz()
  }, [quizId])

  const handleSaveQuizDetails = async () => {
    if (!quiz) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updated = await updateQuiz(quizId, {
        title: title.trim(),
        description: description.trim() || undefined,
      })
      setQuiz(updated)
      setSuccess('Quiz details saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quiz')
    } finally {
      setSaving(false)
    }
  }

  const handleQuestionUpdate = async (questionId: string, updates: Partial<Question>) => {
    if (!quiz) return

    // Smooth UI: update local state immediately, then debounce persistence.
    const existing = quiz.questions.find((q) => q.id === questionId)
    if (!existing) return

    const next: Question = {
      ...existing,
      ...updates,
      // Keep required fields always present
      text: updates.text !== undefined ? updates.text : existing.text,
      type: updates.type !== undefined ? updates.type : existing.type,
      order: updates.order !== undefined ? updates.order : existing.order,
    }

    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) => (q.id === questionId ? next : q)),
    })

    debouncedPersistQuestion(questionId, next)
  }

  const handleQuestionAdd = async () => {
    if (!quiz) return

    try {
      const newQuestion = await saveQuestion(quizId, {
        text: 'New Question',
        type: 'TRUE_FALSE',
        order: quiz.questions.length,
      })

      setQuiz({
        ...quiz,
        questions: [...quiz.questions, newQuestion],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question')
    }
  }

  const handleQuestionDelete = async (questionId: string) => {
    if (!quiz) return

    if (!confirm('Are you sure you want to delete this question? This will also delete all its options.')) {
      return
    }

    try {
      await deleteQuestion(quizId, questionId)
      setQuiz({
        ...quiz,
        questions: quiz.questions.filter((q) => q.id !== questionId),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question')
    }
  }

  const handleOptionAdd = async (questionId: string, option: Omit<QuestionOption, 'id' | 'questionId' | 'createdAt'>) => {
    if (!quiz) return

    try {
      const updatedQuestion = await saveOption(quizId, questionId, option)

      setQuiz({
        ...quiz,
        questions: quiz.questions.map((q) =>
          q.id === questionId ? updatedQuestion : q
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add option')
    }
  }

  const handleOptionUpdate = async (
    questionId: string,
    optionId: string,
    updates: Partial<QuestionOption>
  ) => {
    if (!quiz) return

    const question = quiz.questions.find((q) => q.id === questionId)
    const existingOption = question?.options.find((opt) => opt.id === optionId)
    if (!existingOption || !question) return

    const next: QuestionOption = {
      ...existingOption,
      ...updates,
      text: updates.text !== undefined ? updates.text : existingOption.text,
      order: updates.order !== undefined ? updates.order : existingOption.order,
      isCorrect:
        updates.isCorrect !== undefined ? updates.isCorrect : existingOption.isCorrect,
    }

    // Smooth UI: update local state immediately
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o) => (o.id === optionId ? next : o)) }
          : q
      ),
    })

    // Correct toggles should be immediate (no debounce), text/order should be debounced.
    if (updates.isCorrect !== undefined) {
      try {
        const updatedQuestion = await saveOption(quizId, questionId, {
          optionId,
          text: next.text,
          isCorrect: updates.isCorrect,
          order: next.order,
        })

        setQuiz((prev) =>
          prev
            ? {
                ...prev,
                questions: prev.questions.map((q) =>
                  q.id === questionId ? updatedQuestion : q
                ),
              }
            : prev
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update option')
      }
      return
    }

    debouncedPersistOption(questionId, optionId, next)
  }

  const handleOptionDelete = async (questionId: string, optionId: string) => {
    if (!quiz) return

    try {
      await deleteOption(quizId, questionId, optionId)

      setQuiz({
        ...quiz,
        questions: quiz.questions.map((q) =>
          q.id === questionId
            ? { ...q, options: q.options.filter((opt) => opt.id !== optionId) }
            : q
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete option')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Quiz not found</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Back to quizzes
          </button>
        </div>
      </div>
    )
  }

  const sortedQuestions = [...quiz.questions].sort((a, b) => {
    if (a.order === null && b.order === null) return 0
    if (a.order === null) return 1
    if (b.order === null) return -1
    return a.order - b.order
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Quiz</h1>
            <p className="mt-2 text-sm text-gray-600">
              Update quiz details and manage questions
            </p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="text-sm text-green-800">{success}</div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quiz Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleSaveQuizDetails}
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Quiz Details'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={handleQuestionAdd}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Question
              </button>
            </div>

            {sortedQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No questions yet. Click Add Question to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedQuestions.map((question) => (
                  <QuestionEditor
                    key={question.id}
                    question={question}
                    onUpdate={(updates) => handleQuestionUpdate(question.id, updates)}
                    onDelete={() => handleQuestionDelete(question.id)}
                    onOptionAdd={(option) => handleOptionAdd(question.id, option)}
                    onOptionUpdate={(optionId, updates) =>
                      handleOptionUpdate(question.id, optionId, updates)
                    }
                    onOptionDelete={(optionId) => handleOptionDelete(question.id, optionId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}




