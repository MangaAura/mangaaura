import { describe, it, expect } from 'vitest';
import { Manga, InvalidMangaTitleError } from '@/core/entities/Manga';

describe('Manga entity', () => {
  it('creates a manga with required fields', () => {
    const { manga } = Manga.create({ title: 'Test Manga', authorId: 'user1', authorName: 'Author' });
    expect(manga.title).toBe('Test Manga');
    expect(manga.authorId).toBe('user1');
    expect(manga.authorName).toBe('Author');
    expect(manga.slug).toBeDefined();
    expect(manga.slug.value).toBe('test-manga');
    expect(manga.status).toBe('DRAFT');
    expect(manga.totalViews).toBe(0);
  });

  it('creates a manga with all fields', () => {
    const { manga } = Manga.create({
      title: 'Full Manga',
      authorId: 'user1',
      authorName: 'Author',
      description: 'A description',
      coverUrl: 'https://example.com/cover.jpg',
      tags: ['action', 'adventure'],
    });
    expect(manga.description).toBe('A description');
    expect(manga.coverUrl).toBe('https://example.com/cover.jpg');
    expect(manga.tags).toEqual(['action', 'adventure']);
  });

  it('adds a chapter', () => {
    const { manga } = Manga.create({ title: 'Chapter Test', authorId: 'user1', authorName: 'Author' });
    expect(manga.chaptersCount).toBe(0);
    manga.incrementChapters();
    expect(manga.chaptersCount).toBe(1);
    manga.incrementChapters();
    expect(manga.chaptersCount).toBe(2);
  });

  it('gets total views', () => {
    const { manga } = Manga.create({ title: 'Views Test', authorId: 'user1', authorName: 'Author' });
    expect(manga.totalViews).toBe(0);
    manga.incrementViews();
    expect(manga.totalViews).toBe(1);
    manga.incrementViews();
    manga.incrementViews();
    expect(manga.totalViews).toBe(3);
  });

  it('toJSON serialization', () => {
    const { manga } = Manga.create({
      title: 'JSON Test',
      authorId: 'user1',
      authorName: 'Author',
      description: 'Serialize me',
      tags: ['fantasy'],
    });
    const json = manga.toJSON();
    expect(json.id).toBeDefined();
    expect(json.title).toBe('JSON Test');
    expect(json.slug).toBe('json-test');
    expect(json.description).toBe('Serialize me');
    expect(json.authorId).toBe('user1');
    expect(json.authorName).toBe('Author');
    expect(json.tags).toEqual(['fantasy']);
    expect(json.totalViews).toBe(0);
    expect(json.status).toBe('DRAFT');
    expect(json.createdAt).toBeDefined();
    expect(json.updatedAt).toBeDefined();
  });

  it('throws on empty title', () => {
    expect(() => Manga.create({ title: '', authorId: 'user1', authorName: 'Author' })).toThrow(InvalidMangaTitleError);
  });

  it('emits MANGA_CREATED event on create', () => {
    const { manga, events } = Manga.create({ title: 'Event Test', authorId: 'user1', authorName: 'Author' });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('MANGA_CREATED');
    expect(events[0].payload.mangaId).toBe(manga.id);
    expect(events[0].payload.title).toBe('Event Test');
  });

  it('manages status transitions', () => {
    const { manga } = Manga.create({ title: 'Status Test', authorId: 'user1', authorName: 'Author' });
    expect(manga.status).toBe('DRAFT');
    expect(manga.isPublished()).toBe(false);

    manga.changeStatus('ONGOING');
    expect(manga.status).toBe('ONGOING');
    expect(manga.isPublished()).toBe(true);

    manga.changeStatus('COMPLETED');
    expect(manga.status).toBe('COMPLETED');
    expect(manga.isPublished()).toBe(true);
  });

  it('updates details', () => {
    const { manga } = Manga.create({ title: 'Update Test', authorId: 'user1', authorName: 'Author' });
    manga.updateDetails({
      title: 'Updated Title',
      description: 'New description',
      tags: ['updated'],
    });
    expect(manga.title).toBe('Updated Title');
    expect(manga.slug.value).toBe('updated-title');
    expect(manga.description).toBe('New description');
    expect(manga.tags).toEqual(['updated']);
  });
});
