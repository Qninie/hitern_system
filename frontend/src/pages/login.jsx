import axios from "axios"
import { useState } from "react"

function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    const res = await axios.post("http://localhost:5001/login", {
      email,
      password
    })

    console.log(res.data)

    if (res.data.success) {
      alert("Login successful")
    } else {
      alert("Login failed")
    }
  }

  return (
    <div>
      <h2>Hitern Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  )
}

export default Login