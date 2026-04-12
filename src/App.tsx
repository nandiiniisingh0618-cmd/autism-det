import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar, Footer } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Results from './pages/Results';
import Live from './pages/Live';
import About from './pages/About';
import LiveDebug from './pages/LiveDebug';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results" element={<Results />} />
              <Route path="/live" element={<Live />} />
              <Route path="/debug" element={<LiveDebug />} />
              <Route path="/about" element={<About />} />
              {/* Fallback to Home for other routes in this demo */}
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
