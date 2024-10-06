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
import { Outlet, useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '~/components/ui/sheet'
const o = {
  0: 'Not processed',
  1: 'Not processed',
  2: 'Not processed',
  3: 'Non-fire water',
  4: 'Cloud (land or water)',
  5: 'Non-fire land',
  6: 'Unknown',
  7: 'Fire (low confidence, land or water)',
  8: 'Fire (nominal confidence, land or water)',
  9: 'Fire (high confidence, land or water)'
}
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
      const { status } = await res.json()
      if (status !== 'ok') {
        return json({ error: 'Error creating queue' }, { status: 500 })
      }
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
    const url = new URL(window.location)
    url.search = ''
    window.history.replaceState({}, document.title, url.pathname)
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
              <TableHead>More details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.map((queue) => (
              <Sheet key={queue.id}>
                <TableRow>
                  <TableCell className='font-medium'>{queue.id}</TableCell>
                  <TableCell className='hidden md:table-cell'>
                    {queue.long}
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    {queue.lat}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        queue.status === 'done' ? 'default' : 'secondary'
                      }
                    >
                      {queue.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {queue.status === 'done' && (
                      <SheetTrigger asChild>
                        <Button variant='outline'>Open</Button>
                      </SheetTrigger>
                    )}
                  </TableCell>
                  <SheetContent className='min-w-[50vw] overflow-y-auto '>
                    <SheetHeader>
                      <SheetTitle>More Details</SheetTitle>
                      <SheetDescription>
                        Here are some details about the location
                      </SheetDescription>
                    </SheetHeader>
                    <div className='flex flex-col gap-4 py-4 min-w-fit'>
                      <p>
                        <span className='font-semibold'>Fire:</span>{' '}
                        {o[queue.fire]}
                      </p>
                      <p>
                        <span className='font-semibold'>Water:</span>{' '}
                        {queue.water.toFixed(2)}L per hectare
                      </p>
                      <div>
                        <p className='font-semibold'>NDVI:</p>
                        <div
                          style={{
                            background: `linear-gradient(to right, red, green)`,
                            width: '100%', // Adjust width as needed
                            height: '20px', // Adjust height as needed
                            borderRadius: '5px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: `#f0f0f0`, // Indicator color
                              position: 'absolute',
                              width: '5px', // Adjust width for the indicator
                              height: '120%',
                              left: `${queue.health * 100}%`
                            }}
                          ></div>
                        </div>
                        <p className='text-sm'>health is {queue.health}</p>
                      </div>
                      <p className='font-semibold'>suggestions:</p>
                      <p>{queue.llm}</p>
                    </div>
                  </SheetContent>
                </TableRow>
              </Sheet>
            ))}
          </TableBody>
        </Table>
      ) : (
        'Error'
      )}
      <Outlet />
    </div>
  )
}

export default Home
