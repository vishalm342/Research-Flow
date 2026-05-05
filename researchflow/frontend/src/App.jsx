import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WorkspaceLayout from './layouts/WorkspaceLayout';
import ChatWorkspace from './pages/ChatWorkspace';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/app" element={
          <ProtectedRoute>
            <WorkspaceLayout>
              <ChatWorkspace />
            </WorkspaceLayout>
          </ProtectedRoute>
        } />
        <Route path="/c/:conversationId" element={
          <ProtectedRoute>
            <WorkspaceLayout>
              <ChatWorkspace />
            </WorkspaceLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;