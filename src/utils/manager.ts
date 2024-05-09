import { Recitation, Recitator } from "./recitator";
import { userData } from "../data/audio-user-data.json"; 
import { GuildMember, Message, VoiceState } from 'discord.js';
import { Command } from "@sapphire/framework";
import { RecitatorInteraction } from "./recitatorInteraction";

type UserData = 
{
    reciterId : number | null;
    translationId : number | null;
    tafsirId : number | null;
}

export class RecitatorsManager
{
    private static readonly NEW_USER_DATA = { reciterId: null, translationId: null, tafsirId: null };
    private static recitatorInteractions : Map<string, RecitatorInteraction> = new Map();
    private static userData : Map<string, UserData>;

    public static getRecitatorInteraction(guildId: string) : RecitatorInteraction
    {
        if (!this.recitatorInteractions.has(guildId))
        {
            return;
        }
        return this.recitatorInteractions.get(guildId);
    }

    public static setRecitatorInteraction(recitatorInteraction: RecitatorInteraction)
    {
        this.recitatorInteractions.set(recitatorInteraction.interaction.guildId, recitatorInteraction);
        recitatorInteraction.recitator.addOnDestroyListener((guildId) => 
        {
            this.recitatorInteractions.delete(guildId);
        });
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
