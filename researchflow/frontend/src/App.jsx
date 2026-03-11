import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkspaceLayout from './layouts/WorkspaceLayout';
import ChatWorkspace from './pages/ChatWorkspace';

function App() {
  return (
    <Router>
      <WorkspaceLayout>
        <Routes>
          <Route path="/" element={<ChatWorkspace />} />
          <Route path="/c/:conversationId" element={<ChatWorkspace />} />
        </Routes>
      </WorkspaceLayout>
    </Router>
  );
}

export default App;