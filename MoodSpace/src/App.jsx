import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import './App.css'
import MainLayout from './layouts/MainLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'
import Boards from './pages/Boards.jsx'
import BoardDetail from './pages/BoardDetail.jsx'
import Projects from './pages/Projects.jsx'
import Profile from './pages/Profile.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import TemplatePreview from './pages/TemplatePreview.jsx'
import PostDetail from './pages/PostDetail.jsx'
import ExternalImageDetail from './pages/ExternalImageDetail.jsx'
import Workspace from './pages/Workspace.jsx'
import NewPost from './pages/NewPost.jsx'
import SearchResults from './pages/SearchResults.jsx'
import UserProfile from './pages/UserProfile.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminPosts from './pages/admin/AdminPosts.jsx'
import AdminReports from './pages/admin/AdminReports.jsx'
import AdminComments from './pages/admin/AdminComments.jsx'
import AdminMedia from './pages/admin/AdminMedia.jsx'
import AuthModal from './components/AuthModal.jsx'

function RootLayout() {
  return (
    <>
      <Outlet />
      <AuthModal />
    </>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        element: <MainLayout />,
        children: [
          { path: 'feed', element: <Home /> },
          { path: 'boards', element: <Boards /> },
          { path: 'boards/:id', element: <BoardDetail /> },
          { path: 'projects', element: <Projects /> },
          { path: 'profile', element: <Profile /> },
          { path: 'post/:id', element: <PostDetail /> },
          { path: 'external/:id', element: <ExternalImageDetail /> },
          { path: 'posts/new', element: <NewPost /> },
          { path: 'search', element: <SearchResults /> },
          { path: 'user/:username', element: <UserProfile /> },
        ],
      },
      { path: 'template/:token', element: <TemplatePreview /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: '/workspace', element: <Workspace /> },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'posts', element: <AdminPosts /> },
          { path: 'reports', element: <AdminReports /> },
          { path: 'comments', element: <AdminComments /> },
          { path: 'media', element: <AdminMedia /> },
        ],
      },
    ],
  },
])

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
