import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './App.css'
import MainLayout from './layouts/MainLayout.jsx'
import Home from './pages/Home.jsx'
import Boards from './pages/Boards.jsx'
import BoardDetail from './pages/BoardDetail.jsx'
import Projects from './pages/Projects.jsx'
import Profile from './pages/Profile.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Workspace from './pages/Workspace.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'boards', element: <Boards /> },
      { path: 'boards/:id', element: <BoardDetail /> },
      { path: 'projects', element: <Projects /> },
      { path: 'profile', element: <Profile /> },
      { path: 'post/:id', element: <PostDetail /> },
    ],
  },
  { path: '/workspace', element: <Workspace /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
