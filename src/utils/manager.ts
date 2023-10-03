import { Recitation, Recitator } from "./recitator";
import { userData } from "../data/audio-user-data.json"; 
import { GuildMember, VoiceState } from 'discord.js';
import { Command } from "@sapphire/framework";

type UserData = 
{
    reciterId : number | null;
    translationId : number | null;
    tafsirId : number | null;
}

export type ServerRecitator =
{
    readonly originalInteraction : Command.ChatInputCommandInteraction;
    readonly recitator : Recitator;
}

export class RecitatorsManager
{
    private static readonly NEW_USER_DATA = { reciterId: null, translationId: null, tafsirId: null };
    private static serverRecitators : Map<string, ServerRecitator> = new Map();
    private static userData : Map<string, UserData>;

    public static getServerRecitator(guildId: string) : ServerRecitator
    {
        if (!this.serverRecitators.has(guildId))
        {
            return;
        }
        return this.serverRecitators.get(guildId);
    }

    public static createServerRecitator(interaction: Command.ChatInputCommandInteraction, voice: VoiceState, onRecitationChanged: (newTrack) => void, onRecitatorStopped: (recitator: ServerRecitator) => void) : ServerRecitator
    {
        const guildId = voice.guild.id;
        const recitator = new Recitator(voice, onRecitationChanged, (guildId) =>
        {
            onRecitatorStopped(this.serverRecitators.get(guildId));
            this.serverRecitators.delete(guildId);
        });
        const serverRecitator = { originalInteraction: interaction, recitator: recitator };
        this.serverRecitators.set(guildId, serverRecitator);
        return serverRecitator;
    }

    public static getUserData(memberId: string)
    {
        if (this.userData == null)
        {
            this.userData = new Map<string, UserData>();
            for (const [key, value] of Object.entries(userData))
            {
                this.userData.set(key, value as UserData);
            }
        }

        if (!this.userData.hasOwnProperty(memberId))
        {
            this.userData[memberId] = this.NEW_USER_DATA;
        }
        return this.userData[memberId];
    }
}
