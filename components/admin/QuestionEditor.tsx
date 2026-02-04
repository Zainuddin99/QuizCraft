'use client'

import { useState } from 'react'
import type { Question, QuestionOption } from '@/lib/api'

interface QuestionEditorProps {
  question: Question
  onUpdate: (question: Partial<Question>) => void
  onDelete: () => void
  onOptionAdd: (option: Omit<QuestionOption, 'id' | 'questionId' | 'createdAt'>) => void
  onOptionUpdate: (optionId: string, option: Partial<QuestionOption>) => void
  onOptionDelete: (optionId: string) => void
}

export default function QuestionEditor({
  question,
  onUpdate,
  onDelete,
  onOptionAdd,
  onOptionUpdate,
  onOptionDelete,
}: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [newOptionText, setNewOptionText] = useState('')

  const handleAddOption = () => {
    if (question.type === 'TRUE_FALSE' && question.options.length >= 2) {
      return
    }

    if (!newOptionText.trim()) return

    // Check if this is the first option - make it correct by default
    const isFirstOption = question.options.length === 0

    onOptionAdd({
      text: newOptionText.trim(),
      isCorrect: isFirstOption,
      order: question.options.length,
    })
    setNewOptionText('')
  }

  const handleToggleCorrect = (optionId: string) => {
    const target = question.options.find((o) => o.id === optionId)
    if (!target) return

    // For MCQ_SINGLE and TRUE_FALSE, we want exactly one correct option.
    // Send ONE request to mark this option correct; the API will flip others to false.
    const isSingleSelect = question.type === 'MCQ_SINGLE' || question.type === 'TRUE_FALSE'
    if (isSingleSelect) {
      if (target.isCorrect) return
      onOptionUpdate(optionId, { isCorrect: true })
      return
    }

    // Fallback toggle (not expected with current types)
    onOptionUpdate(optionId, { isCorrect: !target.isCorrect })
  }

  const sortedOptions = [...question.options].sort((a, b) => {
    if (a.order === null && b.order === null) return 0
    if (a.order === null) return 1
    if (b.order === null) return -1
    return a.order - b.order
  })

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            <span className="text-xs font-medium text-gray-500">
              Question {question.order !== null ? question.order + 1 : '?'}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
              {question.type}
            </span>
          </div>
          <textarea
            value={question.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Question text..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={2}
          />
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="ml-3 text-red-600 hover:text-red-800"
          title="Delete question"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value as 'MCQ_SINGLE' | 'TRUE_FALSE' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="TRUE_FALSE">True/False</option>
            <option value="MCQ_SINGLE">Multiple Choice</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order
          </label>
          <input
            type="number"
            min="0"
            value={question.order ?? ''}
            onChange={(e) => onUpdate({ order: e.target.value === '' ? null : parseInt(e.target.value) })}
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Options</h4>
          
          {sortedOptions.length === 0 ? (
            <p className="text-sm text-gray-500 mb-3">No options yet. Add at least one option.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {sortedOptions.map((option) => (
                <div key={option.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={option.isCorrect}
                    onChange={() => handleToggleCorrect(option.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => onOptionUpdate(option.id, { text: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Option text..."
                  />
                  <input
                    type="number"
                    min="0"
                    value={option.order ?? ''}
                    onChange={(e) => onOptionUpdate(option.id, { order: e.target.value === '' ? null : parseInt(e.target.value) })}
                    placeholder="Order"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => onOptionDelete(option.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete option"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {
            (question.type !== 'TRUE_FALSE' || question.options.length < 2) && (<div className="flex gap-2">
            <input
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
              placeholder="Add new option..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddOption}
              disabled={question.type === 'TRUE_FALSE' && question.options.length >= 2}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Add
            </button>
          </div>)
          }
        </div>
      )}
    </div>
  )
}





