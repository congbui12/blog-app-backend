import logger from '../logger/index.js';

export const syncToMeili = async (indexName, doc, client) => {
  if (!indexName || !doc || !client) {
    return;
  }
  try {
    const index = client.index(indexName);

    // Transform Mongo doc to Meili doc
    const task = await index.addDocuments([
      {
        id: doc._id.toString(),
        title: doc.title,
        textContent: doc.textContent,
        status: doc.status,
        likeCount: doc.likeCount,
        author: doc.author?.toString(),
        createdAt: doc.createdAt?.getTime(),
        updatedAt: doc.updatedAt?.getTime(),
      },
    ]);
    await client.tasks.waitForTask(task.taskUid);
  } catch (error) {
    logger.error(`Meilisearch Sync Error [ID: ${doc._id}]:`, {
      error: error.stack,
    });
  }
};

export const updateInMeili = async (indexName, id, fields, client) => {
  if (!indexName || !id || !fields || !client) {
    return;
  }

  try {
    const index = client.index(indexName);
    const task = await index.updateDocuments([
      {
        id: id.toString(),
        ...fields,
      },
    ]);

    await client.tasks.waitForTask(task.taskUid);
  } catch (error) {
    logger.error(`Meilisearch Partial Update Error [Index: ${indexName}, ID: ${id}]`, {
      error: error.stack,
    });
  }
};

export const removeFromMeili = async (indexName, id, client) => {
  if (!indexName || !id || !client) {
    return;
  }
  try {
    const index = client.index(indexName);
    const task = await index.deleteDocument(id.toString());
    await client.tasks.waitForTask(task.taskUid);
  } catch (error) {
    logger.error(`Meilisearch Delete Error [ID: ${id}]:`, {
      error: error.stack,
    });
  }
};
