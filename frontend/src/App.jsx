import { Routes, Route } from "react-router-dom"

import Login from "./pages/login"
import UploadDocument from "./pages/uploadDocument"
import Documents from "./pages/documents"
import Layout from "./layout"

function App() {
  return (
    <Routes>

      {/* Login page (no layout) */}
      <Route path="/login" element={<Login />} />

      {/* Pages WITH layout */}
      <Route
        path="/"
        element={
          <Layout>
            <Documents />
          </Layout>
        }
      />

      <Route
        path="/upload"
        element={
          <Layout>
            <UploadDocument />
          </Layout>
        }
      />

      <Route
        path="/documents"
        element={
          <Layout>
            <Documents />
          </Layout>
        }
      />

    </Routes>
  )
}

export default App