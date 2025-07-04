const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require("discord.js");
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, // 음성 상태 Intent 추가
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// 환경 변수에서 값들을 가져옵니다
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;

// 유저 입장 시간 기록용 (메모리)
const userJoinTimes = new Map();

const VOICE_TEXT_CHANNEL_ID = process.env.VOICE_TEXT_CHANNEL_ID;
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

// 음성 채널 입장 시간 기록용 (메모리)
const userVoiceJoinTimes = new Map();

let questions = [];

function loadQuestions() {
  try {
    const data = fs.readFileSync('/mnt/f/2024WebProject/DiscordServerMaster/bot.txt', 'utf8');
    questions = data.split('\n').filter(line => line.trim() !== '');
    console.log(`[INFO] ${questions.length}개의 질문을 불러왔습니다.`);
    if (questions.length === 0) {
        console.log('[WARN] bot.txt 파일이 비어있거나 질문이 없습니다.');
    }
  } catch (err) {
    console.error('[ERROR] bot.txt 파일을 읽는 중 오류가 발생했습니다.', err);
    questions = []; // 오류 발생 시 질문 목록 초기화
  }
}

async function sendRandomQuestion(channel) {
  if (!channel) return;
  if (questions.length === 0) {
    await channel.send('질문 목록이 비어있습니다. bot.txt 파일을 확인해주세요.');
    return;
  }
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
  await channel.send(`🤖 **질문!** ${randomQuestion}`);
}


// 서버 입장
client.on("guildMemberAdd", async (member) => {
  console.log(`[DEBUG] ${member.displayName}님이 서버에 입장했습니다.`);
  userJoinTimes.set(member.id, Date.now());
  const logChannel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
  if (logChannel) {
    await logChannel.send(
      `🎉 ${member.displayName}님이 서버에 입장했습니다.\n📢 모두에게 알립니다! @everyone`
    );
  } else {
    console.log("[DEBUG] 로그 채널을 찾지 못했습니다.");
  }
});

// 서버 퇴장
client.on("guildMemberRemove", async (member) => {
  const joinTime = userJoinTimes.get(member.id);
  let stayMsg = "";
  if (joinTime) {
    const diff = Date.now() - joinTime;
    const mins = Math.floor(diff / 60000) % 60;
    const hours = Math.floor(diff / 3600000);
    stayMsg = `\n${member.displayName}님이 총 ${hours}시간 ${mins}분 머물렀습니다.`;
    userJoinTimes.delete(member.id);
  }
  const logChannel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
  if (logChannel) {
    await logChannel.send(
      `👋 ${member.displayName}님이 서버에서 나갔습니다.${stayMsg}`
    );
  }
});

// 음성 채널 입장/퇴장 감지
client.on("voiceStateUpdate", async (oldState, newState) => {
  // 입장: oldState.channel이 없고, newState.channel이 있으면 입장
  if (!oldState.channel && newState.channel) {
    userVoiceJoinTimes.set(newState.id, Date.now());
    const logChannel = newState.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send(
        `🎤 ${newState.member.displayName}님이 음성 채널 **${newState.channel.name}**에 입장했습니다.\n📢 모두에게 알립니다! @everyone`
      );
    }
  }
  // 퇴장: oldState.channel이 있고, newState.channel이 없으면 퇴장
  if (oldState.channel && !newState.channel) {
    const joinTime = userVoiceJoinTimes.get(oldState.id);
    let stayMsg = "";
    if (joinTime) {
      const diff = Date.now() - joinTime;
      const mins = Math.floor(diff / 60000) % 60;
      const hours = Math.floor(diff / 3600000);
      stayMsg = `\n${oldState.member.displayName}님이 음성 채널에 총 ${hours}시간 ${mins}분 머물렀습니다.`;
      userVoiceJoinTimes.delete(oldState.id);
    }
    const logChannel = oldState.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send(
        `👋 ${oldState.member.displayName}님이 음성 채널 **${oldState.channel.name}**에서 나갔습니다.${stayMsg}`
      );
    }
  }
});

const axios = require("axios");
const cheerio = require("cheerio");

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  if (message.content === "봇 질문") {
    sendRandomQuestion(message.channel);
    return; // 다른 명령어와 중복 실행 방지
  }

  // 유튜브 검색 기능
  if (message.content.startsWith("유튜브 검색 ")) {
    const query = message.content.replace("유튜브 검색 ", "").trim();
    if (!query) {
      await message.reply("검색어를 입력해주세요!");
      return;
    }

    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        query
      )}`;
      const { data } = await axios.get(searchUrl);
      // 정규식으로 videoId 추출
      const match = data.match(/\"videoId\":\"([a-zA-Z0-9_-]{11})\"/);
      if (match && match[1]) {
        const videoUrl = `https://www.youtube.com/watch?v=${match[1]}`;
        await message.reply(`🔎 \"${query}\" 유튜브 검색 결과:\n${videoUrl}`);
      } else {
        await message.reply("검색 결과를 찾을 수 없습니다.");
      }
    } catch (err) {
      await message.reply("유튜브 검색 중 오류가 발생했습니다.");
    }
  }

  // 구글 검색 기능
  if (message.content.startsWith("구글 검색 ")) {
    const query = message.content.replace("구글 검색 ", "").trim();
    if (!query) {
      await message.reply("검색어를 입력해주세요!");
      return;
    }
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}`;
    await message.reply(`🔎 \"${query}\" 구글 검색 결과 페이지:\n${searchUrl}`);
  }

  // 짤방/밈 랜덤 전송 기능
  if (message.content === "짤방" || message.content === "밈") {
    if (!GIPHY_API_KEY || GIPHY_API_KEY === "") {
      await message.reply("Giphy API 키가 설정되어 있지 않습니다.");
      return;
    }
    try {
      const apiUrl = `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=meme&rating=pg-13`;
      const { data } = await axios.get(apiUrl);
      const imageUrl = data.data.images?.original?.url;
      if (imageUrl) {
        await message.reply({
          content: "랜덤 밈 짤방입니다!",
          files: [imageUrl],
        });
      } else {
        await message.reply("짤방을 가져오지 못했습니다.");
      }
    } catch (err) {
      console.error("[GIPHY ERROR]", err);
      await message.reply("짤방을 가져오는 중 오류가 발생했습니다.");
    }
  }

  // 스팀 할인 기능
  if (message.content === "스팀 할인") {
    try {
      const { data } = await axios.get(
        "https://store.steampowered.com/api/featuredcategories"
      );
      const specials = data.specials.items;
      if (!specials || specials.length === 0) {
        await message.reply("현재 할인 중인 게임 정보를 찾을 수 없습니다.");
        return;
      }
      // 최대 50개까지만 출력
      const maxCount = Math.min(specials.length, 50);
      const topDiscounts = specials
        .slice(0, maxCount)
        .map((game) => {
          return `🎮 [${game.name}](https://store.steampowered.com/app/${
            game.id
          })\n- 할인율: ${game.discount_percent}%\n- 현재가: ${
            game.final_price / 100
          }원`;
        })
        .join("\n\n");
      await message.reply({
        content: `🔥 **현재 스팀 할인 게임 TOP ${maxCount}** 🔥\n\n${topDiscounts}`,
      });
    } catch (err) {
      console.error("[STEAM SALE ERROR]", err);
      await message.reply("스팀 할인 정보를 가져오는 중 오류가 발생했습니다.");
    }
  }

  // 서버 시간 안내
  if (message.content === "서버 시간") {
    const joinTime = userJoinTimes.get(message.member.id);
    if (joinTime) {
      const diff = Date.now() - joinTime;
      const mins = Math.floor(diff / 60000) % 60;
      const hours = Math.floor(diff / 3600000);
      await message.reply(`${message.member.displayName}님은 서버에 총 ${hours}시간 ${mins}분 머무르고 있습니다.`);
    } else {
      await message.reply("입장 시간이 기록되어 있지 않습니다. (서버 입장 후부터 측정)");
    }
    return;
  }

  // 봇 기능 안내
  if (message.content === "봇 기능") {
    await message.reply(
      [
        "🤖 **봇이 제공하는 주요 기능 안내**",
        "",
        "1. **서버 입장/퇴장 로그**",
        "   - 서버에 유저가 들어오거나 나가면 로그 채널에 자동으로 메시지 전송",
        "2. **음성 채널 입장/퇴장 로그 및 머문 시간 기록**",
        "   - 음성 채널에 입장/퇴장 시 로그 채널에 메시지 전송 및 머문 시간 안내",
        "3. **everyone 멘션**",
        "   - 입장 시 모두에게 알림",
        "4. **채팅 메시지/삭제 로그**",
        "   - 모든 채팅/삭제된 메시지를 로그 채널에 기록",
        "5. **유튜브 검색**",
        "   - '유튜브 검색 [검색어]' 입력 시 유튜브 영상 링크 제공",
        "6. **구글 검색**",
        "   - '구글 검색 [검색어]' 입력 시 구글 검색 결과 페이지 링크 제공",
        "7. **짤방/밈 랜덤 전송**",
        "   - '짤방' 또는 '밈' 입력 시 랜덤 밈 이미지 전송",
        "8. **스팀 할인 게임 목록**",
        "   - '스팀 할인' 입력 시 현재 할인 중인 스팀 게임 안내",
        "9. **서버 머문 시간 안내**",
        "   - '서버 시간' 입력 시 서버에 머문 시간 안내",
        "10. **음성 채널 모든 유저 퇴장**",
        "    - 'all퇴장' 입력 시 음성 채널의 모든 유저를 퇴장시킴",
        "11. **랜덤 질문**",
        "    - '봇 질문' 입력 시 랜덤 질문을 받거나, 15분마다 자동으로 질문을 받습니다.",
        "",
      ].join("\n")
    );
    return;
  }

  // all퇴장 기능
  if (message.content === "all퇴장") {
    // 명령어를 입력한 유저가 음성 채널에 있는지 확인
    const member = message.member;
    if (!member.voice.channel) {
      await message.reply("음성 채널에 먼저 참여해주세요!");
      return;
    }

    // 봇에게 음성 채널 멤버를 이동시킬 권한이 있는지 확인
    if (!member.voice.channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.MoveMembers)) {
      await message.reply("봇에게 음성 채널 멤버를 이동시킬 권한이 없습니다.");
      return;
    }

    // 음성 채널에 있는 모든 유저를 퇴장시킴
    const channel = member.voice.channel;
    try {
      for (const [memberID, member] of channel.members) {
        await member.voice.setChannel(null);
      }
      await message.reply(`**${channel.name}** 채널의 모든 유저를 퇴장시켰습니다.`);
    } catch (err) {
      console.error("[ALL KICK ERROR]", err);
      await message.reply("유저를 퇴장시키는 중 오류가 발생했습니다.");
    }
  }
});

// (선택) 메시지 삭제 기록
client.on("messageDelete", async (message) => {
  if (!message.guild) return;
  const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
  if (logChannel) {
    await logChannel.send(
      `🗑️ ${message.member?.displayName || message.author?.username} (${
        message.channel.name
      }): 삭제된 메시지 - ${message.content || "[임베드/첨부파일/알 수 없음]"}`
    );
  }
});

// 봇 시작(ready) 이벤트
client.on("ready", async () => {
  console.log(`봇이 정상적으로 시작되었습니다! [로그인: ${client.user.tag}]`);
  loadQuestions(); // 질문 로드

  // 봇이 속한 모든 서버에서 로그 채널에 시작 메시지 전송
  for (const guild of client.guilds.cache.values()) {
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send("🤖 봇이 정상적으로 시작되었습니다!");
    }
  }

  // 15분마다 랜덤 질문 전송
  setInterval(() => {
    for (const guild of client.guilds.cache.values()) {
      const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
      // 채널이 존재하고, 질문이 있을 경우에만 전송
      if (logChannel && questions.length > 0) {
        sendRandomQuestion(logChannel);
      }
    }
  }, 1000 * 60 * 60); // 15분마다 실행
});

client.login(BOT_TOKEN);