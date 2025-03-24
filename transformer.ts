import { SlackMessage } from './slack';

export type NestedMessage = SlackMessage & {
  replies?: SlackMessage[];
};

export type CsvRow = {
  type: 'parent' | 'reply';
  ts: string;
  parent_ts: string;
  text: string;
};

/**
 * Converts a flat list of Slack messages into a nested structure,
 * grouping replies under their respective parent messages.
 */
export const transformToNested = (messages: SlackMessage[]): NestedMessage[] => {
  const parents: Record<string, NestedMessage> = {};
  const replies: SlackMessage[] = [];

  for (const msg of messages) {
    if (msg.parent_ts) {
      replies.push(msg);
    } else {
      parents[msg.ts] = { ...msg, replies: [] };
    }
  }

  for (const reply of replies) {
    const parent = parents[reply.parent_ts!];
    if (parent) {
      parent.replies!.push(reply);
    } else {
      // Fallback for orphaned replies (no matching parent found)
      parents[reply.ts] = { ...reply };
    }
  }

  return Object.values(parents);
};

/**
 * Flattens a nested message structure for CSV output,
 * adding a "type" column to indicate parent or reply.
 */
export const flattenForCsv = (nested: NestedMessage[]): CsvRow[] => {
  const rows: CsvRow[] = [];

  for (const msg of nested) {
    rows.push({
      type: 'parent',
      ts: msg.ts,
      parent_ts: '',
      text: msg.text || ''
    });

    for (const reply of msg.replies || []) {
      rows.push({
        type: 'reply',
        ts: reply.ts,
        parent_ts: msg.ts,
        text: reply.text || ''
      });
    }
  }

  return rows;
};
