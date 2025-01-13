/// <reference types="vitest" />
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import { AuthProvider } from '../contexts/AuthContext'

describe('Dashboard', () => {
  it('renders dashboard metrics', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
}); 