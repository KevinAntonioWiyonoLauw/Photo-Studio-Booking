// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudiosPage from './pages/StudiosPage';
import StudioDetailPage from './pages/StudioDetailPage';
import BookingPage from './pages/BookingPage';
import UserBookingsPage from './pages/UserBookingsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/studios" element={<StudiosPage />} />
          <Route path="/studios/:id" element={<StudioDetailPage />} />
          
          {/* Protected routes */}
          <Route 
            path="/booking/:studioId" 
            element={
              <PrivateRoute>
                <BookingPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <PrivateRoute>
                <UserBookingsPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;