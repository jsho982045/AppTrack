import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user`, {
                credentials: 'include'
            });
            setIsAuthenticated(response.ok);
        } catch (error) {
            setIsAuthenticated(false);
        }
    };

    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
                />
                <Route 
                    path="/dashboard" 
                    element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
                />
                <Route 
                    path="/" 
                    element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
                />
            </Routes>
        </Router>
    );
}

export default App;