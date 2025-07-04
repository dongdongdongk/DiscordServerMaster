# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Discord bot project built with Node.js and the Discord.js library (v14). The bot provides server management, user activity tracking, and entertainment features for Discord servers.

## Key Features & Architecture

### Core Functionality
- **Server Member Tracking**: Monitors user join/leave events and tracks time spent in server
- **Voice Channel Monitoring**: Tracks voice channel activity and duration
- **Message Logging**: Logs message deletions and activities
- **Entertainment Features**: YouTube search, Google search, meme/gif sharing, Steam sales info
- **Moderation**: Mass voice channel kick functionality
- **Interactive Questions**: Automated and manual random question system

### File Structure
- `index.js` - Main bot file containing all functionality
- `package.json` - Dependencies (discord.js v14, axios, cheerio)
- `bot.txt` - Question database (550 philosophical questions)
- `node_modules/` - Dependencies

### Key Configuration
- Bot token and API keys are hardcoded in index.js (lines 18-19, 28)
- Log channel ID: `1180447831388069888` (line 16)
- Voice text channel ID: `1167054317774188605` (line 25)
- Giphy API key for meme functionality (line 28)

## Common Development Commands

### Running the Bot
```bash
node index.js
```

### Package Management
```bash
npm install          # Install dependencies
npm update          # Update dependencies
```

### Dependencies
- `discord.js`: Discord API wrapper
- `axios`: HTTP requests for web scraping
- `cheerio`: HTML parsing for web scraping

## Bot Commands & Triggers

### Text Commands
- `봇 기능` - Shows all available bot features
- `봇 질문` - Sends random question from bot.txt
- `유튜브 검색 [query]` - YouTube search functionality
- `구글 검색 [query]` - Google search links
- `짤방` or `밈` - Random meme/gif via Giphy API
- `스팀 할인` - Steam sales information
- `서버 시간` - Shows user's server time
- `all퇴장` - Kicks all users from voice channel (requires voice channel membership)

### Automatic Features
- Server join/leave notifications with @everyone mentions
- Voice channel activity tracking
- Message deletion logging
- Random questions every 60 minutes (line 344)

## Data Storage

### In-Memory Storage
- `userJoinTimes` - Map of user IDs to join timestamps
- `userVoiceJoinTimes` - Map of user IDs to voice channel join times
- `questions` - Array loaded from bot.txt file

### External Data
- `bot.txt` - 550 philosophical questions, one per line
- Questions are loaded on bot startup and reloaded as needed

## Important Notes

### Security Considerations
- Bot token is exposed in source code (line 19)
- API keys are hardcoded
- No input validation on search queries
- @everyone mentions are automatically triggered

### Limitations
- No database persistence - all data lost on restart
- Single file architecture - all functionality in index.js
- Hardcoded channel IDs limit portability
- No error handling for missing files or network issues

### Dependencies & External Services
- Requires Discord.js v14 compatibility
- Uses Giphy API for meme functionality
- Scrapes YouTube and Steam websites directly
- No rate limiting implemented

## Development Guidelines

When working with this codebase:

1. **Configuration**: Update hardcoded IDs and tokens in index.js for your server
2. **Question Management**: Modify bot.txt to add/remove questions
3. **Feature Extension**: Add new commands in the messageCreate event handler
4. **Testing**: Test in a development Discord server before production
5. **Security**: Move sensitive tokens to environment variables
6. **Error Handling**: Add try-catch blocks for external API calls
7. **Persistence**: Consider adding database for user data persistence

## Troubleshooting

Common issues:
- Bot not responding: Check token validity and bot permissions
- Missing questions: Verify bot.txt file exists and is readable
- Voice commands failing: Check bot has voice channel permissions
- API failures: Verify Giphy API key and network connectivity