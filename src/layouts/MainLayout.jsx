import React from 'react'
import Navbar from '../components/Navbar'
import { Outlet } from 'react-router-dom'
export default function Hi() {
  return (
    <div className='container mx-auto'>
        <Navbar />
        <Outlet />
    </div>
  )
}
