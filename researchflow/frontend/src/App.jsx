import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Research from './pages/Research';
import Report from './pages/Report';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research/:id" element={<Research />} />
          <Route path="/report/:id" element={<Report />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
