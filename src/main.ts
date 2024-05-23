import { SapphireClient } from '@sapphire/framework';
import { Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { token, appId, guildId } from "./private/config.json";
import { QuranAudioAPI } from './apis/quran-audio-api';

const client = new SapphireClient({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates] });
client.login(token);
client.once(Events.ClientReady, async c => 
{
    await QuranAudioAPI.initialize();
    console.log('Ready! Logged in as', c.user?.tag);
});
