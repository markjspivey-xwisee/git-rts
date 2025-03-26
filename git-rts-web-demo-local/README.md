# Git-RTS Web Demo - Local Testing Version

This is a simplified version of the Git-RTS web demo that can be run locally for testing purposes.

## Prerequisites

- Node.js 14.x or higher
- Git 2.20 or higher
- Two GitHub accounts with personal access tokens (with repo scope)

## Project Structure

```
git-rts-web-demo-local/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       ├── App.js          # Main application
│       └── index.js        # Entry point
├── server/                 # Express backend
│   ├── demo-steps.js       # Demo script
│   ├── server.js           # Server implementation (simulation)
│   └── server-enhanced.js  # Enhanced server (real Git operations)
├── package.json            # Project dependencies
└── README.md               # This file
```

## Setup Instructions

1. Clone this repository:
```bash
git clone https://github.com/markjspivey-xwisee/git-rts-web-demo-local.git
cd git-rts-web-demo-local
```

2. Install dependencies:
```bash
npm install
cd client
npm install
cd ..
```

3. Start the development server:

   **For simulated demo (no real Git operations):**
   ```bash
   npm run dev
   ```

   **For enhanced demo (real Git operations):**
   ```bash
   npm run dev:enhanced
   ```

4. Open your browser to http://localhost:3000

## How It Works

### Simulated Demo (Default)

The default demo simulates Git-RTS commands and their outputs. It:
1. Creates real repositories on GitHub for both players
2. Displays a simulated demo of Git-RTS commands and their outputs
3. Shows a Git graph visualization of simulated commits
4. Displays a game state visualization

However, the repositories remain empty (except for the auto-generated README) because the demo is **simulating** the Git operations rather than actually performing them.

### Enhanced Demo (Real Git Operations)

The enhanced demo performs real Git operations on the GitHub repositories. It:
1. Creates real repositories on GitHub for both players
2. Clones the repositories locally
3. Adds game files (game-ontology.ttl, world.ttl, etc.)
4. Performs real Git operations for each step (commit, push, etc.)
5. Shows a Git graph visualization of real commits
6. Displays a game state visualization

This results in the GitHub repositories containing actual game files and commit history.

## Using the Demo

1. Enter your GitHub credentials for two accounts
2. The app creates temporary repositories on GitHub
3. The demo script executes Git-RTS commands
4. You can see the commands, Git graph, and game state in real-time
5. After the demo, you can choose to delete the repositories

## Security Notes

- Your GitHub tokens are only used locally and are not stored permanently
- All repositories are created as private
- You can delete the repositories after the demo

## Running the Demo

### Step 1: Enter GitHub Credentials

You'll need two GitHub accounts with personal access tokens. To create a personal access token:

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Click "Generate new token"
3. Give it a name like "Git-RTS Demo"
4. Select the following scopes: repo, workflow
5. Click "Generate token" and copy the token

Enter the usernames and tokens for both accounts in the form.

### Step 2: Watch the Demo

Once you've entered valid credentials, the demo will start automatically:

1. The terminal will show Git-RTS commands being executed
2. The Git graph will visualize the commit history
3. The game view will show the game state

### Step 3: Clean Up

After the demo, click the "End Demo & Clean Up" button to delete the temporary repositories.

## Troubleshooting

### Common Issues

1. **Invalid Credentials**: Make sure your GitHub usernames and tokens are correct.
2. **Repository Creation Failed**: Ensure your tokens have the 'repo' scope.
3. **Socket Connection Issues**: Check that your firewall isn't blocking WebSocket connections.
4. **Git Operations Failing**: Make sure Git is installed and configured properly.

### Logs

Check the browser console and server logs for more detailed error information.

## Development

### Running in Development Mode

```bash
# Run server with nodemon (auto-restart on changes)
npm run server

# Run enhanced server with nodemon
npm run server:enhanced

# Run client in development mode
npm run client

# Run both concurrently (simulated)
npm run dev

# Run both concurrently (enhanced)
npm run dev:enhanced
```

### Building for Production

```bash
# Build client
cd client
npm run build
cd ..

# Start production server
npm start