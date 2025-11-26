import { PubSub, Topic } from '@google-cloud/pubsub';
import * as core from '@actions/core';

export interface TopicConfig {
  topicName: string;
  skipIfExists: boolean;
  labels?: string; // JSON string
  kmsKeyName?: string;
  messageRetentionDuration?: string;
}

export interface TopicResult {
  success: boolean;
  topicName?: string;
  created?: boolean;
  error?: string;
}

/**
 * Parse labels from JSON string
 */
export function parseLabels(labelsJson: string): Record<string, string> {
  try {
    const parsed = JSON.parse(labelsJson);
    
    // Validate that all values are strings
    const labels: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'string') {
        throw new Error(
          `Label "${key}" must be a string, got ${typeof value}. ` +
          'All labels must be strings.'
        );
      }
      labels[key] = value;
    }
    
    return labels;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse labels: ${errorMessage}`);
  }
}

/**
 * Validate topic name format
 */
export function validateTopicName(topicName: string): void {
  // Topic names must:
  // - Start with a letter
  // - Contain only letters, numbers, dashes, underscores, periods, tildes, plus, and percent signs
  // - Be between 3 and 255 characters
  const topicPattern = /^[a-zA-Z][a-zA-Z0-9._~+%-]{2,254}$/;
  
  if (!topicPattern.test(topicName)) {
    throw new Error(
      `Invalid topic name: "${topicName}". ` +
      'Topic names must start with a letter and be 3-255 characters long, ' +
      'containing only letters, numbers, and ._~+%-'
    );
  }
}

/**
 * Check if topic exists
 */
export async function checkTopicExists(
  pubsub: PubSub,
  topicName: string
): Promise<{ exists: boolean; topic?: Topic }> {
  try {
    const topic = pubsub.topic(topicName);
    const [exists] = await topic.exists();
    return { exists, topic: exists ? topic : undefined };
  } catch (error) {
    core.warning(`Failed to check if topic exists: ${error instanceof Error ? error.message : String(error)}`);
    return { exists: false };
  }
}

/**
 * Parse duration string to object format
 */
export function parseDuration(duration: string): { seconds?: number; nanos?: number } {
  // Parse formats like "7d", "600s", "1h"
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) {
    throw new Error(
      `Invalid duration format: "${duration}". ` +
      'Use format like "7d" (days), "600s" (seconds), "1h" (hours), or "30m" (minutes)'
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  let seconds = 0;
  switch (unit) {
    case 'd':
      seconds = value * 86400;
      break;
    case 'h':
      seconds = value * 3600;
      break;
    case 'm':
      seconds = value * 60;
      break;
    case 's':
      seconds = value;
      break;
  }

  return { seconds };
}

/**
 * Create a Pub/Sub topic
 */
export async function createTopic(
  pubsub: PubSub,
  config: TopicConfig
): Promise<TopicResult> {
  try {
    // Validate inputs
    validateTopicName(config.topicName);

    core.info(`Topic name: ${config.topicName}`);

    // Check if topic already exists
    const existsCheck = await checkTopicExists(pubsub, config.topicName);

    if (existsCheck.exists && existsCheck.topic) {
      if (config.skipIfExists) {
        const fullName = existsCheck.topic.name;
        core.info(`✓ Topic already exists: ${fullName}`);
        core.info('Skip-if-exists is enabled, treating as success');

        return {
          success: true,
          topicName: fullName,
          created: false
        };
      } else {
        throw new Error(
          `Topic "${config.topicName}" already exists. ` +
          'Set skip-if-exists=true to succeed when topic exists.'
        );
      }
    }

    core.info('Creating new topic...');

    // Create topic
    const [topic] = await pubsub.createTopic(config.topicName);

    core.info('✓ Topic created');

    // Now set metadata if provided
    if (config.labels || config.kmsKeyName || config.messageRetentionDuration) {
      const metadata: {
        labels?: Record<string, string>;
        kmsKeyName?: string;
        messageRetentionDuration?: { seconds?: number; nanos?: number };
      } = {};

      if (config.labels) {
        metadata.labels = parseLabels(config.labels);
        core.info(`Setting labels: ${Object.keys(metadata.labels).length} label(s)`);
      }

      if (config.kmsKeyName) {
        metadata.kmsKeyName = config.kmsKeyName;
        core.info(`Setting KMS encryption: ${config.kmsKeyName}`);
      }

      if (config.messageRetentionDuration) {
        metadata.messageRetentionDuration = parseDuration(config.messageRetentionDuration);
        core.info(`Setting message retention: ${config.messageRetentionDuration}`);
      }

      await topic.setMetadata(metadata);
      core.info('✓ Metadata updated');
    }

    core.info('✓ Topic created successfully');
    core.info(`Topic name: ${topic.name}`);

    return {
      success: true,
      topicName: topic.name,
      created: true
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(`Failed to create topic: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage
    };
  }
}
