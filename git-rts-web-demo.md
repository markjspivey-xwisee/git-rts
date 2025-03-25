# Git-RTS Interactive Web Demo

This document outlines the implementation of a web application that allows users to:
1. Input their own GitHub credentials (username and personal access token)
2. Watch an automated demo of Git-RTS using their credentials
3. See a real-time Git graph visualization of the game progress

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        User's Browser                           │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      Web Demo Application                       │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │                 │  │                 │  │                 │  │
│  │  Terminal View  │  │  Git Graph      │  │  Game View      │  │
│  │                 │  │  Visualization  │  │                 │  │
│  │                 │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      Backend Services                           │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │                 │  │                 │  │                 │  │
│  │  GitHub API     │  │  Git-RTS Engine │  │  Demo Script    │  │
│  │  Integration    │  │                 │  │  Executor       │  │
│  │                 │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. User Authentication Flow

1. User enters GitHub credentials for two accounts
2. Backend validates credentials via GitHub API
3. Temporary repositories are created for the demo
4. WebSocket connection is established for real-time updates

### 2. Frontend Components

- **Credential Form**: Collects GitHub usernames and tokens
- **Terminal View**: Displays Git-RTS commands and their output
- **Git Graph**: Visualizes the Git commit history in real-time
- **Game View**: Shows the current game state with units and resources

### 3. Backend Services

- **GitHub API Integration**: Creates repositories and manages commits
- **Git-RTS Engine**: Executes game commands and updates game state
- **Demo Script Executor**: Runs predefined demo steps with timing

### 4. Real-time Updates

- WebSockets provide real-time updates to the frontend
- Three types of events are broadcast:
  - Command execution (terminal output)
  - Git commits (for graph visualization)
  - Game state changes (for game view)

## Implementation Plan

### Phase 1: Basic Infrastructure

1. Set up React frontend with component structure
2. Create Express backend with GitHub API integration
3. Implement WebSocket communication

### Phase 2: Core Functionality

1. Implement credential validation and repository creation
2. Create demo script executor
3. Develop Git graph visualization

### Phase 3: Game Visualization

1. Implement game state parser
2. Create game view component
3. Add real-time updates for game state

### Phase 4: Deployment

1. Set up cloud infrastructure (AWS/Azure)
2. Configure CI/CD pipeline
3. Implement monitoring and error handling

## Security Considerations

- GitHub tokens are used only for the duration of the demo
- No credentials are stored permanently
- Repositories are created as private
- Option to delete repositories after demo completion

## User Experience

1. User visits the demo website
2. Enters GitHub credentials for two accounts
3. Demo automatically runs, showing:
   - Commands being executed in the terminal
   - Git commits appearing in the graph visualization
   - Game state updating in the game view
4. User can see how Git-RTS uses Git operations for game mechanics
5. After demo completion, user can choose to delete the created repositories

This web demo provides an interactive way to showcase Git-RTS without requiring users to install anything locally, while demonstrating the innovative use of Git as a game engine.
