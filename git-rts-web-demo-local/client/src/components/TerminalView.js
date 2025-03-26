import React, { useEffect, useRef, useState } from 'react';

function TerminalView({ commands }) {
  const terminalRef = useRef(null);
  const [terminalOutput, setTerminalOutput] = useState([]);
  
  // Update terminal output when commands change
  useEffect(() => {
    if (commands.length > 0) {
      const lastCommand = commands[commands.length - 1];
      
      setTerminalOutput(prev => [
        ...prev,
        { type: 'command', text: `$ ${lastCommand.command}`, player: lastCommand.player },
        { type: 'output', text: lastCommand.output, player: lastCommand.player }
      ]);
    }
  }, [commands]);
  
  // Scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);
  
  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span className="terminal-title">Git-RTS Terminal</span>
      </div>
      <div className="terminal" ref={terminalRef}>
        {terminalOutput.length === 0 ? (
          <div className="terminal-welcome">
            <p>Git-RTS Terminal</p>
            <p>----------------</p>
            <p>Demo will start after providing GitHub credentials.</p>
            <p></p>
          </div>
        ) : (
          terminalOutput.map((line, index) => (
            <div 
              key={index} 
              className={`terminal-line ${line.type} player-${line.player}`}
              style={{ 
                color: line.type === 'command' ? '#ffcc00' : '#ffffff',
                fontWeight: line.type === 'command' ? 'bold' : 'normal',
                marginBottom: line.type === 'output' ? '10px' : '0'
              }}
            >
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TerminalView;