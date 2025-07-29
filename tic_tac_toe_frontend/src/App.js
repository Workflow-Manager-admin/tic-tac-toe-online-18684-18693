import React, { useState, useEffect } from 'react';
import './App.css';

// Color theme constants as specified in project requirements
const COLORS = {
  accent: '#FF4081',
  primary: '#1976D2',
  secondary: '#424242',
};

const EMPTY_BOARD = Array(9).fill(null);

const PLAYER_X = 'X';
const PLAYER_O = 'O';
const GAME_MODES = {
  PVP: 'Player vs Player',
  PVC: 'Player vs Computer'
};

/**
 * Square component for the Tic Tac Toe grid cell.
 * @param {{value: string, onClick: function, highlight: boolean}} props 
 */
function Square({ value, onClick, highlight }) {
  return (
    <button
      className={`ttt-square${highlight ? ' highlight' : ''}`}
      onClick={onClick}
      style={{
        color:
          value === PLAYER_X
            ? COLORS.primary
            : value === PLAYER_O
            ? COLORS.accent
            : COLORS.secondary,
        borderColor: highlight ? COLORS.accent : COLORS.secondary,
      }}
      aria-label={value ? `Cell occupied by ${value}` : 'Empty cell'}
      tabIndex={0}
    >
      {value}
    </button>
  );
}

/**
 * Board component to render the 3x3 Tic Tac Toe grid.
 * @param {*} props 
 */
function Board({ board, onCellClick, winningLine, isBoardDisabled }) {
  return (
    <div className="ttt-board">
      {board.map((value, idx) => (
        <Square
          key={idx}
          value={value}
          onClick={() => onCellClick(idx)}
          highlight={winningLine && winningLine.includes(idx)}
          disabled={Boolean(value) || isBoardDisabled}
        />
      ))}
    </div>
  );
}

/**
 * Returns winning info if available.
 * @param {Array} squares Board state array
 * @returns {{winner: string, line: number[]}|null}
 */
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line };
    }
  }
  return null;
}

/**
 * Checks if all squares are filled (tie).
 * @param {Array} squares 
 */
function isBoardFull(squares) {
  return squares.every(val => val !== null);
}

/**
 * Returns the index of the best move for computer (O) using a simple AI.
 */
function getBestMove(board, aiMark, humanMark) {
  // Simple: Win if possible, Block if needed, otherwise random
  // Look for win
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) {
      const boardCopy = board.slice();
      boardCopy[i] = aiMark;
      if (calculateWinner(boardCopy)?.winner === aiMark) return i;
    }
  }
  // Block opponent's win
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) {
      const boardCopy = board.slice();
      boardCopy[i] = humanMark;
      if (calculateWinner(boardCopy)?.winner === humanMark) return i;
    }
  }
  // Pick center if open
  if (!board[4]) return 4;
  // Pick a random available move
  const available = board
    .map((val, idx) => (val ? null : idx))
    .filter(idx => idx !== null);
  const randIdx = Math.floor(Math.random() * available.length);
  return available[randIdx];
}

/**
 * Scoreboard component
 * @param {{scores: {X: number, O: number, ties: number}, mode: string}} props 
 */
function Scoreboard({ scores, mode }) {
  return (
    <div className="ttt-scoreboard">
      <span className="score x" style={{ color: COLORS.primary }}>
        X: {scores.X}
      </span>
      <span className="score tie" style={{ color: COLORS.secondary }}>
        &#8212; Ties: {scores.ties} &#8212;
      </span>
      <span className="score o" style={{ color: COLORS.accent }}>
        O: {scores.O}
      </span>
      <span className="score ttt-mode">{mode}</span>
    </div>
  );
}

/**
 * Game controls (New Game/Reset)
 */
function GameControls({onReset, mode, setMode, isOngoing}) {
  return (
    <div className="ttt-controls">
      <button
        className="ttt-btn"
        style={{ background: COLORS.primary, color: '#fff' }}
        onClick={onReset}
        aria-label="Start a new game"
      >
        {isOngoing ? 'Reset Game' : 'New Game'}
      </button>
      <select
        className="ttt-mode-select"
        value={mode}
        onChange={e => setMode(e.target.value)}
        aria-label="Select game mode"
      >
        <option value={GAME_MODES.PVP}>{GAME_MODES.PVP}</option>
        <option value={GAME_MODES.PVC}>{GAME_MODES.PVC}</option>
      </select>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  // State
  const [gameMode, setGameMode] = useState(GAME_MODES.PVC);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [xIsNext, setXIsNext] = useState(true);
  const [winningInfo, setWinningInfo] = useState(null); // { winner: 'X'|'O', line: [idx, idx, idx] }
  const [isTie, setTie] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, ties: 0 });
  const [theme, setTheme] = useState('light');

  // Effect: Theme application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Effect: Check game end
  useEffect(() => {
    const winInfo = calculateWinner(board);
    if (winInfo) {
      setWinningInfo(winInfo);
      setScores(prev =>
        winInfo.winner === PLAYER_X
          ? { ...prev, X: prev.X + 1 }
          : { ...prev, O: prev.O + 1 }
      );
    } else if (isBoardFull(board)) {
      setTie(true);
      setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
    }
  }, [board]);

  // Effect: Computer move (as 'O', after player 'X')
  useEffect(() => {
    if (
      gameMode === GAME_MODES.PVC &&
      !winningInfo &&
      !isTie &&
      !xIsNext // It's O's turn
    ) {
      // Timeout for a realistic feel
      const t = setTimeout(() => {
        const move = getBestMove(board, PLAYER_O, PLAYER_X);
        if (move !== undefined) handleCellClick(move);
      }, 450);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [gameMode, board, xIsNext, winningInfo, isTie]);

  // Reset game
  // PUBLIC_INTERFACE
  const handleReset = () => {
    setBoard(EMPTY_BOARD);
    setXIsNext(true);
    setWinningInfo(null);
    setTie(false);
  };

  // Change mode (reset board & scores)
  // PUBLIC_INTERFACE
  const handleModeChange = (mode) => {
    setGameMode(mode);
    setScores({ X: 0, O: 0, ties: 0 });
    handleReset();
  };

  // On cell click
  // PUBLIC_INTERFACE
  const handleCellClick = (idx) => {
    if (board[idx] || winningInfo || isTie) return;
    const newBoard = board.slice();
    newBoard[idx] = xIsNext ? PLAYER_X : PLAYER_O;
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    setTie(false);
    setWinningInfo(null);
  };

  // Announce game status message
  let status;
  if (winningInfo) {
    status = (
      <span className="ttt-status" style={{ color: COLORS.accent }}>
        Winner: {winningInfo.winner === PLAYER_X ? 'X' : 'O'}
      </span>
    );
  } else if (isTie) {
    status = (
      <span className="ttt-status" style={{ color: COLORS.secondary }}>It&rsquo;s a tie!</span>
    );
  } else {
    status = (
      <span className="ttt-status" style={{ color: xIsNext ? COLORS.primary : COLORS.accent }}>
        Next: {xIsNext ? 'X' : 'O'}
      </span>
    );
  }

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <div className="App" style={{ background: 'var(--bg-primary)' }}>
      <header className="ttt-container">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1 className="ttt-title" style={{ color: COLORS.primary }}>Tic Tac Toe</h1>
        <Scoreboard scores={scores} mode={gameMode} />
        <GameControls
          onReset={handleReset}
          mode={gameMode}
          setMode={handleModeChange}
          isOngoing={!winningInfo && !isTie}
        />
        {status}
        <Board
          board={board}
          onCellClick={handleCellClick}
          winningLine={winningInfo?.line}
          isBoardDisabled={Boolean(winningInfo) || isTie}
        />
        <p className="ttt-footer">
          {gameMode === GAME_MODES.PVC
            ? 'You are X. O is Computer.'
            : 'X and O take turns.'}
        </p>
      </header>
    </div>
  );
}

export default App;
