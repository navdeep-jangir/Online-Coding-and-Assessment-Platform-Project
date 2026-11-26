import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DifficultyBadge from '@/components/common/DifficultyBadge';
import EmptyState from '@/components/common/EmptyState';
import { Inbox } from 'lucide-react';

describe('CodeClimb Common UI Components', () => {
  it('renders DifficultyBadge with correct label', () => {
    render(
      <>
        <DifficultyBadge difficulty="Easy" />
        <DifficultyBadge difficulty="Medium" />
        <DifficultyBadge difficulty="Hard" />
      </>
    );
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('renders EmptyState with title and description', () => {
    render(
      <MemoryRouter>
        <EmptyState
          icon={Inbox}
          title="No items found"
          description="Try adjusting your filters."
        />
      </MemoryRouter>
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument();
  });
});
