import { JinaAIIcon } from '@/components/icons'
import type { ReadUrlResponse } from '@/tools/jina/types'
import type { BlockConfig } from '../types'

export const JinaBlock: BlockConfig<ReadUrlResponse> = {
  type: 'jina',
  name: 'Jina',
  description: 'Convert website content into text',
  longDescription:
    "Transform web content into clean, readable text using Jina AI's advanced extraction capabilities. Extract meaningful content from websites while preserving important information and optionally gathering links.",
  docsLink: 'https://docs.openkernel.ai/tools/jina',
  category: 'tools',
  bgColor: '#333333',
  icon: JinaAIIcon,
  subBlocks: [
    {
      id: 'url',
      title: 'URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter URL to extract content from',
    },
    {
      id: 'options',
      title: 'Options',
      type: 'checkbox-list',
      layout: 'full',
      options: [
        { id: 'useReaderLMv2', label: 'Use Reader LM v2' },
        { id: 'gatherLinks', label: 'Gather Links' },
        { id: 'jsonResponse', label: 'JSON Response' },
      ],
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Jina API key',
      password: true,
    },
  ],
  tools: {
    access: ['jina_read_url'],
  },
  inputs: {
    url: { type: 'string', required: true },
    useReaderLMv2: { type: 'boolean', required: false },
    gatherLinks: { type: 'boolean', required: false },
    jsonResponse: { type: 'boolean', required: false },
    apiKey: { type: 'string', required: true },
  },
  outputs: {
    content: 'string',
  },
}
