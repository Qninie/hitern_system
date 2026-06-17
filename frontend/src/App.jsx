import { Routes, Route } from "react-router-dom"

import Login from "./pages/login"
import UploadDocument from "./pages/uploadDocument"
import Documents from "./pages/documents"
import Dashboard from "./pages/dashboard"
import Notifications from "./components/notification"
import Users from "./pages/users"
import Profile from "./pages/profile"
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
            <Dashboard />
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

      <Route
        path="/notifications"
        element={
          <Layout>
            <Notifications />
          </Layout>
        }
      />

      <Route
        path="/users"
        element={
          <Layout>
            <Users />
          </Layout>
        }
      />

      <Route
        path="/profile"
        element={
          <Layout>
            <Profile />
          </Layout>
        }
      />

    </Routes>
  )
}

export default App
