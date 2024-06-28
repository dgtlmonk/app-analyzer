import { useEffect } from "react";
import TestComponent2 from "./TestComponent2"
import { testFn } from "../lib/test";

function add(x, y) {
  const r = 1;
  return x + y
}


function heyTestComponent() {
  console.log('hey')   
}


const x = 1



const TestComponent = ({s}: {s:string}) => {
  useEffect(()=> {
    testFn()
  }, [])
  
  return <div>
  <TestComponent2 />
  Imma component
  <button onClick={()=>add(1,2)}>test button</button>
  
</div>

  
} 

export default  TestComponent
