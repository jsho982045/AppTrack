// client/src/components/Login.tsx
const Login = () => {
    const handleGoogleLogin = () => {
        // Redirect to the backend's auth route which will start OAuth flow
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    };

    return (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
            <div className="w-[400px] bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Welcome to AppTrack
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Track your job applications with ease
                </p>
                <button
                    onClick={handleGoogleLogin}
                    className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent 
                             rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 
                             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                             focus:ring-blue-500"
                >
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default Login;