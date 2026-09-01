import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from './useDocumentStore';

describe('useDocumentStore', () => {
  beforeEach(() => {
    useDocumentStore.getState().clear();
  });

  it('cleans and chunks pasted text into an active document', () => {
    const doc = useDocumentStore.getState().setFromText('Hello world. This is a test.');
    expect(doc).not.toBeNull();
    const state = useDocumentStore.getState();
    expect(state.document?.text).toBe('Hello world. This is a test.');
    expect(state.chunks.length).toBeGreaterThan(0);
    expect(state.startIndex).toBe(0);
  });

  it('derives a title from the first line', () => {
    useDocumentStore.getState().setFromText('A Great Title\n\nSome body text follows here.');
    expect(useDocumentStore.getState().document?.title).toBe('A Great Title');
  });

  it('returns null and clears for empty text', () => {
    const doc = useDocumentStore.getState().setFromText('   ');
    expect(doc).toBeNull();
    expect(useDocumentStore.getState().document).toBeNull();
    expect(useDocumentStore.getState().chunks).toEqual([]);
  });

  it('marks PDF source when provided', () => {
    useDocumentStore.getState().setFromText('Extracted PDF text.', { source: 'pdf', title: 'Doc' });
    expect(useDocumentStore.getState().document?.source).toBe('pdf');
  });
});
