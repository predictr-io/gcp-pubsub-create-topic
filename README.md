# GCP Pub/Sub Create Topic Action

Create Google Cloud Pub/Sub topics with optional configuration for labels, encryption, and message retention.

## Features

- ✅ Create standard Pub/Sub topics
- ✅ Skip gracefully if topic already exists
- ✅ Add labels for organization
- ✅ Configure Cloud KMS encryption
- ✅ Set message retention duration
- ✅ Full validation and error handling

## Usage

### Basic Example

```yaml
- name: Create Pub/Sub Topic
  uses: predictr-io/gcp-pubsub-create-topic@v1
  with:
    project-id: 'my-gcp-project'
    topic-name: 'events-topic'
```

### Complete Example

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_CREDENTIALS }}

- name: Create Pub/Sub Topic with Configuration
  uses: predictr-io/gcp-pubsub-create-topic@v1
  with:
    project-id: 'my-gcp-project'
    topic-name: 'events-topic'
    skip-if-exists: 'true'
    labels: '{"env": "production", "team": "backend"}'
    kms-key-name: 'projects/my-project/locations/us-central1/keyRings/my-keyring/cryptoKeys/my-key'
    message-retention-duration: '7d'
```

### With Output Usage

```yaml
- name: Create Topic
  id: create-topic
  uses: predictr-io/gcp-pubsub-create-topic@v1
  with:
    project-id: 'my-gcp-project'
    topic-name: 'events-topic'

- name: Use Topic Name
  run: |
    echo "Topic: ${{ steps.create-topic.outputs.topic-name }}"
    echo "Created: ${{ steps.create-topic.outputs.created }}"
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `project-id` | GCP project ID | Yes | - |
| `topic-name` | Pub/Sub topic name | Yes | - |
| `skip-if-exists` | Skip with success if topic exists | No | `false` |
| `labels` | Topic labels as JSON object | No | - |
| `kms-key-name` | Cloud KMS key name for encryption | No | - |
| `message-retention-duration` | Message retention duration (e.g., "7d", "600s") | No | - |

## Outputs

| Output | Description |
|--------|-------------|
| `topic-name` | Full topic name (projects/{project}/topics/{topic}) |
| `created` | Whether the topic was newly created (`true`) or already existed (`false`) |

## Authentication

This action requires GCP authentication. Use the `google-github-actions/auth` action:

```yaml
- uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_CREDENTIALS }}
```

## Required GCP Permissions

The service account needs:
- `pubsub.topics.create`
- `pubsub.topics.get`

Or the role: `roles/pubsub.editor`

## Examples

### Idempotent Topic Creation

```yaml
- name: Create Topic (Idempotent)
  uses: predictr-io/gcp-pubsub-create-topic@v1
  with:
    project-id: 'my-gcp-project'
    topic-name: 'events-topic'
    skip-if-exists: 'true'
```

### Topic with Labels

```yaml
- name: Create Labeled Topic
  uses: predictr-io/gcp-pubsub-create-topic@v1
  with:
    project-id: 'my-gcp-project'
    topic-name: 'events-topic'
    labels: '{"environment": "staging", "owner": "devops"}'
```

### Topic with Encryption

```yaml
- name: Create Encrypted Topic
  uses: predictr-io/gcp-pubsub-create-topic@v1
  with:
    project-id: 'my-gcp-project'
    topic-name: 'sensitive-events'
    kms-key-name: 'projects/my-project/locations/us-central1/keyRings/my-keyring/cryptoKeys/my-key'
```

## License

MIT
