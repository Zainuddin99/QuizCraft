'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPublicQuizzes, type PublicQuizListItem } from '@/lib/api'

export default function PublicQuizzesPage() {
  const [quizzes, setQuizzes] = useState<PublicQuizListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicQuizzes()
        setQuizzes(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load quizzes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Available Quizzes</h1>
          <p className="mt-2 text-sm text-gray-600">Pick a quiz and start your attempt.</p>
        </div>

        {loading && <p className="text-gray-600">Loading...</p>}

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div className="rounded-md bg-white p-6 shadow">
            <p className="text-gray-600">No quizzes available yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {quizzes.map((q) => (
            <Link
              key={q.id}
              href={`/quizzes/${q.slug}`}
              className="block rounded-lg bg-white shadow hover:shadow-md transition p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{q.title}</h2>
                  {q.description && (
                    <p className="mt-1 text-sm text-gray-600">{q.description}</p>
                  )}
                </div>
                <span className="text-indigo-600 text-sm font-medium">Start →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}


