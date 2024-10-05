import { OlaMaps } from '~/lib/ola/olamaps-js-sdk.es'
import '~/lib/ola/style.css'
import { Bird, Rabbit, Settings, Turtle, Search } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '~/components/ui/drawer'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Form, json, useActionData, useNavigate } from '@remix-run/react'
import { Card } from '~/components/ui/card'
type ViewPort = {
  latitude: number
  longitude: number
  zoom: number
}
type Marker = {
  latitude: number
  longitude: number
} | null

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData()
  const query = formData.get('query') as string

  if (!query.trim()) {
    return json({ suggestions: [], error: null })
  }

  try {
    const response = await fetch(
      `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(
        query
      )}&language=English&api_key=tCch3B8CqBnsyzzKZTbPJA4PDlPMMnAcbWR3Yd4k`,
      {
        headers: {
          accept: 'application/json',
          'X-Request-Id': Math.floor(Math.random() * 1000).toString(),
          'X-Correlation-Id': Math.floor(Math.random() * 1000).toString()
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch suggestions')
    }

    const data = await response.json()
    if (data.status !== 'ok') throw new Error('FAiled to fetch suggestions')
    const suggestions = data.geocodingResults.map((result: any) => ({
      name: result.name,
      location: result.geometry.location,
      address: result.formatted_address
    }))
    console.log(suggestions)
    return json({ suggestions, error: null })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return json({ suggestions: [], error: 'Failed to fetch suggestions.' })
  }
}

const Home = () => {
  const actionData = useActionData() // Get the data returned from the action
  const transition = useTransition() // Get the loading state

  const isLoading = transition.state === 'submitting'
  const suggestions = actionData?.suggestions || []
  const error = actionData?.error || null
  const [viewport, _] = useState<ViewPort>({
    latitude: 37.7577,
    longitude: -122.4376,
    zoom: 8
  })
  const [marker, setMarker] = useState<Marker>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const navigate = useNavigate()

  const mapRef = useRef(
    new OlaMaps({
      apiKey: 'tCch3B8CqBnsyzzKZTbPJA4PDlPMMnAcbWR3Yd4k'
    })
  )
  const initRef = useRef(null) as any

  useEffect(() => {
    initRef.current = mapRef.current.init({
      style:
        'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json',
      container: 'map',
      center: [viewport.longitude, viewport.latitude],
      zoom: 1
    })
    initRef.current.on('click', (e) =>
      handleMapClick(e.lngLat.lat, e.lngLat.lng)
    )
  }, [])

  const handleMapClick = (lat: number, lng: number) => {
    setMarker({
      latitude: lat,
      longitude: lng
    })
    mapRef.current
      .addMarker({
        offset: [0, -20],
        anchor: 'bottom',
        draggable: true
      })
      .setLngLat([lng, lat])
      .addTo(mapRef.current)
  }
  const handleConfirm = () => {
    if (!marker) return
    setIsConfirmOpen(false)
    navigate(`/queue?lat=${marker.latitude}&lng=${marker.longitude}`)
  }
  return (
    <>
      {' '}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to use this location to calculate water
              requirements?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant='ghost' size='icon' className='md:hidden'>
            <Settings className='size-4' />
            <span className='sr-only'>Settings</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className='max-h-[80vh]'>
          <DrawerHeader>
            <DrawerTitle>Configuration</DrawerTitle>
            <DrawerDescription>
              Configure the settings for the model and messages.
            </DrawerDescription>
          </DrawerHeader>
          <form className='grid w-full items-start gap-6 overflow-auto p-4 pt-0'>
            <fieldset className='grid gap-6 rounded-lg border p-4'>
              <legend className='-ml-1 px-1 text-sm font-medium'>
                Settings
              </legend>
              <div className='grid gap-3'>
                {/* <Geocoder
                        mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
                        onViewportChange={handleGeocoderViewportChange}
                        viewport={viewport}
                        hideOnSelect={true}
                        position='top-left'
                      /> */}
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='model'>Model</Label>
                <Select>
                  <SelectTrigger
                    id='model'
                    className='items-start [&_[data-description]]:hidden'
                  >
                    <SelectValue placeholder='Select a model' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='genesis'>
                      <div className='flex items-start gap-3 text-muted-foreground'>
                        <Rabbit className='size-5' />
                        <div className='grid gap-0.5'>
                          <p>
                            Neural{' '}
                            <span className='font-medium text-foreground'>
                              Genesis
                            </span>
                          </p>
                          <p className='text-xs' data-description>
                            Our fastest model for general use cases.
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value='explorer'>
                      <div className='flex items-start gap-3 text-muted-foreground'>
                        <Bird className='size-5' />
                        <div className='grid gap-0.5'>
                          <p>
                            Neural{' '}
                            <span className='font-medium text-foreground'>
                              Explorer
                            </span>
                          </p>
                          <p className='text-xs' data-description>
                            Performance and speed for efficiency.
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value='quantum'>
                      <div className='flex items-start gap-3 text-muted-foreground'>
                        <Turtle className='size-5' />
                        <div className='grid gap-0.5'>
                          <p>
                            Neural{' '}
                            <span className='font-medium text-foreground'>
                              Quantum
                            </span>
                          </p>
                          <p className='text-xs' data-description>
                            The most powerful model for complex computations.
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='temperature'>Temperature</Label>
                <Input id='temperature' type='number' placeholder='0.4' />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='top-p'>Top P</Label>
                <Input id='top-p' type='number' placeholder='0.7' />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='top-k'>Top K</Label>
                <Input id='top-k' type='number' placeholder='0.0' />
              </div>
            </fieldset>
            <fieldset className='grid gap-6 rounded-lg border p-4'>
              <legend className='-ml-1 px-1 text-sm font-medium'>
                Messages
              </legend>
              <div className='grid gap-3'>
                <Label htmlFor='role'>Role</Label>
                <Select defaultValue='system'>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='system'>System</SelectItem>
                    <SelectItem value='user'>User</SelectItem>
                    <SelectItem value='assistant'>Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='content'>Content</Label>
                <Textarea id='content' placeholder='You are a...' />
              </div>
            </fieldset>
          </form>
        </DrawerContent>
      </Drawer>
      <main className='grid grow flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3'>
        <div className='relative hidden flex-col items-start gap-8 md:flex'>
          <Form
            method='post'
            action='?index'
            className='grid w-full items-start gap-6'
          >
            <fieldset className='grid gap-6 rounded-lg border p-4'>
              <legend className='-ml-1 px-1 text-sm font-medium'>Search</legend>
              <div className='flex items-center'>
                <Input
                  type='text'
                  name='query'
                  placeholder='Search places...'
                  className='rounded-r-none'
                  aria-label='Search input'
                />
                <Button
                  type='submit'
                  className='rounded-l-none '
                  variant='outline'
                  disabled={isLoading}
                  aria-label='Search button'
                >
                  {isLoading ? (
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                  ) : (
                    <Search className='h-4 w-4' />
                  )}
                </Button>
              </div>
              {error && (
                <p className='text-sm text-red-500' role='alert'>
                  {error}
                </p>
              )}
              {suggestions.length > 0 && (
                <Card className='p-4'>
                  <h2 className='text-lg font-semibold mb-2'>Suggestions</h2>
                  <ul className='space-y-2 overflow-y-auto max-h-[60vh]'>
                    {suggestions.map((suggestion: any, index: number) => (
                      <li
                        onClick={() =>
                          handleMapClick(
                            suggestion.location.lat,
                            suggestion.location.lng
                          )
                        }
                        key={index}
                        className='p-2 hover:bg-gray-100 rounded cursor-pointer transition-colors'
                      >
                        <div className='font-medium'>{suggestion.name}</div>
                        <div className='text-sm text-gray-500'>
                          {suggestion.address}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {!isLoading && suggestions.length === 0 && !error && (
                <p className='text-sm text-gray-500'>No suggestions found</p>
              )}
            </fieldset>
          </Form>
        </div>
        <div className='relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2'>
          <div id='map' className='w-full h-full' />
          {marker && (
            <Button
              className='absolute bottom-10 right-10'
              onClick={() => setIsConfirmOpen(true)}
            >
              Confirm Location
            </Button>
          )}
        </div>
      </main>
    </>
  )
}

export default Home
