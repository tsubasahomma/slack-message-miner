import { App } from '@slack/bolt';
import { delay, log } from './utils';

const MAX_CALLS_PER_MINUTE = 50;
const CALL_INTERVAL_MS = 1000;
const RATE_LIMIT_DELAY_MS = 9000;

export type SlackMessage = {
  ts: string;
  user?: string;
  username?: string;
  subtype?: string;
  text?: string;
  reactions?: { name: string }[];
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  parent_ts?: string;
};

/**
 * Type guard for Slack message array.
 */
const isSlackMessageArray = (data: any): data is SlackMessage[] =>
  Array.isArray(data) && data.every(item => typeof item.ts === 'string');

/**
 * Fetches the name of the channel given its ID.
 * Falls back to the channel ID if name is not available.
 */
export const getChannelName = async (app: App, channelId: string): Promise<string> => {
  try {
    const res = await app.client.conversations.info({ channel: channelId });

    // Debug log: check the actual structure of the response
    console.dir(res.channel, { depth: null });

    const channel = res.channel as {
      id: string;
      name?: string;
      name_normalized?: string;
    };

    const rawName =
      typeof channel.name === 'string'
        ? channel.name
        : typeof channel.name_normalized === 'string'
          ? channel.name_normalized
          : null;

    if (!rawName) {
      log(`❗ Channel name not found. Falling back to channel ID.`, 'channel-info');
      return channel.id;
    }

    return rawName.replace(/[^a-zA-Z0-9-_]/g, '_');
  } catch (err: any) {
    log(`Failed to get channel name: ${err.message}`, 'channel-info', true);
    return channelId;
  }
};

/**
 * Fetches all messages (top-level and thread replies) from the given channel.
 */
export const fetchAllMessagesWithThreads = async (
  app: App,
  channelId: string
): Promise<SlackMessage[]> => {
  const messages: SlackMessage[] = [];
  let cursor: string | undefined;
  let callCount = 0;

  while (true) {
    if (callCount >= MAX_CALLS_PER_MINUTE) {
      log(`Rate limit reached (history). Waiting...`, 'rate-limit');
      await delay(RATE_LIMIT_DELAY_MS);
      callCount = 0;
    }

    try {
      const result = await app.client.conversations.history({ channel: channelId, cursor });

      if (!isSlackMessageArray(result.messages)) {
        throw new Error('Invalid response (history)');
      }

      messages.push(...result.messages);
      cursor = result.response_metadata?.next_cursor;
      callCount++;

      log(`Fetched ${result.messages.length} top-level messages`, 'fetch');

      if (!result.has_more) break;
    } catch (err: any) {
      log(`Error fetching history: ${err.message}`, 'fetch-history', true);
      break;
    }

    await delay(CALL_INTERVAL_MS);
  }

  const threadReplies: SlackMessage[] = [];

  for (const msg of messages) {
    if (msg.reply_count && msg.thread_ts === msg.ts) {
      if (callCount >= MAX_CALLS_PER_MINUTE) {
        log(`Rate limit reached (replies). Waiting...`, 'rate-limit');
        await delay(RATE_LIMIT_DELAY_MS);
        callCount = 0;
      }

      try {
        const res = await app.client.conversations.replies({ channel: channelId, ts: msg.ts });

        if (!isSlackMessageArray(res.messages)) {
          throw new Error(`Invalid response (replies) for ts=${msg.ts}`);
        }

        const replies = res.messages
          .filter(r => r.ts !== msg.ts)
          .map(r => ({ ...r, parent_ts: msg.ts }));

        threadReplies.push(...replies);
        log(`Fetched ${replies.length} replies for thread ${msg.ts}`, 'fetch-thread');
      } catch (err: any) {
        log(`Error fetching thread replies: ${err.message}`, 'fetch-thread', true);
      }

      callCount++;
      await delay(CALL_INTERVAL_MS);
    }
  }

  return [...messages, ...threadReplies];
};
