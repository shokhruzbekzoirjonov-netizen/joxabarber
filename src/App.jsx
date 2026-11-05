import React from 'react'
import { Analytics } from '@vercel/analytics/react';
import BarberNavbar from './BarberNavbar';

const App = () => {
  return (
    <>
      <BarberNavbar />
      <Analytics />
    </>
  )
}

export default App