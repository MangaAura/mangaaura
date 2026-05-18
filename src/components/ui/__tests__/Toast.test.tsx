import * as ToastPrimitives from '@radix-ui/react-toast';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ToastProvider, useToast, Toast, ToastTitle, ToastClose } from '../Toast';


function TestConsumer() {
  const { toast } = useToast();
  return <button onClick={() => toast({ title: 'Hello' })}>Show Toast</button>;
}

describe('Toast', () => {
  it('renders a toast when show is called', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders toast title and description', () => {
    render(
      <ToastProvider>
        <ToastShowButton title="Success" description="Operation completed" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('renders close button on toast', () => {
    render(
      <ToastPrimitives.Provider>
        <Toast open={true}>
          <ToastTitle>Message</ToastTitle>
          <ToastClose />
        </Toast>
        <ToastPrimitives.Viewport />
      </ToastPrimitives.Provider>
    );
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

function ToastShowButton({ title, description }: { title: string; description?: string }) {
  const { toast } = useToast();
  return <button onClick={() => toast({ title, description })}>Show</button>;
}
