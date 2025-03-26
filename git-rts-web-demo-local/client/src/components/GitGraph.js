import React, { useEffect, useRef } from 'react';
import { Gitgraph } from '@gitgraph/react';

function GitGraph({ commits, repositories }) {
  const graphRef = useRef(null);
  
  if (repositories.length === 0) {
    return (
      <div className="git-graph-container">
        <div className="git-graph-header">
          <span className="git-graph-title">Git Graph Visualization</span>
        </div>
        <div className="git-graph">
          <div className="git-graph-empty">
            <p>Git graph will appear here once the demo starts.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="git-graph-container">
      <div className="git-graph-header">
        <span className="git-graph-title">Git Graph Visualization</span>
      </div>
      <div className="git-graph">
        <Gitgraph options={{
          template: 'metro',
          orientation: 'vertical',
          author: 'Git-RTS Demo <demo@git-rts.com>',
        }}>
          {(gitgraph) => {
            // Create branches for each repository
            const branches = {};
            repositories.forEach(repo => {
              branches[repo.name] = gitgraph.branch(repo.name);
            });
            
            // Add initial commit to each branch
            repositories.forEach(repo => {
              branches[repo.name].commit('Initialize Git-RTS game state');
            });
            
            // Process commits
            if (commits.length > 0) {
              // Group commits by repository
              const commitsByRepo = {};
              
              commits.forEach(commit => {
                if (!commitsByRepo[commit.repository]) {
                  commitsByRepo[commit.repository] = [];
                }
                commitsByRepo[commit.repository].push(commit);
              });
              
              // Add commits to each branch
              Object.keys(commitsByRepo).forEach(repoName => {
                const repoBranch = branches[repoName];
                
                if (repoBranch) {
                  commitsByRepo[repoName].forEach(commit => {
                    if (commit.isMerge && commit.mergeFrom) {
                      const fromBranch = branches[commit.mergeFrom];
                      
                      if (fromBranch) {
                        repoBranch.merge(fromBranch, {
                          subject: commit.message,
                          author: `${commit.author} <${commit.author}@git-rts.com>`,
                        });
                      } else {
                        repoBranch.commit({
                          subject: commit.message,
                          author: `${commit.author} <${commit.author}@git-rts.com>`,
                        });
                      }
                    } else {
                      repoBranch.commit({
                        subject: commit.message,
                        author: `${commit.author} <${commit.author}@git-rts.com>`,
                      });
                    }
                  });
                }
              });
            }
          }}
        </Gitgraph>
      </div>
    </div>
  );
}

export default GitGraph;