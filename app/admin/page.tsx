'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/admin/AuthGuard'
import { getQuizzes, type Quiz } from '@/lib/api'

export default function QuizzesPage() {
  return (
    <AuthGuard>
      <QuizzesContent />
    </AuthGuard>
  )
}

function QuizzesContent() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const data = await getQuizzes()
        setQuizzes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quizzes')
      } finally {
        setLoading(false)
      }
    }
    fetchQuizzes()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and manage your quizzes
            </p>
          </div>
          <Link
            href="/admin/quizzes/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Quiz
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No quizzes yet</p>
            <Link
              href="/admin/quizzes/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Your First Quiz
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    href={`/admin/quizzes/${quiz.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="text-lg font-medium text-gray-900">
                              {quiz.title}
                            </p>
                          </div>
                          {quiz.description && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {quiz.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>
                              {quiz.questions.length} question
                              {quiz.questions.length !== 1 ? 's' : ''}
                            </span>
                            <span className="mx-2">•</span>
                            <span>Created {formatDate(quiz.createdAt)}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}






