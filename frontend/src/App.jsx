import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import NavBar from './components/layout/NavBar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Notes from './pages/Notes'
import NotesDetail from './pages/NotesDetail'
import NotesCreate from './pages/NotesCreate'
import NotesMy from './pages/NotesMy'
import NotesAdmin from './pages/NotesAdmin'
import UsersAdmin from './pages/UsersAdmin'
import User from './pages/User'
import ProfileEdit from './pages/ProfileEdit'
import Spot from './pages/Spot'
import SpotDetail from './pages/SpotDetail'
import Admin from './pages/Admin'
import Notifications from './pages/Notifications'

function App() {
  return (
    <Router>
      <div className="app">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes-detail" element={<NotesDetail />} />
          <Route path="/notes-create" element={<NotesCreate />} />
          <Route path="/notes-my" element={<NotesMy />} />
          <Route path="/notes-admin" element={<NotesAdmin />} />
          <Route path="/users-admin" element={<UsersAdmin />} />
          <Route path="/user" element={<User />} />
          <Route path="/profile-edit" element={<ProfileEdit />} />
          <Route path="/spot" element={<Spot />} />
          <Route path="/spot-detail" element={<SpotDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/notifications" element={<Notifications />} />
          {/* 兼容旧链接，重定向到新路径 */}
          <Route path="/notes-detail.html" element={<NotesDetail />} />
          <Route path="/notes-create.html" element={<NotesCreate />} />
          <Route path="/notes-my.html" element={<NotesMy />} />
          <Route path="/notes-admin.html" element={<NotesAdmin />} />
          <Route path="/user.html" element={<User />} />
          <Route path="/profile-edit.html" element={<ProfileEdit />} />
          <Route path="/spot.html" element={<Spot />} />
          <Route path="/spot-detail.html" element={<SpotDetail />} />
          <Route path="/admin.html" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
