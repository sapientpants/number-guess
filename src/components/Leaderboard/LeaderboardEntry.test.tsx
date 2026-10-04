import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardEntry } from './LeaderboardEntry';
import type { LeaderboardEntry as Entry } from '../../types';

const entry = (rank: number): Entry => ({
  playerId: `player-${rank}`,
  playerName: `Player ${rank}`,
  averageGuesses: 4.25,
  gamesPlayed: 3,
  rank,
});

const renderRow = (rank: number, isCurrentPlayer = false) =>
  render(
    <table>
      <tbody>
        <LeaderboardEntry entry={entry(rank)} isCurrentPlayer={isCurrentPlayer} index={0} />
      </tbody>
    </table>
  );

describe('LeaderboardEntry', () => {
  it.each([
    [1, '🥇'],
    [2, '🥈'],
    [3, '🥉'],
  ])('shows a medal for rank %i', (rank, medal) => {
    renderRow(rank);
    expect(screen.getByText(medal)).toBeInTheDocument();
  });

  it('shows no medal below the podium', () => {
    renderRow(4);
    expect(screen.getByRole('row')).not.toHaveTextContent(/🥇|🥈|🥉/);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows the average to one decimal place', () => {
    renderRow(5);
    expect(screen.getByText('4.3')).toBeInTheDocument();
  });

  it('marks the current player', () => {
    renderRow(2, true);
    expect(screen.getByText(/Player 2/)).toHaveTextContent('Player 2 (You)');
    expect(screen.getByRole('row')).toHaveClass('bg-purple-500/10');
  });

  it('does not mark other players', () => {
    renderRow(2);
    expect(screen.queryByText(/\(You\)/)).not.toBeInTheDocument();
  });
});
