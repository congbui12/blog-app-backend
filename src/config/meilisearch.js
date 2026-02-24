import { MeiliSearch } from 'meilisearch';
import logger from '../utils/logger/index.js';

export const createMeiliClient = (host, apiKey) => {
  if (!host) {
    throw new Error('Missing Meili host');
  }
  return new MeiliSearch({
    host,
    apiKey,
  });
};

export const setupMeili = async (client) => {
  try {
    const postIndex = client.index('posts');

    const task = await postIndex.updateSettings({
      filterableAttributes: ['status'],
      sortableAttributes: ['likeCount', 'createdAt'],
      searchableAttributes: ['title', 'textContent'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 3,
          twoTypos: 6,
        },
      },
    });
    await client.tasks.waitForTask(task.taskUid);
    logger.info('Meilisearch settings synchronized');
  } catch (error) {
    logger.error('Meilisearch setup failed', {
      error: error.stack,
    });
  }
};
