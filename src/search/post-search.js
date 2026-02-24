import { POST_STATUSES } from '../constants/post.js';
import { buildMeiliSort } from '../utils/db/query-builder.js';

export function performPostSearch(client, params, { limit, skip }) {
  if (!client) {
    throw new Error('Meilisearch not initialized');
  }
  return client.index('posts').search(params.term, {
    limit,
    offset: skip,
    filter: `status = "${POST_STATUSES.PUBLISHED}"`,
    // Use Meilisearch sorting (requires setting sortableAttributes)
    sort: params.sortedBy ? [buildMeiliSort(params.sortedBy)] : ['createdAt:desc'],
    // Tell Meili which fields to wrap in tags
    attributesToHighlight: ['title'],
    // Customize the tags (default is <em>)
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
  });
}
