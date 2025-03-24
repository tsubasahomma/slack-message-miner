import dotenv from 'dotenv';
dotenv.config();

import pkg from '@slack/bolt';
import { ensureOutputDir, saveNestedToFile } from './file';
import { fetchAllMessagesWithThreads, getChannelName } from './slack';
import { transformToNested } from './transformer';
import { log } from './utils';

const { App } = pkg;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!
});

(async () => {
  await app.start(Number(process.env.PORT) || 3000);
  log('⚡️ Slack Message Miner is running!');

  await ensureOutputDir();

  const channelId = process.env.SLACK_CHANNEL!;
  const channelName = await getChannelName(app, channelId);

  const allMessages = await fetchAllMessagesWithThreads(app, channelId);
  const nestedMessages = transformToNested(allMessages);

  await saveNestedToFile(channelName, nestedMessages);
})();
