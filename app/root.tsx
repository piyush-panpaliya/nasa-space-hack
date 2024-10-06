import {
  json,
  Link,
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from '@remix-run/react'
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node'

import styles from './tailwind.css?url'
import mapStyle from '~/lib/ola/style.css?url'
import { Bot, LogIn, SquareTerminal, SquareUser, Triangle } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '~/components/ui/tooltip'
export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'
  },
  {
    rel: 'stylesheet',
    href: mapStyle
  },
  { rel: 'stylesheet', href: styles }
]
export const loader = ({ context, request }: LoaderFunctionArgs) => {
  if (!context.user && !request.url.includes('auth'))
    return redirect('/auth/login')
  return json(
    { user: context.user },
    {
      headers: {
        'Set-Cookie': context.pb.authStore.exportToCookie()
      }
    }
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const { user } = useLoaderData<typeof loader>()
  return (
    <div className='grid min-h-screen w-full pl-[56px]'>
      <aside className='inset-y-0 fixed  left-0 z-20 flex h-full flex-col border-r'>
        <div className='border-b p-2'>
          <Button variant='outline' size='icon' aria-label='Home'>
            <Triangle className='size-5 fill-foreground' />
          </Button>
        </div>
        <TooltipProvider>
          <nav className='grid gap-1 p-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to='/'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='rounded-lg bg-muted'
                    aria-label='Playground'
                  >
                    <SquareTerminal className='size-5' />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side='right' sideOffset={5}>
                search
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to='/queue'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='rounded-lg'
                    aria-label='Models'
                  >
                    <Bot className='size-5' />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side='right' sideOffset={5}>
                Queue
              </TooltipContent>
            </Tooltip>
          </nav>

          <nav className='mt-auto grid gap-1 p-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='mt-auto rounded-lg'
                  aria-label='Account'
                >
                  <SquareUser className='size-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right' sideOffset={5}>
                Account
              </TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>
      </aside>
      <div className='flex flex-col'>
        <header className='sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4'>
          <h1 className='text-xl font-semibold'>Farm Easy</h1>

          <Link
            to={`/auth/${user ? 'logout' : 'login'}`}
            className='ml-auto gap-1.5 text-sm'
          >
            <Button variant='outline' size='sm'>
              <LogIn className='size-3.5' />
              {user ? 'Logout' : 'Login'}
            </Button>
          </Link>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
