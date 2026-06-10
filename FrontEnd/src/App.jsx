import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './App.css'


import Home from "./Pages/Home"
import SignIn from "./Pages/SignIn"

function App(){
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/signin" element={<SignIn/>}/>

        <Route path="*" element={<div>404 Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;