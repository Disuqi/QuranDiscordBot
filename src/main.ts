import { SapphireClient } from '@sapphire/framework';
import { Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { token, appId, guildId } from "./private/config.json";
import { QuranAudioAPI } from './apis/quran-audio-api';


async function start()
{
    await QuranAudioAPI.initialize();
    const client = new SapphireClient({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates] });
    client.login(token);
    client.once(Events.ClientReady, async c => 
    {
        console.log('Ready! Logged in as', c.user?.tag);
    });
}

start();