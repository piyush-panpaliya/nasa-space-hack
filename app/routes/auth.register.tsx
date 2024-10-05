import type { LoaderFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation
} from '@remix-run/react'
import { ClientResponseError } from 'pocketbase'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  emailString,
  getPasswordString,
  nameString,
  passwordsEqualityRefinement,
  usernameString
} from '~/lib/schema-helper'
import { cn } from '~/lib/utils'
import { commitSession, getSession } from '~/session'

class RegistrationError {
  constructor(
    public errors: {
      other?: string[]
      name?: string[]
      username?: string[]
      email?: string[]
      password?: string[]
      passwordConfirm?: string[]
    }
  ) {
    this.errors = errors
  }

  toJSON() {
    return this.errors
  }
}

export const registerUserSchema = z
  .object({
    name: nameString,
    username: usernameString,
    email: emailString,
    password: getPasswordString('Password is required'),
    passwordConfirm: getPasswordString('Confirm password is required')
  })
  .superRefine(passwordsEqualityRefinement)

export const action = async ({ request, context }: LoaderFunctionArgs) => {
  if (context.user) {
    return redirect('/')
  }

  const body = Object.fromEntries(await request.formData())
  const result = registerUserSchema.safeParse(body)

  if (!result.success) {
    return json({
      errors: new RegistrationError(result.error.flatten().fieldErrors)
    })
  }

  try {
    await context.pb.collection('users').create(result.data)
  } catch (error) {
    console.error(error)
    if (error instanceof ClientResponseError) {
      if (error.response.data?.email?.code === 'validation_invalid_email') {
        return json({
          errors: new RegistrationError({
            email: ['Email is already in use.']
          })
        })
      }

      if (
        error.response.data?.username?.code === 'validation_invalid_username'
      ) {
        return json({
          errors: new RegistrationError({
            username: ['Username is already in use.']
          })
        })
      }

      return json({
        errors: new RegistrationError({
          other: ['Failed to register, please try again.']
        })
      })
    }
  }

  try {
    await context.pb.collection('users').requestVerification(result.data.email)
  } catch (error) {
    return json({
      errors: new RegistrationError({
        other: ['Failed to send verification email, please try again.']
      })
    })
  }

  const session = await getSession(request.headers.get('Cookie'))
  session.set('email', result.data.email)

  return redirect('/auth/verify', {
    headers: {
      'Set-Cookie': await commitSession(session)
    }
  })
}

export const loader = ({ context, request }: LoaderFunctionArgs) => {
  const redirectUrl = new URL(request.url).searchParams.get('redirect') ?? '/'

  if (context.user) {
    return redirect('/')
  }

  return { redirectUrl }
}

export default function Register() {
  const { redirectUrl } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  return (
    <Card className='mx-auto max-w-sm'>
      <CardHeader>
        <CardTitle className='text-xl'>Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 w-full'>
        <Form method='POST' id='form' className='space-y-2'>
          <div className='grid gap-2 w-full'>
            <Label htmlFor='email'>Email</Label>

            <Input autoFocus name='email' type='email' id='email' required />

            {actionData?.errors.email &&
              actionData?.errors.email.length > 0 && (
                <div className='label'>
                  <div className='label-text text-sm text-error'>
                    {actionData?.errors.email.map((error) => (
                      <div key={error}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <div className='grid gap-2 w-full'>
            <Label htmlFor='email'>Username</Label>
            <Input name='username' type='text' id='username' required />
            {actionData?.errors.username &&
              actionData?.errors.username.length > 0 && (
                <div className='label'>
                  <div className='label-text text-sm text-error'>
                    {actionData?.errors.username.map((error) => (
                      <div key={error}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <div className='grid gap-2 w-full'>
            <Label htmlFor='email'>Name (optional)</Label>
            <Input name='name' type='text' id='name' />
            {actionData?.errors.name && actionData?.errors.name.length > 0 && (
              <div className='label'>
                <div className='label-text text-sm text-error'>
                  {actionData?.errors.name.map((error) => (
                    <div key={error}>{error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className='grid gap-2 w-full'>
            <Label htmlFor='email'>Password</Label>
            <Input name='password' type='password' id='password' required />
            {actionData?.errors.password &&
              actionData?.errors.password.length > 0 && (
                <div className='label'>
                  <div className='label-text text-sm text-error'>
                    {actionData?.errors.password.map((error) => (
                      <div key={error}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <div className='grid gap-2 w-full'>
            <Label htmlFor='email'>Confirm Password</Label>
            <Input
              name='passwordConfirm'
              type='password'
              id='passwordConfirm'
            />
            {actionData?.errors.passwordConfirm &&
              actionData?.errors.passwordConfirm.length > 0 && (
                <div className='label'>
                  <div className='label-text text-sm text-error'>
                    {actionData?.errors.passwordConfirm.map((error) => (
                      <div key={error}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </Form>

        <Button form='form' type='submit' className='w-full'>
          Create an account
        </Button>
        <Link
          to={`/auth/oauth?redirect=${redirectUrl}&provider=${'google'}`}
          className={cn('btn w-full', {
            'btn-disabled': navigation.state !== 'idle'
          })}
        >
          <Button variant='outline' className='w-full'>
            Sign up with GitHub
          </Button>
        </Link>
        <div className='mt-4 text-center text-sm'>
          Already have an account?{' '}
          <Link to='/auth/login' className='underline'>
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
