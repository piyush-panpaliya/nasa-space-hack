import type { ActionFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'

export const loader = ({ context }: ActionFunctionArgs) => {
  context.pb.authStore.clear()

  return redirect('/auth/login', {
    headers: {
      'Set-Cookie': context.pb.authStore.exportToCookie()
    }
  })
}
