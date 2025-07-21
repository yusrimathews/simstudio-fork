import { NextRequest } from 'next/server'
/**
 * Tests for function execution API route
 *
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockRequest } from '@/app/api/__test-utils__/utils'

const mockFreestyleExecuteScript = vi.fn()
const mockCreateContext = vi.fn()
const mockRunInContext = vi.fn()
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

describe('Function Execute API Route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    vi.doMock('vm', () => ({
      createContext: mockCreateContext,
      Script: vi.fn().mockImplementation(() => ({
        runInContext: mockRunInContext,
      })),
    }))

    vi.doMock('freestyle-sandboxes', () => ({
      FreestyleSandboxes: vi.fn().mockImplementation(() => ({
        executeScript: mockFreestyleExecuteScript,
      })),
    }))

    vi.doMock('@/lib/env', () => ({
      env: {
        FREESTYLE_API_KEY: 'test-freestyle-key',
      },
    }))

    vi.doMock('@/lib/logs/console-logger', () => ({
      createLogger: vi.fn().mockReturnValue(mockLogger),
    }))

    mockFreestyleExecuteScript.mockResolvedValue({
      result: 'freestyle success',
      logs: [],
    })

    mockRunInContext.mockResolvedValue('vm success')
    mockCreateContext.mockReturnValue({})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Function Execution', () => {
    it('should execute simple JavaScript code successfully', async () => {
      const req = createMockRequest('POST', {
        code: 'return "Hello World"',
        timeout: 5000,
      })

      const { POST } = await import('./route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.output).toHaveProperty('result')
      expect(data.output).toHaveProperty('executionTime')
    })

    it('should handle missing code parameter', async () => {
      const req = createMockRequest('POST', {
        timeout: 5000,
      })

      const { POST } = await import('./route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data).toHaveProperty('error')
    })

    it('should use default timeout when not provided', async () => {
      const req = createMockRequest('POST', {
        code: 'return "test"',
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] Function execution request/),
        expect.objectContaining({
          timeout: 5000, // default timeout
        })
      )
    })
  })

  describe('Template Variable Resolution', () => {
    it('should resolve environment variables with {{var_name}} syntax', async () => {
      const req = createMockRequest('POST', {
        code: 'return {{API_KEY}}',
        envVars: {
          API_KEY: 'secret-key-123',
        },
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // The code should be resolved to: return "secret-key-123"
    })

    it('should resolve tag variables with <tag_name> syntax', async () => {
      const req = createMockRequest('POST', {
        code: 'return <email>',
        params: {
          email: { id: '123', subject: 'Test Email' },
        },
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // The code should be resolved with the email object
    })

    it('should NOT treat email addresses as template variables', async () => {
      const req = createMockRequest('POST', {
        code: 'return "Email sent to user"',
        params: {
          email: {
            from: 'Yusri Mathews <yusri@openkernel.ai>',
            to: 'User <user@example.com>',
          },
        },
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // Should not try to replace <waleed@simstudio.ai> as a template variable
    })

    it('should only match valid variable names in angle brackets', async () => {
      const req = createMockRequest('POST', {
        code: 'return <validVar> + "<invalid@email.com>" + <another_valid>',
        params: {
          validVar: 'hello',
          another_valid: 'world',
        },
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // Should replace <validVar> and <another_valid> but not <invalid@email.com>
    })
  })

  describe('Gmail Email Data Handling', () => {
    it('should handle Gmail webhook data with email addresses containing angle brackets', async () => {
      const gmailData = {
        email: {
          id: '123',
          from: 'Yusri Mathews <yusri@openkernel.ai>',
          to: 'User <user@example.com>',
          subject: 'Test Email',
          bodyText: 'Hello world',
        },
        rawEmail: {
          id: '123',
          payload: {
            headers: [
              { name: 'From', value: 'Yusri Mathews <yusri@openkernel.ai>' },
              { name: 'To', value: 'User <user@example.com>' },
            ],
          },
        },
      }

      const req = createMockRequest('POST', {
        code: 'return <email>',
        params: gmailData,
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should properly serialize complex email objects with special characters', async () => {
      const complexEmailData = {
        email: {
          from: 'Test User <test@example.com>',
          bodyHtml: '<div>HTML content with "quotes" and \'apostrophes\'</div>',
          bodyText: 'Text with\nnewlines\tand\ttabs',
        },
      }

      const req = createMockRequest('POST', {
        code: 'return <email>',
        params: complexEmailData,
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
    })
  })

  describe.skip('Freestyle Execution', () => {
    it('should use Freestyle when API key is available', async () => {
      const req = createMockRequest('POST', {
        code: 'return "freestyle test"',
      })

      const { POST } = await import('./route')
      await POST(req)

      expect(mockFreestyleExecuteScript).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] Using Freestyle for code execution/)
      )
    })

    it('should handle Freestyle errors and fallback to VM', async () => {
      mockFreestyleExecuteScript.mockRejectedValueOnce(new Error('Freestyle API error'))

      const req = createMockRequest('POST', {
        code: 'return "fallback test"',
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(mockFreestyleExecuteScript).toHaveBeenCalled()
      expect(mockRunInContext).toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] Freestyle API call failed, falling back to VM:/),
        expect.any(Object)
      )
    })

    it('should handle Freestyle script errors', async () => {
      mockFreestyleExecuteScript.mockResolvedValueOnce({
        result: null,
        logs: [{ type: 'error', message: 'ReferenceError: undefined variable' }],
      })

      const req = createMockRequest('POST', {
        code: 'return undefinedVariable',
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('VM Execution', () => {
    it.skip('should use VM when Freestyle API key is not available', async () => {
      // Mock no Freestyle API key
      vi.doMock('@/lib/env', () => ({
        env: {
          FREESTYLE_API_KEY: undefined,
        },
      }))

      const req = createMockRequest('POST', {
        code: 'return "vm test"',
      })

      const { POST } = await import('./route')
      await POST(req)

      expect(mockFreestyleExecuteScript).not.toHaveBeenCalled()
      expect(mockRunInContext).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[.*\] Using VM for code execution \(no Freestyle API key available\)/
        )
      )
    })

    it('should handle VM execution errors', async () => {
      // Mock no Freestyle API key so it uses VM
      vi.doMock('@/lib/env', () => ({
        env: {
          FREESTYLE_API_KEY: undefined,
        },
      }))

      mockRunInContext.mockRejectedValueOnce(new Error('VM execution error'))

      const req = createMockRequest('POST', {
        code: 'return invalidCode(',
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('VM execution error')
    })
  })

  describe('Custom Tools', () => {
    it('should handle custom tool execution with direct parameter access', async () => {
      const req = createMockRequest('POST', {
        code: 'return location + " weather is sunny"',
        params: {
          location: 'San Francisco',
        },
        isCustomTool: true,
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // For custom tools, parameters should be directly accessible as variables
    })
  })

  describe('Security and Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const req = new NextRequest('http://localhost:3000/api/function/execute', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(500)
    })

    it('should handle timeout parameter', async () => {
      const req = createMockRequest('POST', {
        code: 'return "test"',
        timeout: 10000,
      })

      const { POST } = await import('./route')
      await POST(req)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] Function execution request/),
        expect.objectContaining({
          timeout: 10000,
        })
      )
    })

    it('should handle empty parameters object', async () => {
      const req = createMockRequest('POST', {
        code: 'return "no params"',
        params: {},
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
    })
  })

  describe('Enhanced Error Handling', () => {
    it('should provide detailed syntax error with line content', async () => {
      // Mock VM Script to throw a syntax error
      const mockScript = vi.fn().mockImplementation(() => {
        const error = new Error('Invalid or unexpected token')
        error.name = 'SyntaxError'
        error.stack = `user-function.js:5
      description: "This has a missing closing quote
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

SyntaxError: Invalid or unexpected token
    at new Script (node:vm:117:7)
    at POST (/path/to/route.ts:123:24)`
        throw error
      })

      vi.doMock('vm', () => ({
        createContext: mockCreateContext,
        Script: mockScript,
      }))

      const req = createMockRequest('POST', {
        code: 'const obj = {\n  name: "test",\n  description: "This has a missing closing quote\n};\nreturn obj;',
        timeout: 5000,
      })

      const { POST } = await import('./route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Syntax Error')
      expect(data.error).toContain('Line 3')
      expect(data.error).toContain('description: "This has a missing closing quote')
      expect(data.error).toContain('Invalid or unexpected token')
      expect(data.error).toContain('(Check for missing quotes, brackets, or semicolons)')

      // Check debug information
      expect(data.debug).toBeDefined()
      expect(data.debug.line).toBe(3)
      expect(data.debug.errorType).toBe('SyntaxError')
      expect(data.debug.lineContent).toBe('description: "This has a missing closing quote')
    })

    it('should provide detailed runtime error with line and column', async () => {
      // Create the error object first
      const runtimeError = new Error("Cannot read properties of null (reading 'someMethod')")
      runtimeError.name = 'TypeError'
      runtimeError.stack = `TypeError: Cannot read properties of null (reading 'someMethod')
    at user-function.js:4:16
    at user-function.js:9:3
    at Script.runInContext (node:vm:147:14)`

      // Mock successful script creation but runtime error
      const mockScript = vi.fn().mockImplementation(() => ({
        runInContext: vi.fn().mockRejectedValue(runtimeError),
      }))

      vi.doMock('vm', () => ({
        createContext: mockCreateContext,
        Script: mockScript,
      }))

      const req = createMockRequest('POST', {
        code: 'const obj = null;\nreturn obj.someMethod();',
        timeout: 5000,
      })

      const { POST } = await import('./route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Type Error')
      expect(data.error).toContain('Line 2')
      expect(data.error).toContain('return obj.someMethod();')
      expect(data.error).toContain('Cannot read properties of null')

      // Check debug information
      expect(data.debug).toBeDefined()
      expect(data.debug.line).toBe(2)
      expect(data.debug.column).toBe(16)
      expect(data.debug.errorType).toBe('TypeError')
      expect(data.debug.lineContent).toBe('return obj.someMethod();')
    })

    it('should handle ReferenceError with enhanced details', async () => {
      // Create the error object first
      const referenceError = new Error('undefinedVariable is not defined')
      referenceError.name = 'ReferenceError'
      referenceError.stack = `ReferenceError: undefinedVariable is not defined
    at user-function.js:4:8
    at Script.runInContext (node:vm:147:14)`

      const mockScript = vi.fn().mockImplementation(() => ({
        runInContext: vi.fn().mockRejectedValue(referenceError),
      }))

      vi.doMock('vm', () => ({
        createContext: mockCreateContext,
        Script: mockScript,
      }))

      const req = createMockRequest('POST', {
        code: 'const x = 42;\nreturn undefinedVariable + x;',
        timeout: 5000,
      })

      const { POST } = await import('./route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Reference Error')
      expect(data.error).toContain('Line 2')
      expect(data.error).toContain('return undefinedVariable + x;')
      expect(data.error).toContain('undefinedVariable is not defined')
    })

    it('should handle errors without line content gracefully', async () => {
      const mockScript = vi.fn().mockImplementation(() => {
        const error = new Error('Generic error without stack trace')
        error.name = 'Error'
        // No stack trace
        throw error
      })

      vi.doMock('vm', () => ({
        createContext: mockCreateContext,
        Script: mockScript,
      }))

      const req = createMockRequest('POST', {
        code: 'return "test";',
        timeout: 5000,
      })

      const { POST } = await import('./route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Generic error without stack trace')

      // Should still have debug info, but without line details
      expect(data.debug).toBeDefined()
      expect(data.debug.errorType).toBe('Error')
      expect(data.debug.line).toBeUndefined()
      expect(data.debug.lineContent).toBeUndefined()
    })

    it('should extract line numbers from different stack trace formats', async () => {
      const mockScript = vi.fn().mockImplementation(() => {
        const error = new Error('Test error')
        error.name = 'Error'
        error.stack = `Error: Test error
    at user-function.js:7:25
    at async function
    at Script.runInContext (node:vm:147:14)`
        throw error
      })

      vi.doMock('vm', () => ({
        createContext: mockCreateContext,
        Script: mockScript,
      }))

      const req = createMockRequest('POST', {
        code: 'const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;\nreturn a + b + c + d;',
        timeout: 5000,
      })

      const { POST } = await import('./route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)

      // Line 7 in VM should map to line 5 in user code (7 - 3 + 1 = 5)
      expect(data.debug.line).toBe(5)
      expect(data.debug.column).toBe(25)
      expect(data.debug.lineContent).toBe('return a + b + c + d;')
    })

    it('should provide helpful suggestions for common syntax errors', async () => {
      const mockScript = vi.fn().mockImplementation(() => {
        const error = new Error('Unexpected end of input')
        error.name = 'SyntaxError'
        error.stack = 'user-function.js:4\nSyntaxError: Unexpected end of input'
        throw error
      })

      vi.doMock('vm', () => ({
        createContext: mockCreateContext,
        Script: mockScript,
      }))

      const req = createMockRequest('POST', {
        code: 'const obj = {\n  name: "test"\n// Missing closing brace',
        timeout: 5000,
      })

      const { POST } = await import('./route')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Syntax Error')
      expect(data.error).toContain('Unexpected end of input')
      expect(data.error).toContain('(Check for missing closing brackets or braces)')
    })
  })

  describe('Utility Functions', () => {
    it('should properly escape regex special characters', async () => {
      // This tests the escapeRegExp function indirectly
      const req = createMockRequest('POST', {
        code: 'return {{special.chars+*?}}',
        envVars: {
          'special.chars+*?': 'escaped-value',
        },
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
      // Should handle special regex characters in variable names
    })

    it('should handle JSON serialization edge cases', async () => {
      // Test with complex but not circular data first
      const req = createMockRequest('POST', {
        code: 'return <complexData>',
        params: {
          complexData: {
            special: 'chars"with\'quotes',
            unicode: '🎉 Unicode content',
            nested: {
              deep: {
                value: 'test',
              },
            },
          },
        },
      })

      const { POST } = await import('./route')
      const response = await POST(req)

      expect(response.status).toBe(200)
    })
  })
})

describe('Function Execute API - Template Variable Edge Cases', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    vi.doMock('@/lib/logs/console-logger', () => ({
      createLogger: vi.fn().mockReturnValue(mockLogger),
    }))

    vi.doMock('@/lib/env', () => ({
      env: {
        FREESTYLE_API_KEY: 'test-freestyle-key',
      },
    }))

    vi.doMock('vm', () => ({
      createContext: mockCreateContext,
      Script: vi.fn().mockImplementation(() => ({
        runInContext: mockRunInContext,
      })),
    }))

    vi.doMock('freestyle-sandboxes', () => ({
      FreestyleSandboxes: vi.fn().mockImplementation(() => ({
        executeScript: mockFreestyleExecuteScript,
      })),
    }))

    mockFreestyleExecuteScript.mockResolvedValue({
      result: 'freestyle success',
      logs: [],
    })

    mockRunInContext.mockResolvedValue('vm success')
    mockCreateContext.mockReturnValue({})
  })

  it.skip('should handle nested template variables', async () => {
    mockFreestyleExecuteScript.mockResolvedValueOnce({
      result: 'environment-valueparam-value',
      logs: [],
    })

    const req = createMockRequest('POST', {
      code: 'return {{outer}} + <inner>',
      envVars: {
        outer: 'environment-value',
      },
      params: {
        inner: 'param-value',
      },
    })

    const { POST } = await import('./route')
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.output.result).toBe('environment-valueparam-value')
  })

  it.skip('should prioritize environment variables over params for {{}} syntax', async () => {
    mockFreestyleExecuteScript.mockResolvedValueOnce({
      result: 'env-wins',
      logs: [],
    })

    const req = createMockRequest('POST', {
      code: 'return {{conflictVar}}',
      envVars: {
        conflictVar: 'env-wins',
      },
      params: {
        conflictVar: 'param-loses',
      },
    })

    const { POST } = await import('./route')
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Environment variable should take precedence
    expect(data.output.result).toBe('env-wins')
  })

  it.skip('should handle missing template variables gracefully', async () => {
    mockFreestyleExecuteScript.mockResolvedValueOnce({
      result: '',
      logs: [],
    })

    const req = createMockRequest('POST', {
      code: 'return {{nonexistent}} + <alsoMissing>',
      envVars: {},
      params: {},
    })

    const { POST } = await import('./route')
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.output.result).toBe('')
  })
})
