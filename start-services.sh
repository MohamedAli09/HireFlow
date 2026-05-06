#!/bin/bash

SESSION="hireflow"

# Kill existing session if any
tmux kill-session -t $SESSION 2>/dev/null

# Create new session with the first service
tmux new-session -d -s $SESSION -n auth "npm run start:dev -- auth; read" 

# Enable mouse support on the session
tmux set-option -t $SESSION mouse on

# Add a window per service
tmux new-window -t $SESSION -n jobs          "npm run start:dev -- jobs; read"
tmux new-window -t $SESSION -n applications  "npm run start:dev -- applications; read"
tmux new-window -t $SESSION -n interviews    "npm run start:dev -- interviews; read"
tmux new-window -t $SESSION -n notifications "npm run start:dev -- notifications; read"
tmux new-window -t $SESSION -n gateway       "npm run start:dev -- gateway; read"

# Focus the first window
tmux select-window -t $SESSION:auth

# Attach to the session
tmux attach-session -t $SESSION
