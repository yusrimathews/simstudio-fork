import { StagehandIcon } from '@/components/icons'
import type { ToolResponse } from '@/tools/types'
import type { BlockConfig } from '../types'

interface StagehandExtractResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}

export const StagehandBlock: BlockConfig<StagehandExtractResponse> = {
  type: 'stagehand',
  name: 'Stagehand Extract',
  description: 'Extract data from websites',
  longDescription:
    'Use Stagehand to extract structured data from webpages using Browserbase and OpenAI.',
  docsLink: 'https://docs.openkernel.ai/tools/stagehand',
  category: 'tools',
  bgColor: '#FFC83C',
  icon: StagehandIcon,
  subBlocks: [
    {
      id: 'url',
      title: 'URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter the URL of the website to extract data from',
    },
    {
      id: 'instruction',
      title: 'Instruction',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Enter detailed instructions for what data to extract from the page...',
    },
    {
      id: 'apiKey',
      title: 'OpenAI API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your OpenAI API key',
      password: true,
    },
    {
      id: 'schema',
      title: 'Schema',
      type: 'code',
      layout: 'full',
      placeholder: 'Enter JSON Schema...',
      language: 'json',
      generationType: 'json-schema',
    },
  ],
  tools: {
    access: ['stagehand_extract'],
    config: {
      tool: () => 'stagehand_extract',
    },
  },
  inputs: {
    url: { type: 'string', required: true },
    instruction: { type: 'string', required: true },
    schema: { type: 'json', required: true },
    apiKey: { type: 'string', required: true },
  },
  outputs: {
    data: 'json',
  },
}
