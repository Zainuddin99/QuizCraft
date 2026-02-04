'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  getPublicQuiz,
  submitPublicAttempt,
  type PublicAttemptResult,
  type PublicQuiz,
} from '@/lib/api'

export default function TakeQuizPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [quiz, setQuiz] = useState<PublicQuiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [answers, setAnswers] = useState<Record<string, { optionId?: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PublicAttemptResult | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getPublicQuiz(slug)
        setQuiz(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const totalQuestions = useMemo(() => quiz?.questions.length ?? 0, [quiz])

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { optionId },
    }))
  }

  const handleSubmit = async () => {
    if (!quiz) return
    setError('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      setError('Name is required')
      return
    }
    if (!trimmedEmail) {
      setError('Email is required')
      return
    }

    setSubmitting(true)
    try {
      const res = await submitPublicAttempt(slug, {
        name: trimmedName,
        email: trimmedEmail,
        answers,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit attempt')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Quiz not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Back to quizzes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          {quiz.description && <p className="mt-2 text-sm text-gray-600">{quiz.description}</p>}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {result ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900">Result</h2>
            <p className="mt-2 text-gray-700">
              Score: <span className="font-semibold">{result.score}</span> /{' '}
              <span className="font-semibold">{result.maxScore}</span>
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to quizzes
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Questions</h2>
                <span className="text-sm text-gray-600">{totalQuestions} total</span>
              </div>

              <div className="space-y-6">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Question {idx + 1}</p>
                      <p className="text-gray-900 font-medium">{q.text}</p>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={answers[q.id]?.optionId === opt.id}
                            onChange={() => handleSelect(q.id, opt.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="text-gray-800">{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}





