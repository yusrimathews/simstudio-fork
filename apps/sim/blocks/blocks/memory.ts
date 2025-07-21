import { BrainIcon } from '@/components/icons'
import type { BlockConfig } from '../types'

export const MemoryBlock: BlockConfig = {
  type: 'memory',
  name: 'Memory',
  description: 'Add memory store',
  longDescription:
    'Create persistent storage for data that needs to be accessed across multiple workflow steps. Store and retrieve information throughout your workflow execution to maintain context and state.',
  bgColor: '#F64F9E',
  icon: BrainIcon,
  category: 'blocks',
  docsLink: 'https://docs.openkernel.ai/tools/memory',
  tools: {
    access: ['memory_add', 'memory_get', 'memory_get_all', 'memory_delete'],
    config: {
      tool: (params: Record<string, any>) => {
        const operation = params.operation || 'add'
        switch (operation) {
          case 'add':
            return 'memory_add'
          case 'get':
            return 'memory_get'
          case 'getAll':
            return 'memory_get_all'
          case 'delete':
            return 'memory_delete'
          default:
            return 'memory_add'
        }
      },
      params: (params: Record<string, any>) => {
        // Create detailed error information for any missing required fields
        const errors: string[] = []

        if (!params.operation) {
          errors.push('Operation is required')
        }

        if (
          params.operation === 'add' ||
          params.operation === 'get' ||
          params.operation === 'delete'
        ) {
          if (!params.id) {
            errors.push(`Memory ID is required for ${params.operation} operation`)
          }
        }

        if (params.operation === 'add') {
          if (!params.role) {
            errors.push('Role is required for agent memory')
          }
          if (!params.content) {
            errors.push('Content is required for agent memory')
          }
        }

        // Throw error if any required fields are missing
        if (errors.length > 0) {
          throw new Error(`Memory Block Error: ${errors.join(', ')}`)
        }

        // Base result object
        const baseResult: Record<string, any> = {}

        // For add operation
        if (params.operation === 'add') {
          const result: Record<string, any> = {
            ...baseResult,
            id: params.id,
            type: 'agent', // Always agent type
            role: params.role,
            content: params.content,
          }

          return result
        }

        // For get operation
        if (params.operation === 'get') {
          return {
            ...baseResult,
            id: params.id,
          }
        }

        // For delete operation
        if (params.operation === 'delete') {
          return {
            ...baseResult,
            id: params.id,
          }
        }

        // For getAll operation
        return baseResult
      },
    },
  },
  inputs: {
    operation: { type: 'string', required: true },
    id: { type: 'string', required: true },
    role: { type: 'string', required: false },
    content: { type: 'string', required: false },
  },
  outputs: {
    memories: 'any',
    id: 'string',
  },
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Add Memory', id: 'add' },
        { label: 'Get All Memories', id: 'getAll' },
        { label: 'Get Memory', id: 'get' },
        { label: 'Delete Memory', id: 'delete' },
      ],
      placeholder: 'Select operation',
    },
    {
      id: 'id',
      title: 'ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter memory identifier',
      condition: {
        field: 'operation',
        value: 'add',
      },
    },
    {
      id: 'id',
      title: 'ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter memory identifier to retrieve',
      condition: {
        field: 'operation',
        value: 'get',
      },
    },
    {
      id: 'id',
      title: 'ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter memory identifier to delete',
      condition: {
        field: 'operation',
        value: 'delete',
      },
    },
    {
      id: 'role',
      title: 'Role',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'User', id: 'user' },
        { label: 'Assistant', id: 'assistant' },
        { label: 'System', id: 'system' },
      ],
      placeholder: 'Select agent role',
      condition: {
        field: 'operation',
        value: 'add',
      },
    },
    {
      id: 'content',
      title: 'Content',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter message content',
      condition: {
        field: 'operation',
        value: 'add',
      },
    },
  ],
}
