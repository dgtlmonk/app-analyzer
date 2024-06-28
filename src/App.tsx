import { useEffect } from "react";
import TestComponent from "./TestComponent"
import TestComponent2 from "./TestComponent2";
import { testFn } from "./lib/test";


function heyApp() {
  console.log('hey')   
}

const x = null; 

function App() { 
  useEffect(()=> {
    testFn()
  }, [])

  
  return (
    <>
      <TestComponent s="hello" /> 
      <TestComponent2 />
    </>
  )
}

export default App
