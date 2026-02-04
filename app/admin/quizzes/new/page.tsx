'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/admin/AuthGuard'
import QuestionEditor from '@/components/admin/QuestionEditor'
import { createQuiz, type Question, type QuestionOption } from '@/lib/api'

interface QuestionFormData {
  id?: string
  text: string
  type: 'MCQ_SINGLE' | 'TRUE_FALSE'
  order: number | null
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
    order: number | null
  }>
}

export default function NewQuizPage() {
  return (
    <AuthGuard>
      <NewQuizContent />
    </AuthGuard>
  )
}

function NewQuizContent() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuestionFormData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'TRUE_FALSE',
        order: questions.length,
        options: [],
      },
    ])
  }

  const updateQuestion = (index: number, updates: Partial<QuestionFormData>) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], ...updates }
    setQuestions(updated)
  }

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const addOption = (questionIndex: number, option: Omit<QuestionOption, 'id' | 'questionId' | 'createdAt'>) => {
    const updated = [...questions]
    const newOption = {
      ...option,
      id: `temp-${Date.now()}-${Math.random()}`,
    }
    updated[questionIndex].options = [...updated[questionIndex].options, newOption]
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionId: string, updates: Partial<QuestionOption>) => {
    const updated = [...questions]
    const optionIndex = updated[questionIndex].options.findIndex((opt) => opt.id === optionId)
    if (optionIndex !== -1) {
      if(updates.isCorrect){
        updated[questionIndex].options.forEach((opt) => {
          if(opt.id !== optionId){
            opt.isCorrect = false
          }
        })
      }
      updated[questionIndex].options[optionIndex] = {
        ...updated[questionIndex].options[optionIndex],
        ...updates,
      }
      setQuestions(updated)
    }
  }

  const deleteOption = (questionIndex: number, optionId: string) => {
    const updated = [...questions]
    updated[questionIndex].options = updated[questionIndex].options.filter(
      (opt) => opt.id !== optionId
    )
    setQuestions(updated)
  }

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Quiz title is required'
    }

    if (questions.length === 0) {
      return 'At least one question is required'
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        return `Question ${i + 1} text is required`
      }

      if (q.options.length === 0) {
        return `Question ${i + 1} must have at least one option`
      }

      const hasCorrect = q.options.some((opt) => opt.isCorrect)
      if (!hasCorrect) {
        return `Question ${i + 1} must have at least one correct answer`
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      await createQuiz({
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          type: q.type,
          order: q.order,
          options: q.options.map((opt) => ({
            text: opt.text.trim(),
            isCorrect: opt.isCorrect,
            order: opt.order,
          })),
        })),
      })

      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the quiz details and add questions
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter quiz title"
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
                  placeholder="Enter quiz description (optional)"
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No questions yet. Click "Add Question" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <QuestionEditor
                    key={index}
                    question={{
                      id: question.id || `temp-q-${index}`,
                      quizId: '',
                      text: question.text,
                      type: question.type,
                      order: question.order,
                      createdAt: '',
                      updatedAt: '',
                      options: question.options.map((opt, optIdx) => ({
                        id: opt.id || `temp-opt-${index}-${optIdx}`,
                        questionId: question.id || `temp-q-${index}`,
                        text: opt.text,
                        isCorrect: opt.isCorrect,
                        order: opt.order,
                        createdAt: '',
                      })),
                    }}
                    onUpdate={(updates) => updateQuestion(index, updates)}
                    onDelete={() => deleteQuestion(index)}
                    onOptionAdd={(option) => addOption(index, option)}
                    onOptionUpdate={(optionId, updates) => updateOption(index, optionId, updates)}
                    onOptionDelete={(optionId) => deleteOption(index, optionId)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

