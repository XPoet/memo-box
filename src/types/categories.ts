import type { NoteSummary } from './notes'

export interface CategoryNode {
  id: string
  name: string
  parentId?: string
  level: number
  sortOrder: number
  path: string
  noteCount: number
  children: CategoryNode[]
}

export interface CategoryDeleteImpact {
  directNoteCount: number
  branchNoteCount: number
  childCategoryCount: number
}

export type CategoryDeleteMode = 'current' | 'branch'
export type CategoryErrorCode =
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_VALIDATION_FAILED'
  | 'CATEGORY_DUPLICATE_NAME'
  | 'CATEGORY_MAX_DEPTH_EXCEEDED'
  | 'CATEGORY_CYCLE_DETECTED'
  | 'CATEGORY_OPERATION_FAILED'
export interface CategoryError {
  code: CategoryErrorCode
  message: string
}
export type CategoryFilteredNotes = NoteSummary[]
