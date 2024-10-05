import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  try {
    if (request.url.includes('lng') && request.url.includes('lat')) {
      const long = new URL(request.url).searchParams.get('lng')
      const lat = new URL(request.url).searchParams.get('lat')
      if (!long || !lat)
        return json({ error: 'Error creating queue' }, { status: 500 })
      const res = await fetch(
        `http://localhost:5000/calculate?lat=${lat}&lng=${long}`
      )
      const { gid } = await res.json()
      if (!gid) {
        return json({ error: 'Error creating queue' }, { status: 500 })
      }
      await context.pb
        .collection('queues')
        .create({ long, lat, status: 'queued', gid })
    }
    const queues = await context.pb
      .collection('queues')
      .getFullList({ sort: '-created' })
    return json({ queues })
  } catch (e) {
    return json({ error: 'Error creating queue' + e }, { status: 500 })
  }
}
const Home = () => {
  const { queues } = useLoaderData<typeof loader>()
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, document.title, '/queue')
  }
  return (
    <div className='flex flex-col items-center p-4'>
      {queues ? (
        <Table className='border p-4 rounded-lg'>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead className='hidden md:table-cell'>longitude</TableHead>
              <TableHead className='hidden md:table-cell'>latitudes</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.map((queue) => (
              <TableRow key={queue.id}>
                <TableCell className='font-medium'>{queue.gid}</TableCell>
                <TableCell className='hidden md:table-cell'>
                  {queue.long}
                </TableCell>
                <TableCell className='hidden md:table-cell'>
                  {queue.lat}
                </TableCell>
                <TableCell>
                  <Badge variant='secondary'>{queue.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        'Error'
      )}
    </div>
  )
}

export default Home
