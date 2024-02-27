import { useState } from 'react'
import './App.css'
import axios from "axios";
import {RevolvingDot} from "react-loader-spinner"

function App() {
  const [inputValue, setInputValue] = useState("");
  const [summaries, setSummaries] = useState("");
  const[loading,setLoading]=useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      const res = await axios.get(`http://localhost:5050/scrape?url=${encodeURIComponent(inputValue)}`);
      setSummaries(res.data.summarizedResult.text);
      setLoading(false)
    } catch (error) {
      console.log("Error fetching summary:", error)
      setLoading(false)
    }
  }

  return (
    <div className='container'>
      <h1>SUMMARIZE YOUR WEBSITES</h1>
      <div className='form'>
        <form onSubmit={handleSubmit}>
          <input type='text' placeholder='Enter the url here...' value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
          <button type='submit'>Get Summary</button>
        </form>
      </div>

      {loading && (
        <div className='spinner-container'>
          <RevolvingDot visible={true} height={30} width={30} color='blue' />
        </div>
      )}
      {summaries && (
          <div className='summaries'>
           <p>{summaries}</p>
          </div>
      )}

    </div>
  )
}

export default App
