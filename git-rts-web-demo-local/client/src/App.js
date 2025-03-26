import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import CredentialForm from './components/CredentialForm';
import TerminalView from './components/TerminalView';
import GitGraph from './components/GitGraph';
import GameView from './components/GameView';
import './App.css';

function App() {
  const [credentials, setCredentials] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoStarted, setDemoStarted] = useState(false);
  const [commands, setCommands] = useState([]);
  const [commits, setCommits] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [gameState, setGameState] = useState({});
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  
  // Connect to socket when session is created
  useEffect(() => {
    if (sessionId) {
      const newSocket = io();
      
      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('join', sessionId);
      });
      
      newSocket.on('command', (data) => {
        setCommands(prev => [...prev, data]);
      });
      
      newSocket.on('commit', (data) => {
        setCommits(prev => [...prev, data]);
      });
      
      newSocket.on('gameState', (data) => {
        setGameState(data);
      });
      
      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [sessionId]);
  
  const handleCredentialSubmit = async (creds) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate credentials
      const response = await axios.post('/api/validate-credentials', creds);
      
      if (response.data.success) {
        setCredentials(creds);
        setSessionId(response.data.sessionId);
        
        // Initialize repositories
        const reposResponse = await axios.post('/api/initialize-repositories', {
          sessionId: response.data.sessionId,
          ...creds
        });
        
        if (reposResponse.data.success) {
          setRepositories(reposResponse.data.repositories);
          
          // Start demo
          await axios.post('/api/start-demo', {
            sessionId: response.data.sessionId
          });
          
          setDemoStarted(true);
        } else {
          setError(`Failed to initialize repositories: ${reposResponse.data.error}`);
        }
      } else {
        setError(`Invalid credentials: ${response.data.error}`);
      }
    } catch (err) {
      setError(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCleanup = async () => {
    if (sessionId) {
      try {
        await axios.post('/api/cleanup', { sessionId });
        
        // Reset state
        setCredentials(null);
        setSessionId(null);
        setDemoStarted(false);
        setCommands([]);
        setCommits([]);
        setRepositories([]);
        setGameState({});
        
        if (socket) {
          socket.disconnect();
          setSocket(null);
        }
      } catch (err) {
        setError(`Cleanup error: ${err.response?.data?.error || err.message}`);
      }
    }
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Git-RTS Interactive Demo</h1>
        <p>Experience Git-based Real-Time Strategy Gaming</p>
      </header>
      
      <main className="app-main">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        
        {!demoStarted ? (
          <CredentialForm onSubmit={handleCredentialSubmit} isLoading={isLoading} />
        ) : (
          <div className="demo-container">
            <div className="demo-controls">
              <button onClick={handleCleanup} className="cleanup-button">
                End Demo & Clean Up
              </button>
            </div>
            
            <div className="demo-row">
              <TerminalView commands={commands} />
              <GitGraph commits={commits} repositories={repositories} />
            </div>
            
            <div className="demo-row">
              <GameView gameState={gameState} />
            </div>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2025 Git-RTS. All rights reserved.</p>
        <p>
          <a href="https://github.com/markjspivey-xwisee/git-rts" target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;