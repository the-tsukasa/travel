import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Notes from './pages/Notes'
import NotesDetail from './pages/NotesDetail'
import NotesCreate from './pages/NotesCreate'
import NotesMy from './pages/NotesMy'
import NotesAdmin from './pages/NotesAdmin'
import User from './pages/User'
import ProfileEdit from './pages/ProfileEdit'
import Spot from './pages/Spot'
import Admin from './pages/Admin'

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
          <Route path="/notes-detail.html" element={<NotesDetail />} />
          <Route path="/notes-create.html" element={<NotesCreate />} />
          <Route path="/notes-my.html" element={<NotesMy />} />
          <Route path="/notes-admin.html" element={<NotesAdmin />} />
          <Route path="/user" element={<User />} />
          <Route path="/user.html" element={<User />} />
          <Route path="/profile-edit.html" element={<ProfileEdit />} />
          <Route path="/spot.html" element={<Spot />} />
          <Route path="/admin.html" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
