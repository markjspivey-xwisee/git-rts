// Demo steps for Git-RTS web demo
// Each step represents a command to be executed in the demo

module.exports = [
  // Setup
  {
    player: 1,
    command: 'git-rts create-game https://github.com/player1/git-rts-demo.git "Player 1 World"',
    output: 'Creating new Git-RTS game...\nInitializing game repository...\nGame created successfully!',
    createsCommit: true,
    commitMessage: 'Initialize Git-RTS game state',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts create-game https://github.com/player2/git-rts-demo.git "Player 2 World"',
    output: 'Creating new Git-RTS game...\nInitializing game repository...\nGame created successfully!',
    createsCommit: true,
    commitMessage: 'Initialize Git-RTS game state',
    updatesGameState: true
  },
  
  // Create players
  {
    player: 1,
    command: 'git-rts create-player "Player1"',
    output: 'Creating new player: Player1\nPlayer created successfully!',
    createsCommit: true,
    commitMessage: 'Create player: Player1',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts create-player "Player2"',
    output: 'Creating new player: Player2\nPlayer created successfully!',
    createsCommit: true,
    commitMessage: 'Create player: Player2',
    updatesGameState: true
  },
  
  // Install Git hooks
  {
    player: 1,
    command: 'git-rts hook install --all',
    output: 'Installing Git hooks...\npre-commit hook installed\npost-commit hook installed\nAll hooks installed successfully!',
    createsCommit: false
  },
  {
    player: 2,
    command: 'git-rts hook install --all',
    output: 'Installing Git hooks...\npre-commit hook installed\npost-commit hook installed\nAll hooks installed successfully!',
    createsCommit: false
  },
  
  // Add peers
  {
    player: 1,
    command: 'git-rts peer add "Player2" https://github.com/player2/git-rts-demo.git',
    output: 'Adding peer: Player2\nPeer added successfully!',
    createsCommit: true,
    commitMessage: 'Add peer: Player2',
    updatesGameState: false
  },
  {
    player: 2,
    command: 'git-rts peer add "Player1" https://github.com/player1/git-rts-demo.git',
    output: 'Adding peer: Player1\nPeer added successfully!',
    createsCommit: true,
    commitMessage: 'Add peer: Player1',
    updatesGameState: false
  },
  
  // List peers
  {
    player: 1,
    command: 'git-rts peer list',
    output: 'Peers:\n- Player2 (https://github.com/player2/git-rts-demo.git)',
    createsCommit: false
  },
  {
    player: 2,
    command: 'git-rts peer list',
    output: 'Peers:\n- Player1 (https://github.com/player1/git-rts-demo.git)',
    createsCommit: false
  },
  
  // Create units
  {
    player: 1,
    command: 'git-rts create-unit "settler" 2 3',
    output: 'Creating new settler unit at (2,3)...\nUnit created successfully!',
    createsCommit: true,
    commitMessage: 'Create settler unit at (2,3)',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts create-unit "settler" 7 6',
    output: 'Creating new settler unit at (7,6)...\nUnit created successfully!',
    createsCommit: true,
    commitMessage: 'Create settler unit at (7,6)',
    updatesGameState: true
  },
  
  // Synchronize
  {
    player: 1,
    command: 'git-rts peer sync --all',
    output: 'Synchronizing with all peers...\nSynchronizing with Player2...\nPulling changes...\nMerging changes...\nSynchronization complete!',
    createsCommit: true,
    commitMessage: 'Merge changes from Player2',
    isMerge: true,
    mergeFrom: 'Player2',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts peer sync --all',
    output: 'Synchronizing with all peers...\nSynchronizing with Player1...\nPulling changes...\nMerging changes...\nSynchronization complete!',
    createsCommit: true,
    commitMessage: 'Merge changes from Player1',
    isMerge: true,
    mergeFrom: 'Player1',
    updatesGameState: true
  },
  
  // Create combat units
  {
    player: 1,
    command: 'git-rts create-unit "warrior" 3 4 --attack 5 --defense 3',
    output: 'Creating new warrior unit at (3,4)...\nUnit created successfully!',
    createsCommit: true,
    commitMessage: 'Create warrior unit at (3,4)',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts create-unit "archer" 6 5 --attack 7 --defense 2',
    output: 'Creating new archer unit at (6,5)...\nUnit created successfully!',
    createsCommit: true,
    commitMessage: 'Create archer unit at (6,5)',
    updatesGameState: true
  },
  
  // Research technologies
  {
    player: 1,
    command: 'git-rts research "agriculture"',
    output: 'Researching agriculture...\nResearch started!',
    createsCommit: true,
    commitMessage: 'Start research: agriculture',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts research "mining"',
    output: 'Researching mining...\nResearch started!',
    createsCommit: true,
    commitMessage: 'Start research: mining',
    updatesGameState: true
  },
  
  // Advance turns to complete research
  {
    player: 1,
    command: 'git-rts advance-turn 5',
    output: 'Advancing 5 turns...\nTurn 1: Resources gathered\nTurn 2: Resources gathered\nTurn 3: Resources gathered\nTurn 4: Resources gathered\nTurn 5: Resources gathered\nResearch complete: agriculture!',
    createsCommit: true,
    commitMessage: 'Complete research: agriculture',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts advance-turn 5',
    output: 'Advancing 5 turns...\nTurn 1: Resources gathered\nTurn 2: Resources gathered\nTurn 3: Resources gathered\nTurn 4: Resources gathered\nTurn 5: Resources gathered\nResearch complete: mining!',
    createsCommit: true,
    commitMessage: 'Complete research: mining',
    updatesGameState: true
  },
  
  // Synchronize again
  {
    player: 1,
    command: 'git-rts peer sync --all',
    output: 'Synchronizing with all peers...\nSynchronizing with Player2...\nPulling changes...\nMerging changes...\nSynchronization complete!',
    createsCommit: true,
    commitMessage: 'Merge changes from Player2',
    isMerge: true,
    mergeFrom: 'Player2',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts peer sync --all',
    output: 'Synchronizing with all peers...\nSynchronizing with Player1...\nPulling changes...\nMerging changes...\nSynchronization complete!',
    createsCommit: true,
    commitMessage: 'Merge changes from Player1',
    isMerge: true,
    mergeFrom: 'Player1',
    updatesGameState: true
  },
  
  // Perform diplomatic actions
  {
    player: 1,
    command: 'git-rts diplomacy-action "propose_trade" "Player2"',
    output: 'Proposing trade agreement to Player2...\nProposal sent!',
    createsCommit: true,
    commitMessage: 'Propose trade agreement to Player2',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts diplomacy-action "accept" "Player1" --action-id 1',
    output: 'Accepting trade agreement from Player1...\nTrade agreement established!',
    createsCommit: true,
    commitMessage: 'Accept trade agreement from Player1',
    updatesGameState: true
  },
  
  // Create alliance
  {
    player: 1,
    command: 'git-rts create-alliance "Mighty Alliance" "Player2"',
    output: 'Creating alliance: Mighty Alliance\nInviting Player2...\nAlliance created!',
    createsCommit: true,
    commitMessage: 'Create alliance: Mighty Alliance',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts view-alliances',
    output: 'Alliances:\n- Mighty Alliance (with Player1)',
    createsCommit: false
  },
  
  // Final synchronization
  {
    player: 1,
    command: 'git-rts peer sync --all',
    output: 'Synchronizing with all peers...\nSynchronizing with Player2...\nPulling changes...\nMerging changes...\nSynchronization complete!',
    createsCommit: true,
    commitMessage: 'Merge changes from Player2',
    isMerge: true,
    mergeFrom: 'Player2',
    updatesGameState: true
  },
  {
    player: 2,
    command: 'git-rts peer sync --all',
    output: 'Synchronizing with all peers...\nSynchronizing with Player1...\nPulling changes...\nMerging changes...\nSynchronization complete!',
    createsCommit: true,
    commitMessage: 'Merge changes from Player1',
    isMerge: true,
    mergeFrom: 'Player1',
    updatesGameState: true
  }
];