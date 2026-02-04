// API utility functions for admin frontend

const API_BASE = '/api/admin'
const PUBLIC_API_BASE = '/api/public'

export interface Quiz {
  id: string
  title: string
  description: string | null
  slug: string
  createdAt: string
  updatedAt: string
  questions: Question[]
}

export interface PublicQuizListItem {
  id: string
  title: string
  description: string | null
  slug: string
  createdAt: string
  updatedAt: string
}

export interface PublicQuiz {
  id: string
  title: string
  description: string | null
  slug: string
  createdAt: string
  updatedAt: string
  questions: Array<{
    id: string
    quizId: string
    text: string
    type: 'MCQ_SINGLE' | 'TRUE_FALSE'
    order: number | null
    createdAt: string
    updatedAt: string
    options: Array<{
      id: string
      questionId: string
      text: string
      order: number | null
      createdAt: string
    }>
  }>
}

export type PublicAttemptResult = {
  attemptId: string
  score: number
  maxScore: number
  breakdown: Array<{
    questionId: string
    selectedOptionId: string | null
    correctOptionId: string | null
    isCorrect: boolean
  }>
}

export interface Question {
  id: string
  quizId: string
  text: string
  type: 'MCQ_SINGLE' | 'TRUE_FALSE'
  order: number | null
  createdAt: string
  updatedAt: string
  options: QuestionOption[]
}

export interface QuestionOption {
  id: string
  questionId: string
  text: string
  isCorrect: boolean
  order: number | null
  createdAt: string
}

// Login
export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Login failed')
  }

  return response.json()
}

// Check auth by trying to fetch quizzes
export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/quizzes`, {
      method: 'GET',
      credentials: 'include',
    })
    return response.ok
  } catch {
    return false
  }
}

// Get all quizzes
export async function getQuizzes(): Promise<Quiz[]> {
  const response = await fetch(`${API_BASE}/quizzes`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    throw new Error('Failed to fetch quizzes')
  }

  return response.json()
}

// Get single quiz
export async function getQuiz(id: string): Promise<Quiz> {
  const response = await fetch(`${API_BASE}/quizzes/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    if (response.status === 404) {
      throw new Error('Quiz not found')
    }
    throw new Error('Failed to fetch quiz')
  }

  return response.json()
}

// Create quiz
export async function createQuiz(data: {
  title: string
  description?: string
  questions: Array<{
    text: string
    type?: 'MCQ_SINGLE' | 'TRUE_FALSE'
    order?: number | null
    options?: Array<{
      text: string
      isCorrect?: boolean
      order?: number | null
    }>
  }>
}): Promise<Quiz> {
  const response = await fetch(`${API_BASE}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create quiz')
  }

  return response.json()
}

// Update quiz (title and description only)
export async function updateQuiz(
  id: string,
  data: { title?: string; description?: string }
): Promise<Quiz> {
  const response = await fetch(`${API_BASE}/quizzes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update quiz')
  }

  return response.json()
}

// Create or update question
export async function saveQuestion(
  quizId: string,
  data: {
    questionId?: string
    text: string
    type?: 'MCQ_SINGLE' | 'TRUE_FALSE'
    order?: number | null
  }
): Promise<Question> {
  const response = await fetch(`${API_BASE}/quizzes/${quizId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to save question')
  }

  return response.json()
}

// Delete question
export async function deleteQuestion(
  quizId: string,
  questionId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/quizzes/${quizId}/questions/${questionId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete question')
  }
}

// Create or update option
export async function saveOption(
  quizId: string,
  questionId: string,
  data: {
    optionId?: string
    text?: string
    isCorrect?: boolean
    order?: number | null
  }
): Promise<Question> {
  const response = await fetch(
    `${API_BASE}/quizzes/${quizId}/questions/${questionId}/options`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to save option')
  }

  return response.json()
}

// Delete option
export async function deleteOption(
  quizId: string,
  questionId: string,
  optionId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/quizzes/${quizId}/questions/${questionId}/options/${optionId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete option')
  }
}

// -----------------------------
// Public quiz APIs (no auth)
// -----------------------------

export async function getPublicQuizzes(): Promise<PublicQuizListItem[]> {
  const response = await fetch(`${PUBLIC_API_BASE}/quizzes`, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch quizzes')
  }

  return response.json()
}

export async function getPublicQuiz(slug: string): Promise<PublicQuiz> {
  const response = await fetch(`${PUBLIC_API_BASE}/quizzes/${slug}`, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    if (response.status === 404) throw new Error('Quiz not found')
    throw new Error('Failed to fetch quiz')
  }

  return response.json()
}

export async function submitPublicAttempt(
  slug: string,
  data: {
    name: string
    email: string
    answers: Record<string, { optionId?: string }>
  }
): Promise<PublicAttemptResult> {
  const response = await fetch(`${PUBLIC_API_BASE}/quizzes/${slug}/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error || 'Failed to submit attempt')
  }

  return response.json()
}





