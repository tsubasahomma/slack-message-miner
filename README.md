# 📦 Slack Message Miner

**Slack Message Miner** is a TypeScript-based CLI tool that retrieves all messages — including thread replies — from a public Slack channel and saves them as **nested JSON** and **flattened CSV** files in the `output/` directory.

---

## ✨ Features

- Fetches full message history of a specified public Slack channel
- Includes all thread replies
- Output formats:
  - **Nested JSON**: replies grouped under their parent
  - **Flat CSV**: reply entries include `type = reply`, `parent_ts`, `user_id`, and `user_name`
- Channel name is included in the output file name
- Automatically handles Slack API rate limits
- Minimal setup with environment variables

---

## 📁 Output

### 📌 File name format

```
output/<channel_name>_<UNIX_TIMESTAMP>.json
output/<channel_name>_<UNIX_TIMESTAMP>.csv
```

### 🧾 JSON (Nested)

```json
[
  {
    "ts": "1711070000.000100",
    "text": "Parent message",
    "user": "U123456",
    "replies": [
      {
        "ts": "1711070005.000200",
        "text": "Reply 1",
        "user": "U789012",
        "parent_ts": "1711070000.000100"
      }
    ]
  }
]
```

### 📊 CSV (Flattened)

```csv
type,ts,parent_ts,text,user_id,user_name
parent,1711070000.000100,,Parent message,U123456,John Doe
reply,1711070005.000200,1711070000.000100,Reply 1,U789012,Jane Smith
```

In the CSV output:
- `user_id`: Slack user ID of the message sender
- `user_name`: Slack display name (fallbacks to ID if name cannot be resolved)

---

## ⚙️ Setup

### 1. Clone and install

```bash
git clone https://github.com/tsubasahomma/slack-message-miner.git
cd slack-message-miner
npm install
```

### 2. Create a Slack App

- Go to [Slack API App Management](https://api.slack.com/apps)
- Create a new app with the following **OAuth scopes**:
  - `channels:read`
  - `channels:history`
  - `users:read`
- Reference: [Slack Web API documentation](https://api.slack.com/web)

Then invite your app to the target channel:

```bash
/invite @your-app-name
```

### 3. Configure `.env`

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_CHANNEL=C1234567890   # Channel ID to fetch
PORT=3000
```

Use Slack permalink or browser DevTools to find the channel ID.

---

## ▶️ Usage

Run the CLI:

```bash
npm start
```

Internally runs:

```bash
npx tsx app.ts
```

Output files are created in the `output/` folder using the channel name and current UNIX timestamp.

---

## 🧱 Project Structure

```
slack-message-miner/
├── app.ts             # Main entry point
├── slack.ts           # Slack API logic (history, replies, channel info, user resolution)
├── transformer.ts     # Nesting and flattening logic
├── file.ts            # Writes output to JSON and CSV
├── utils.ts           # Logging and helper functions
├── output/            # Output directory
└── .env               # Environment config (excluded from git)
```

---

## 🧪 Tech Stack

- Node.js (v18+)
- TypeScript
- [Slack Bolt for JS](https://tools.slack.dev/bolt-js/getting-started/)
- [Slack Web API](https://api.slack.com/web)
- `json2csv`
- [`tsx`](https://github.com/esbuild-kit/tsx) for executing TypeScript directly

---

## ❓ FAQ

### Does this support private channels?
No. It only works with public channels where the bot has been invited.

### Why is `user` an ID, not a display name?
Slack's API returns user IDs. This tool resolves them via `users.info` and includes both `user_id` and `user_name` in the CSV.

### Are thread replies included?
Yes. Replies are fully supported and are:
- Grouped in `replies` array in the JSON output
- Flattened with `type = reply` and `parent_ts` in the CSV output

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

