import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const sendSuccess = <T>(
  c: Context,
  data: T,
  message = 'Success',
  status = true,
  statusCode: any = 200
) => {
  return c.json(
    {
      status: true,
      message,
      data,
    },
    statusCode
  )
}

export const sendError = (
  c: Context,
  message = 'Something went wrong!',
  statusCode: ContentfulStatusCode = 500
) => {
  return c.json(
    {
      status: false,
      message,
    },
    statusCode
  )
}
