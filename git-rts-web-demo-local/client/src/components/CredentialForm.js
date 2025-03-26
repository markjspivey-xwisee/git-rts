import React, { useState } from 'react';

function CredentialForm({ onSubmit, isLoading }) {
  const [credentials, setCredentials] = useState({
    username1: '',
    token1: '',
    username2: '',
    token2: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(credentials);
  };

  return (
    <div className="credential-form">
      <h2>Enter GitHub Credentials</h2>
      <p>
        To run the Git-RTS demo, you'll need two GitHub accounts with personal access tokens.
        Your credentials will only be used for this demo and will not be stored.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="player-credentials">
          <h3>Player 1</h3>
          <div className="form-group">
            <label htmlFor="username1">GitHub Username:</label>
            <input
              type="text"
              id="username1"
              name="username1"
              value={credentials.username1}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="token1">Personal Access Token:</label>
            <input
              type="password"
              id="token1"
              name="token1"
              value={credentials.token1}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="player-credentials">
          <h3>Player 2</h3>
          <div className="form-group">
            <label htmlFor="username2">GitHub Username:</label>
            <input
              type="text"
              id="username2"
              name="username2"
              value={credentials.username2}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="token2">Personal Access Token:</label>
            <input
              type="password"
              id="token2"
              name="token2"
              value={credentials.token2}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Starting Demo...' : 'Start Demo'}
          </button>
        </div>
        
        <div className="token-help">
          <h4>How to Create a Personal Access Token:</h4>
          <ol>
            <li>Go to GitHub Settings &gt; Developer settings &gt; Personal access tokens</li>
            <li>Click "Generate new token"</li>
            <li>Give it a name like "Git-RTS Demo"</li>
            <li>Select the following scopes: repo, workflow</li>
            <li>Click "Generate token" and copy the token</li>
          </ol>
          <p>Note: For this demo, you can use two accounts you own or create temporary accounts.</p>
        </div>
      </form>
    </div>
  );
}

export default CredentialForm;