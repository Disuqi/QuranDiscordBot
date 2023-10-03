import { SapphireClient } from '@sapphire/framework';
import { Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { token, appId, guildId } from "./private/config.json";

const client = new SapphireClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates] });
client.login(token);
client.once(Events.ClientReady, c => 
{
    console.log('Ready! Logged in as', c.user?.tag);
});
