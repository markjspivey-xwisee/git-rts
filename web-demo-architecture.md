# Git-RTS Web Demo Architecture

This document outlines the architecture for a web-based demonstration of Git-RTS, featuring two terminal windows running in the cloud and controlling real GitHub accounts.

## Overview

The web demo will allow visitors to:
1. Watch a live demonstration of Git-RTS with two simulated players
2. Interact with the terminals to execute custom commands
3. See the GitHub repositories update in real-time
4. View the game state through the web interface

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        User's Browser                           │
│                                                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      Demo Web Application                       │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │                 │  │                 │  │                 │  │
│  │  Terminal 1     │  │  Terminal 2     │  │  Game View      │  │
│  │  (Player 1)     │  │  (Player 2)     │  │                 │  │
│  │                 │  │                 │  │                 │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│                   │  │                   │  │                   │
│  Cloud VM 1       │  │  Cloud VM 2       │  │  Game State       │
│  (Player 1)       │  │  (Player 2)       │  │  Visualization    │
│                   │  │                   │  │                   │
└───────────┬───────┘  └───────────┬───────┘  └───────────────────┘
            │                      │
            ▼                      ▼
┌───────────────────┐  ┌───────────────────┐
│                   │  │                   │
│  GitHub Repo 1    │  │  GitHub Repo 2    │
│  (Player 1)       │  │  (Player 2)       │
│                   │  │                   │
└───────────────────┘  └───────────────────┘
```

## Components

### 1. Frontend (React Application)

```jsx
// App.jsx
import React, { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import GameView from './components/GameView';
import DemoControls from './components/DemoControls';

function App() {
  const [terminal1Output, setTerminal1Output] = useState([]);
  const [terminal2Output, setTerminal2Output] = useState([]);
  const [gameState, setGameState] = useState({});
  const [demoMode, setDemoMode] = useState('auto'); // 'auto' or 'manual'
  
  // Fetch initial state and set up WebSocket connections
  useEffect(() => {
    // Connect to backend services
    const terminal1Socket = new WebSocket('wss://demo.git-rts.com/terminal1');
    const terminal2Socket = new WebSocket('wss://demo.git-rts.com/terminal2');
    const gameStateSocket = new WebSocket('wss://demo.git-rts.com/gamestate');
    
    // Handle terminal 1 output
    terminal1Socket.onmessage = (event) => {
      const output = JSON.parse(event.data);
      setTerminal1Output(prev => [...prev, output]);
    };
    
    // Handle terminal 2 output
    terminal2Socket.onmessage = (event) => {
      const output = JSON.parse(event.data);
      setTerminal2Output(prev => [...prev, output]);
    };
    
    // Handle game state updates
    gameStateSocket.onmessage = (event) => {
      const state = JSON.parse(event.data);
      setGameState(state);
    };
    
    // Cleanup
    return () => {
      terminal1Socket.close();
      terminal2Socket.close();
      gameStateSocket.close();
    };
  }, []);
  
  // Function to send command to terminal 1
  const sendCommandToTerminal1 = (command) => {
    fetch('https://demo.git-rts.com/terminal1/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
  };
  
  // Function to send command to terminal 2
  const sendCommandToTerminal2 = (command) => {
    fetch('https://demo.git-rts.com/terminal2/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
  };
  
  // Function to start automated demo
  const startAutomatedDemo = () => {
    fetch('https://demo.git-rts.com/demo/start', { method: 'POST' });
    setDemoMode('auto');
  };
  
  // Function to switch to manual mode
  const switchToManualMode = () => {
    fetch('https://demo.git-rts.com/demo/stop', { method: 'POST' });
    setDemoMode('manual');
  };
  
  return (
    <div className="app">
      <header>
        <h1>Git-RTS Live Demo</h1>
        <DemoControls 
          mode={demoMode} 
          onStartAutomated={startAutomatedDemo}
          onSwitchToManual={switchToManualMode}
        />
      </header>
      
      <div className="main-content">
        <div className="terminals">
          <Terminal 
            title="Player 1 Terminal" 
            output={terminal1Output}
            onSendCommand={sendCommandToTerminal1}
            readOnly={demoMode === 'auto'}
          />
          <Terminal 
            title="Player 2 Terminal" 
            output={terminal2Output}
            onSendCommand={sendCommandToTerminal2}
            readOnly={demoMode === 'auto'}
          />
        </div>
        
        <GameView gameState={gameState} />
      </div>
      
      <footer>
        <p>Git-RTS: A Git-based Real-Time Strategy Game</p>
        <p>GitHub: <a href="https://github.com/markjspivey-xwisee/git-rts">https://github.com/markjspivey-xwisee/git-rts</a></p>
      </footer>
    </div>
  );
}

export default App;
```

### 2. Backend (Node.js with Express)

```javascript
// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(express.json());

// WebSocket connections
const clients = {
  terminal1: new Set(),
  terminal2: new Set(),
  gameState: new Set()
};

// Terminal processes
let terminal1Process = null;
let terminal2Process = null;

// Demo script steps
const demoSteps = require('./demoSteps');
let currentDemoStep = 0;
let demoInterval = null;

// Start terminal processes
function startTerminals() {
  // Start terminal 1 (Player 1)
  terminal1Process = spawn('ssh', ['user@vm1.git-rts.com']);
  
  terminal1Process.stdout.on('data', (data) => {
    const output = data.toString();
    clients.terminal1.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'output', content: output }));
      }
    });
  });
  
  terminal1Process.stderr.on('data', (data) => {
    const output = data.toString();
    clients.terminal1.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'error', content: output }));
      }
    });
  });
  
  // Start terminal 2 (Player 2)
  terminal2Process = spawn('ssh', ['user@vm2.git-rts.com']);
  
  terminal2Process.stdout.on('data', (data) => {
    const output = data.toString();
    clients.terminal2.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'output', content: output }));
      }
    });
  });
  
  terminal2Process.stderr.on('data', (data) => {
    const output = data.toString();
    clients.terminal2.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'error', content: output }));
      }
    });
  });
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const endpoint = url.pathname.substring(1); // Remove leading slash
  
  if (endpoint === 'terminal1') {
    clients.terminal1.add(ws);
    ws.on('close', () => clients.terminal1.delete(ws));
  } else if (endpoint === 'terminal2') {
    clients.terminal2.add(ws);
    ws.on('close', () => clients.terminal2.delete(ws));
  } else if (endpoint === 'gamestate') {
    clients.gameState.add(ws);
    ws.on('close', () => clients.gameState.delete(ws));
    
    // Send initial game state
    fetchGameState().then(state => {
      ws.send(JSON.stringify(state));
    });
  }
});

// API endpoints
app.post('/terminal1/command', (req, res) => {
  const { command } = req.body;
  if (terminal1Process && command) {
    terminal1Process.stdin.write(command + '\n');
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Terminal not available' });
  }
});

app.post('/terminal2/command', (req, res) => {
  const { command } = req.body;
  if (terminal2Process && command) {
    terminal2Process.stdin.write(command + '\n');
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Terminal not available' });
  }
});

// Start automated demo
app.post('/demo/start', (req, res) => {
  if (demoInterval) {
    clearInterval(demoInterval);
  }
  
  currentDemoStep = 0;
  
  demoInterval = setInterval(() => {
    if (currentDemoStep < demoSteps.length) {
      const step = demoSteps[currentDemoStep];
      
      if (step.terminal === 1 && terminal1Process) {
        terminal1Process.stdin.write(step.command + '\n');
      } else if (step.terminal === 2 && terminal2Process) {
        terminal2Process.stdin.write(step.command + '\n');
      }
      
      currentDemoStep++;
    } else {
      clearInterval(demoInterval);
      demoInterval = null;
    }
  }, 5000); // Execute a step every 5 seconds
  
  res.status(200).json({ success: true });
});

// Stop automated demo
app.post('/demo/stop', (req, res) => {
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
  }
  
  res.status(200).json({ success: true });
});

// Fetch game state from both repositories
async function fetchGameState() {
  // This would be implemented to fetch the current game state
  // from both repositories and combine them into a single state object
  return { /* game state */ };
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startTerminals();
});
```

### 3. Cloud Infrastructure (Terraform)

```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

# VPC and networking
resource "aws_vpc" "git_rts_demo" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "git-rts-demo-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.git_rts_demo.id
  cidr_block = "10.0.1.0/24"
  
  tags = {
    Name = "git-rts-demo-public"
  }
}

# Security group
resource "aws_security_group" "git_rts_demo" {
  name        = "git-rts-demo-sg"
  description = "Security group for Git-RTS demo"
  vpc_id      = aws_vpc.git_rts_demo.id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 instances
resource "aws_instance" "player1_vm" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.public.id
  security_groups = [aws_security_group.git_rts_demo.id]
  key_name      = "git-rts-demo-key"
  
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y git nodejs npm
              
              # Clone Git-RTS repository
              git clone https://github.com/markjspivey-xwisee/git-rts.git /home/ec2-user/git-rts
              cd /home/ec2-user/git-rts
              git checkout enhanced-p2p-new
              
              # Install dependencies
              npm install
              npm link
              
              # Set up GitHub credentials
              git config --global user.name "Git-RTS Player 1"
              git config --global user.email "player1@git-rts.com"
              
              # Create GitHub personal access token
              echo "${var.github_token_player1}" > /home/ec2-user/.github_token
              chmod 600 /home/ec2-user/.github_token
              EOF
  
  tags = {
    Name = "git-rts-player1-vm"
  }
}

resource "aws_instance" "player2_vm" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.public.id
  security_groups = [aws_security_group.git_rts_demo.id]
  key_name      = "git-rts-demo-key"
  
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y git nodejs npm
              
              # Clone Git-RTS repository
              git clone https://github.com/markjspivey-xwisee/git-rts.git /home/ec2-user/git-rts
              cd /home/ec2-user/git-rts
              git checkout enhanced-p2p-new
              
              # Install dependencies
              npm install
              npm link
              
              # Set up GitHub credentials
              git config --global user.name "Git-RTS Player 2"
              git config --global user.email "player2@git-rts.com"
              
              # Create GitHub personal access token
              echo "${var.github_token_player2}" > /home/ec2-user/.github_token
              chmod 600 /home/ec2-user/.github_token
              EOF
  
  tags = {
    Name = "git-rts-player2-vm"
  }
}

# Web server
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2
  instance_type = "t2.small"
  subnet_id     = aws_subnet.public.id
  security_groups = [aws_security_group.git_rts_demo.id]
  key_name      = "git-rts-demo-key"
  
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y git nodejs npm nginx
              
              # Clone Git-RTS demo repository
              git clone https://github.com/markjspivey-xwisee/git-rts-web-demo.git /home/ec2-user/git-rts-web-demo
              cd /home/ec2-user/git-rts-web-demo
              
              # Install dependencies
              npm install
              
              # Build frontend
              cd client
              npm install
              npm run build
              
              # Configure Nginx
              cat > /etc/nginx/conf.d/git-rts-demo.conf << 'EOL'
              server {
                  listen 80;
                  server_name demo.git-rts.com;
                  
                  location / {
                      proxy_pass http://localhost:3000;
                      proxy_http_version 1.1;
                      proxy_set_header Upgrade $http_upgrade;
                      proxy_set_header Connection 'upgrade';
                      proxy_set_header Host $host;
                      proxy_cache_bypass $http_upgrade;
                  }
              }
              EOL
              
              # Start the server
              cd /home/ec2-user/git-rts-web-demo
              npm start &
              
              # Start Nginx
              systemctl enable nginx
              systemctl start nginx
              EOF
  
  tags = {
    Name = "git-rts-web-server"
  }
}

# Variables
variable "github_token_player1" {
  description = "GitHub personal access token for Player 1"
  type        = string
  sensitive   = true
}

variable "github_token_player2" {
  description = "GitHub personal access token for Player 2"
  type        = string
  sensitive   = true
}

# Outputs
output "web_server_ip" {
  value = aws_instance.web_server.public_ip
}

output "player1_vm_ip" {
  value = aws_instance.player1_vm.public_ip
}

output "player2_vm_ip" {
  value = aws_instance.player2_vm.public_ip
}
```

### 4. Demo Script (JavaScript)

```javascript
// demoSteps.js
module.exports = [
  // Setup
  { terminal: 1, command: 'cd git-rts', delay: 1000 },
  { terminal: 2, command: 'cd git-rts', delay: 1000 },
  
  // Create game repositories
  { terminal: 1, command: 'git-rts create-game https://github.com/git-rts-demo/player1-world.git "Player 1 World"', delay: 5000 },
  { terminal: 2, command: 'git-rts create-game https://github.com/git-rts-demo/player2-world.git "Player 2 World"', delay: 5000 },
  
  // Create players
  { terminal: 1, command: 'git-rts create-player "Player1"', delay: 2000 },
  { terminal: 2, command: 'git-rts create-player "Player2"', delay: 2000 },
  
  // Install Git hooks
  { terminal: 1, command: 'git-rts hook install --all', delay: 3000 },
  { terminal: 2, command: 'git-rts hook install --all', delay: 3000 },
  
  // Add peers
  { terminal: 1, command: 'git-rts peer add "Player2" https://github.com/git-rts-demo/player2-world.git', delay: 2000 },
  { terminal: 2, command: 'git-rts peer add "Player1" https://github.com/git-rts-demo/player1-world.git', delay: 2000 },
  
  // List peers
  { terminal: 1, command: 'git-rts peer list', delay: 2000 },
  { terminal: 2, command: 'git-rts peer list', delay: 2000 },
  
  // Create units
  { terminal: 1, command: 'git-rts create-unit "infantry" 10 20', delay: 3000 },
  { terminal: 2, command: 'git-rts create-unit "archer" 30 40', delay: 3000 },
  
  // Move units
  { terminal: 1, command: 'git-rts move-unit "unit1" 15 25', delay: 3000 },
  { terminal: 2, command: 'git-rts move-unit "unit1" 35 45', delay: 3000 },
  
  // Synchronize
  { terminal: 1, command: 'git-rts peer sync --all', delay: 5000 },
  { terminal: 2, command: 'git-rts peer sync --all', delay: 5000 },
  
  // Research technologies
  { terminal: 1, command: 'git-rts research "agriculture"', delay: 3000 },
  { terminal: 2, command: 'git-rts research "mining"', delay: 3000 },
  
  // Perform diplomatic actions
  { terminal: 1, command: 'git-rts diplomacy-action "propose_trade" "Player2"', delay: 3000 },
  { terminal: 2, command: 'git-rts diplomacy-action "accept" "Player1" --action-id 1', delay: 3000 },
  
  // Create alliance
  { terminal: 1, command: 'git-rts create-alliance "Mighty Alliance" "Player2"', delay: 3000 },
  { terminal: 2, command: 'git-rts view-alliances', delay: 2000 },
  
  // Show final state
  { terminal: 1, command: 'git-rts view-game-state', delay: 3000 },
  { terminal: 2, command: 'git-rts view-game-state', delay: 3000 }
];
```

## Deployment Process

1. **Create GitHub Accounts**:
   - Create two GitHub accounts for the demo: git-rts-player1 and git-rts-player2
   - Generate personal access tokens for both accounts

2. **Set Up Cloud Infrastructure**:
   - Use Terraform to provision the infrastructure on AWS
   - Configure the VMs with the necessary software and credentials

3. **Deploy Web Application**:
   - Build and deploy the React frontend
   - Set up the Node.js backend
   - Configure WebSocket connections

4. **Configure Demo Script**:
   - Create a sequence of commands to demonstrate all features
   - Set appropriate delays between commands

5. **Set Up Domain and SSL**:
   - Register a domain (e.g., demo.git-rts.com)
   - Configure DNS to point to the web server
   - Set up SSL certificates

## Security Considerations

1. **GitHub Tokens**:
   - Store GitHub tokens securely using AWS Secrets Manager
   - Limit token permissions to only what's needed for the demo

2. **VM Access**:
   - Restrict SSH access to only necessary IPs
   - Use key-based authentication only

3. **Web Application**:
   - Implement rate limiting
   - Validate all user input
   - Use HTTPS for all connections

## Maintenance

1. **Automated Backups**:
   - Set up daily backups of the VMs
   - Back up GitHub repositories

2. **Monitoring**:
   - Set up CloudWatch alarms for resource utilization
   - Monitor for failed demo runs

3. **Updates**:
   - Regularly update the Git-RTS codebase
   - Keep the OS and dependencies up to date

## Cost Estimate

- 3 t2.micro EC2 instances: ~$30/month
- Domain registration: ~$12/year
- Data transfer: ~$5/month
- Total: ~$40/month

## Future Enhancements

1. **Interactive Demo**:
   - Allow visitors to modify the demo script
   - Create custom scenarios

2. **Multiple Demo Instances**:
   - Support multiple concurrent demos
   - Allow visitors to create their own private demos

3. **Integration with Game View**:
   - Show real-time updates in the game view
   - Animate unit movements and actions

4. **Recording and Playback**:
   - Record demo sessions
   - Allow playback of previous demos