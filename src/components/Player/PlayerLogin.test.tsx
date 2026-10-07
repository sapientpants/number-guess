import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerLogin } from './PlayerLogin';
import { usePlayerStore } from '../../store/playerStore';
import { useGameStore } from '../../store/gameStore';
import type { Game, Player } from '../../types';

const player = (id: string, name: string, overrides: Partial<Player> = {}): Player => ({
  id,
  name,
  gamesPlayed: 2,
  gamesWon: 1,
  totalGuesses: 4,
  bestGame: 4,
  averageGuesses: 4,
  lastPlayed: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const inProgressGame = (playerId: string): Game => ({
  id: 'game-1',
  playerId,
  targetNumber: 50,
  guesses: [10],
  isComplete: false,
  startedAt: new Date('2026-01-01T00:00:00.000Z'),
  status: 'playing',
});

describe('PlayerLogin', () => {
  beforeEach(() => {
    usePlayerStore.setState({ players: [], currentPlayer: null });
    useGameStore.getState().resetGame();
  });

  describe('player selection', () => {
    it('invites the user to create a player when there are none', () => {
      render(<PlayerLogin />);
      expect(screen.getByText('Select Player')).toBeInTheDocument();
      expect(screen.getByText('No players yet. Create one to start playing!')).toBeInTheDocument();
    });

    it('lists players most recently played first', () => {
      usePlayerStore.setState({
        players: [
          player('a', 'Older', { lastPlayed: new Date('2026-01-01T00:00:00.000Z') }),
          player('b', 'Newer', { lastPlayed: new Date('2026-03-01T00:00:00.000Z') }),
          player('c', 'Rookie', { averageGuesses: 0, gamesPlayed: 0 }),
        ],
      });
      render(<PlayerLogin />);

      const names = screen.getAllByRole('button').map((b) => b.textContent);
      expect(names[0]).toContain('Newer');
      expect(names[1]).toContain('Older');
      expect(screen.getByText(/0 games • Avg: N\/A/)).toBeInTheDocument();
    });

    it('selects a player and notifies the parent', async () => {
      const onPlayerSelected = vi.fn();
      usePlayerStore.setState({ players: [player('a', 'Alice')] });
      render(<PlayerLogin onPlayerSelected={onPlayerSelected} />);

      await userEvent.click(screen.getByRole('button', { name: /Alice/ }));

      expect(usePlayerStore.getState().currentPlayer?.id).toBe('a');
      expect(onPlayerSelected).toHaveBeenCalledOnce();
    });

    it("resets another player's game in progress when switching", async () => {
      usePlayerStore.setState({ players: [player('a', 'Alice'), player('b', 'Bob')] });
      useGameStore.setState({ currentGame: inProgressGame('a'), gameStatus: 'playing' });
      render(<PlayerLogin />);

      await userEvent.click(screen.getByRole('button', { name: /Bob/ }));

      expect(useGameStore.getState().gameStatus).toBe('idle');
      expect(useGameStore.getState().currentGame).toBeNull();
    });

    it("keeps the same player's game in progress", async () => {
      usePlayerStore.setState({ players: [player('a', 'Alice')] });
      useGameStore.setState({ currentGame: inProgressGame('a'), gameStatus: 'playing' });
      render(<PlayerLogin />);

      await userEvent.click(screen.getByRole('button', { name: /Alice/ }));

      expect(useGameStore.getState().gameStatus).toBe('playing');
    });
  });

  describe('creating a player', () => {
    const openForm = async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Create New Player' }));
      return screen.getByPlaceholderText('Enter your name');
    };

    it('creates and selects a new player', async () => {
      const onPlayerSelected = vi.fn();
      render(<PlayerLogin onPlayerSelected={onPlayerSelected} />);

      await userEvent.type(await openForm(), 'Charlie');
      await userEvent.click(screen.getByRole('button', { name: 'Create Player' }));

      expect(usePlayerStore.getState().currentPlayer?.name).toBe('Charlie');
      expect(onPlayerSelected).toHaveBeenCalledOnce();
    });

    it('focuses the name field when the form opens', async () => {
      render(<PlayerLogin />);
      expect(await openForm()).toHaveFocus();
    });

    it.each([
      ['', 'Please enter your name'],
      ['A', 'Name must be at least 2 characters'],
      ['A'.repeat(21), 'Name must be less than 20 characters'],
    ])('rejects %j', async (name, message) => {
      render(<PlayerLogin />);
      const input = await openForm();
      if (name) await userEvent.type(input, name);
      await userEvent.click(screen.getByRole('button', { name: 'Create Player' }));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(usePlayerStore.getState().players).toHaveLength(0);
    });

    it('returns to the player list on cancel', async () => {
      render(<PlayerLogin />);
      await openForm();
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByText('Select Player')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter your name')).not.toBeInTheDocument();
    });
  });

  describe('with a current player', () => {
    beforeEach(() => {
      const alice = player('a', 'Alice', { gamesPlayed: 5, averageGuesses: 3.456 });
      usePlayerStore.setState({ players: [alice], currentPlayer: alice });
    });

    it('welcomes the player back with a summary', () => {
      render(<PlayerLogin />);
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3.5')).toBeInTheDocument();
    });

    it('opens and closes the full profile', async () => {
      render(<PlayerLogin />);

      await userEvent.click(screen.getByRole('button', { name: 'View Full Profile' }));
      expect(screen.getByText('Win Rate')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: '✕' }));
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });

    it('clears the selection on switch', async () => {
      render(<PlayerLogin />);
      await userEvent.click(
        within(screen.getByText('Welcome back!').parentElement!).getByRole('button', {
          name: 'Switch Player',
        })
      );
      expect(usePlayerStore.getState().currentPlayer).toBeNull();
    });
  });
});
