import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Loading messages that rotate
  const loadingMessages = [
    "🔍 Analyzing your request...",
    "💡 Finding hidden problems...",
    "🎯 Preparing AI detective...",
    "✨ Almost ready...",
    "🚀 Launching RootCauseAI..."
  ];
  
  const [currentMessage, setCurrentMessage] = useState(0);
  
  // Rotate messages during loading
  React.useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % loadingMessages.length);
    }, 600);
    
    return () => clearInterval(interval);
  }, [isLoading, loadingMessages.length]);
  
  const handleEnter = () => {
    setIsLoading(true);
    
    // Simulate loading for 2 seconds then navigate
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };
  
  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-center animate-fade-in">
          {/* Pulsing Logo */}
          <div className="mb-8 animate-pulse">
            <div className="text-7xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-white">RootCauseAI</h1>
          </div>
          
          {/* Loading Spinner */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          {/* Rotating Message */}
          <div className="min-h-[80px]">
            <p className="text-xl text-white font-medium animate-pulse">
              {loadingMessages[currentMessage]}
            </p>
          </div>
          
          {/* Fun Fact / Tip */}
          <div className="mt-8 max-w-md mx-auto p-4 bg-white/10 rounded-lg backdrop-blur-sm">
            <p className="text-green-300 text-sm">
              💡 Did you know?
            </p>
            <p className="text-gray-200 text-sm mt-1">
              Companies waste 60-80% of their IT budget building solutions for misdiagnosed problems.
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-64 mx-auto mt-8">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full animate-progress"></div>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm mt-4">
            Stop building the wrong thing. Start finding the right one.
          </p>
        </div>
      </div>
    );
  }
  
  // Original Welcome Page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl max-w-md mx-4">
        <div className="text-6xl mb-4">🎯</div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome to <span className="text-green-400">RootCauseAI</span>
        </h1>
        <p className="text-xl text-gray-200 mb-8">
          Stop building the wrong thing.
          <br />
          Start finding the right one.
        </p>
        <button
          onClick={handleEnter}
          className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Enter Platform →
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
