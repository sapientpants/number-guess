import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerHeader } from './PlayerHeader';
import { usePlayerStore } from '../../store/playerStore';
import type { Player } from '../../types';

const player = (id: string, name: string, overrides: Partial<Player> = {}): Player => ({
  id,
  name,
  gamesPlayed: 4,
  gamesWon: 2,
  totalGuesses: 9,
  bestGame: 3,
  averageGuesses: 4.5,
  lastPlayed: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('PlayerHeader', () => {
  const alice = player('a', 'alice');
  const bob = player('b', 'Bob');

  beforeEach(() => {
    usePlayerStore.setState({ players: [alice, bob], currentPlayer: alice });
  });

  it('shows the login screen when no player is selected', () => {
    usePlayerStore.setState({ currentPlayer: null });
    render(<PlayerHeader />);
    expect(screen.getByText('Select Player')).toBeInTheDocument();
  });

  it("summarises the current player's stats", () => {
    render(<PlayerHeader />);

    expect(screen.getByText('A')).toBeInTheDocument(); // avatar initial
    expect(screen.getByText('Games: 4')).toBeInTheDocument();
    expect(screen.getByText('Avg: 4.5')).toBeInTheDocument();
    expect(screen.getByText('Best: 3')).toBeInTheDocument();
  });

  it('hides best game and average until the player has won', () => {
    usePlayerStore.setState({
      currentPlayer: player('c', 'Carol', { bestGame: 0, averageGuesses: 0 }),
    });
    render(<PlayerHeader />);

    expect(screen.getByText('Avg: -')).toBeInTheDocument();
    expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
  });

  it('opens and closes the profile', async () => {
    render(<PlayerHeader />);

    await userEvent.click(screen.getByRole('button', { name: 'View full profile' }));
    expect(await screen.findByText('Win Rate')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '✕' }));
    await waitForElementToBeRemoved(() => screen.queryByText('Win Rate'));
  });

  it('lets the player switch to someone else', async () => {
    render(<PlayerHeader />);

    await userEvent.click(screen.getByRole('button', { name: 'Switch player' }));
    expect(screen.getByText('Switch Player')).toBeInTheDocument();
    expect(usePlayerStore.getState().currentPlayer).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Bob/ }));

    expect(usePlayerStore.getState().currentPlayer?.id).toBe('b');
    expect(screen.getByText('Games: 4')).toBeInTheDocument();
  });

  it('falls back to the first player when switching is cancelled', async () => {
    render(<PlayerHeader />);

    await userEvent.click(screen.getByRole('button', { name: 'Switch player' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(usePlayerStore.getState().currentPlayer?.id).toBe('a');
  });
});
