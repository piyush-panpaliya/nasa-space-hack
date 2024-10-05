import { createRequestHandler } from '@remix-run/express'
import { installGlobals } from '@remix-run/node'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import morgan from 'morgan'
import PocketBase from 'pocketbase'
import invariant from 'tiny-invariant'
installGlobals()

const getLoadContext = async (req) => {
  invariant(process.env.POCKETBASE_URL, 'POCKETBASE_URL is not set')

  const pb = new PocketBase(process.env.POCKETBASE_URL)
  try {
    const parsedCookie = JSON.parse(req.cookies['pb_auth'])
    pb.authStore.save(parsedCookie?.token || '', parsedCookie?.model || null)
    pb.authStore.isValid && (await pb.collection('users').authRefresh())
  } catch (e) {
    console.error(e)
    pb.authStore.clear()
  }

  return {
    pb,
    user: pb.authStore.model
  }
}
const viteDevServer =
  process.env.NODE_ENV === 'production'
    ? undefined
    : await import('vite').then((vite) =>
        vite.createServer({
          server: { middlewareMode: true }
        })
      )

const remixHandler = createRequestHandler({
  getLoadContext,
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule('virtual:remix/server-build')
    : await import('./build/server/index.js')
})

const app = express()

app.use(cookieParser())
app.use(compression())

app.disable('x-powered-by')

if (viteDevServer) {
  app.use(viteDevServer.middlewares)
} else {
  app.use(
    '/assets',
    express.static('build/client/assets', { immutable: true, maxAge: '1y' })
  )
}

app.use(express.static('build/client', { maxAge: '1h' }))

app.use(morgan('tiny'))
app.all('*', remixHandler)

const port = process.env.PORT || 3000
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
)
