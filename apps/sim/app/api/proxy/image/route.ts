import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console-logger'

const logger = createLogger('ImageProxyAPI')

/**
 * Proxy for fetching images
 * This allows client-side requests to fetch images from various sources while avoiding CORS issues
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const imageUrl = url.searchParams.get('url')
  const requestId = crypto.randomUUID().slice(0, 8)

  if (!imageUrl) {
    logger.error(`[${requestId}] Missing 'url' parameter`)
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  logger.info(`[${requestId}] Proxying image request for: ${imageUrl}`)

  try {
    // Use fetch with custom headers that appear more browser-like
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'image/webp,image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://openkernel.ai/',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    })

    if (!imageResponse.ok) {
      logger.error(`[${requestId}] Image fetch failed:`, {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
      })
      return new NextResponse(`Failed to fetch image: ${imageResponse.statusText}`, {
        status: imageResponse.status,
      })
    }

    // Get image content type from response headers
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Get the image as a blob
    const imageBlob = await imageResponse.blob()

    if (imageBlob.size === 0) {
      logger.error(`[${requestId}] Empty image blob received`)
      return new NextResponse('Empty image received', { status: 404 })
    }

    // Return the image with appropriate headers
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`[${requestId}] Image proxy error:`, { error: errorMessage })

    return new NextResponse(`Failed to proxy image: ${errorMessage}`, {
      status: 500,
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
