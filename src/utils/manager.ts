import { RecitatorInteraction } from "./recitatorInteraction";

export class RecitatorsManager
{
    private static recitatorInteractions : Map<string, RecitatorInteraction> = new Map();

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
}