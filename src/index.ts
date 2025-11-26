import * as core from '@actions/core';
import { PubSub } from '@google-cloud/pubsub';
import {
  createTopic,
  TopicConfig
} from './pubsub';

async function run(): Promise<void> {
  try {
    // Get inputs
    const projectId = core.getInput('project-id', { required: true });
    const topicName = core.getInput('topic-name', { required: true });
    const skipIfExistsStr = core.getInput('skip-if-exists') || 'false';
    const labels = core.getInput('labels') || undefined;
    const kmsKeyName = core.getInput('kms-key-name') || undefined;
    const messageRetentionDuration = core.getInput('message-retention-duration') || undefined;

    core.info('GCP Pub/Sub Create Topic');
    core.info(`Project ID: ${projectId}`);
    core.info(`Topic: ${topicName}`);

    // Parse boolean values
    const skipIfExists = skipIfExistsStr.toLowerCase() === 'true';

    // Create Pub/Sub client
    const pubsub = new PubSub({ projectId });

    // Build configuration
    const config: TopicConfig = {
      topicName,
      skipIfExists,
      labels,
      kmsKeyName,
      messageRetentionDuration
    };

    // Create topic
    const result = await createTopic(pubsub, config);

    // Handle result
    if (!result.success) {
      throw new Error(result.error || 'Failed to create topic');
    }

    // Set outputs
    if (result.topicName) {
      core.setOutput('topic-name', result.topicName);
    }

    if (result.created !== undefined) {
      core.setOutput('created', String(result.created));
    }

    // Summary
    core.info('');
    core.info('='.repeat(50));
    if (result.created) {
      core.info('Topic created successfully');
    } else {
      core.info('Topic already exists (skip-if-exists enabled)');
    }
    if (result.topicName) {
      core.info(`Topic: ${result.topicName}`);
    }
    core.info('='.repeat(50));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(errorMessage);
  }
}

run();
