import { Outlet } from '@remix-run/react'

export default function Auth() {
  return (
    <div className='flex flex-col  justify-center items-center min-h-screen p-4'>
      <Outlet />
    </div>
  )
}
