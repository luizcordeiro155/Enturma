import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import { ComposerMedia } from './composer-media';
vi.mock('@/lib/api', () => ({ api: vi.fn().mockImplementation((url: string) => Promise.resolve(url.endsWith('/capabilities') ? {directSend: true} : [])) }));
vi.mock('./emoji-picker', () => ({ EmojiPicker: () => null }));
vi.mock('./message-action-popover', () => ({ messageActionAnchor: () => ({ x: 0, y: 0 }), MessageActionPopover: ({ children }: {children: React.ReactNode}) => <div>{children}</div> }));
vi.mock('@/lib/chat-media', () => ({ ENTURMA_GIFS: [{ id: 'test', name: 'Vamos estudar', kind: 'GIF', src: '/test.gif' }], chatMediaFile: () => Promise.resolve(new File(['GIF89a'], 'estudar.gif', { type: 'image/gif' })), saveChatMedia: vi.fn() }));
afterEach(cleanup);
it('sends the selected GIF once without staging an attachment and closes the picker', async () => {
  const send = vi.fn().mockResolvedValue(undefined), stage = vi.fn();
  render(<ComposerMedia onEmoji={() => {}} onFile={stage} onMedia={send} />);
  fireEvent.click(screen.getByRole('button', { name: 'GIFs' }));
  await waitFor(() => expect(screen.getByText(/Coleção original Enturma/)).toBeTruthy());
  fireEvent.click(await screen.findByRole('button', { name: 'Vamos estudar' }));
  await waitFor(() => expect(send).toHaveBeenCalledWith(expect.any(File), 'GIF'));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Vamos estudar' })).toBeNull());
  expect(stage).not.toHaveBeenCalled(); expect(send).toHaveBeenCalledOnce();
});
it('keeps the picker open and explains a failed send', async () => {
  render(<ComposerMedia onEmoji={() => {}} onMedia={async () => { throw Error('Sem conexão'); }} />);
  fireEvent.click(screen.getByRole('button', { name: 'GIFs' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Vamos estudar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
  expect(screen.getByRole('button', { name: 'Vamos estudar' })).not.toBeDisabled();
});
