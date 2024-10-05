import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation
} from '@remix-run/react'
import clsx from 'clsx'
import { AlertCircleIcon } from 'lucide-react'
import { ClientResponseError } from 'pocketbase'
import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { Input } from '~/components/ui/input'
import { commitSession, getSession } from '~/session'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/ui/card'
import { Label } from '~/components/ui/label'
const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (context.user) {
    return redirect('/')
  }

  const body = Object.fromEntries(await request.formData())

  const result = loginUserSchema.safeParse(body)

  if (!result.success) {
    return json({ error: true })
  }

  try {
    await context.pb
      .collection('users')
      .authWithPassword(result.data.email, result.data.password)
  } catch (error) {
    if (error instanceof ClientResponseError) {
      console.log(error)
      if (error.status === 403) {
        const session = await getSession(request.headers.get('Cookie'))
        session.set('email', result.data.email)

        return redirect('/auth/verify', {
          headers: {
            'Set-Cookie': await commitSession(session)
          }
        })
      }

      return json({ error: true })
    }
  }

  if (!context.pb.authStore.isValid) {
    return json({ error: true })
  }

  const redirectUrl = new URL(request.url).searchParams.get('redirect') || '/'

  const headers = new Headers()
  if (context.pb.authStore.model?.verified) {
    headers.set('Set-Cookie', context.pb.authStore.exportToCookie())
  }

  return redirect(
    !context.pb.authStore.model?.verified ? '/auth/verify' : redirectUrl,
    {
      headers
    }
  )
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const redirectUrl = new URL(request.url).searchParams.get('redirect') ?? '/'
  console.log(context.user)
  if (context.user) {
    return redirect(redirectUrl)
  }

  return json({
    redirectUrl,
    authMethods: await context.pb.collection('users').listAuthMethods()
  })
}

export default function Login() {
  const { redirectUrl, authMethods } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const $form = useRef<HTMLFormElement>(null)
  const navigation = useNavigation()

  useEffect(
    function resetFormOnError() {
      if (navigation.state === 'idle' && actionData?.error) {
        $form.current?.reset()
      }
    },
    [navigation.state, actionData]
  )

  return (
    <Card className='mx-auto max-w-sm'>
      <CardHeader>
        <CardTitle className='text-2xl'>Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          method='POST'
          ref={$form}
          id='form'
          className='space-y-2 grid gap-4'
        >
          <div className='grid gap-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              tabIndex={1}
              autoFocus
              name='email'
              type='email'
              required
              id='email'
            />
          </div>
          <div className='grid gap-2'>
            <div className='flex items-center'>
              <Label htmlFor='password'>Password</Label>
              <Link
                to='/auth/forgot-password'
                className='ml-auto inline-block text-sm underline'
              >
                Forgot your password?
              </Link>
            </div>
            <Input
              tabIndex={2}
              name='password'
              type='password'
              required
              id='password'
            />
          </div>

          <input type='hidden' name='fromUrl' value={redirectUrl} readOnly />
          <input type='hidden' name='auth' value='form' readOnly />
          <Button type='submit' className='w-full'>
            Login
          </Button>
          {authMethods.authProviders.map((provider) => (
            <Link
              key={provider.name}
              to={`/auth/oauth?redirect=${redirectUrl}&provider=${provider.name}`}
              className={clsx('btn w-full', {
                'btn-disabled': navigation.state !== 'idle'
              })}
            >
              <Button
                tabIndex={3}
                form='form'
                className={clsx('btn btn-primary w-full', {
                  'btn-disabled': navigation.state !== 'idle'
                })}
                variant='outline'
              >
                Login with {provider.displayName}
              </Button>
            </Link>
          ))}
        </Form>

        <div className='mt-4 text-center text-sm'>
          Don&apos;t have an account?{' '}
          <Link to='/auth/register' className='underline'>
            Sign up
          </Link>
        </div>
        {actionData?.error && (
          <div className='alert alert-error'>
            <AlertCircleIcon className='h-6 w-6' />
            Invalid email or password. Please try again.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
