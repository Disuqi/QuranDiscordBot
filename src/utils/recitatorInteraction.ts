import { Command } from "@sapphire/framework";
import { Message } from "discord.js";
import { Recitator } from "./recitator";
import { UIManager } from "../views/ui-manager";
import { RecitatorsManager } from "./manager";

export class RecitatorInteraction
{
    readonly interaction : Command.ChatInputCommandInteraction;
    readonly notifier: Message;
    readonly queueMessage: Message;
    readonly recitator : Recitator;

    //need to add event handling for the recitator
    constructor(interaction : Command.ChatInputCommandInteraction, notifier: Message, queueMessage: Message, recitator : Recitator)
    {
        this.interaction = interaction;
        this.notifier = notifier;
        this.queueMessage = queueMessage;
        this.recitator = recitator;

        this.recitator.addOnDestroyListener(() => 
            {
                this.interaction.editReply({content: "Recitation has ended.", embeds: [], components: []})
                this.notifier.delete();
                this.queueMessage.delete();
            });

        this.recitator.addOnQueueChangedListener((queue, index) =>
            {
                this.updateRecitatorInteraction();
                this.updateQueueMessage();
            });

        this.recitator.addOnRecitationChangedListener((queue, index) => 
            {
                this.updateRecitatorInteraction();
                this.updateQueueMessage();
            });
        this.recitator.addOnRecitationFailedListener((recitation) => 
            {
                this.notifier.edit(`Failed to play ${recitation.surahNameTransliterated} - ${recitation.reciterName}`);
                this.recitator.next();
            });
    }

    public async updateRecitatorInteraction()
    {
        // let imagePath = './assets/reciters/' + recitation.reciterId + '.jpg';
        // if(!fs.existsSync(imagePath)) imagePath = "./assets/no-image.jpg";
        // const file = new AttachmentBuilder(imagePath);
        // file.setName('reciter.jpg');

        const recitationEmbed = UIManager.getRecitationEmbed(this.recitator.queue, this.recitator.queueIndex);
        const actionRow = UIManager.getRecitatorActionRow();
        await this.interaction.editReply({content: "", embeds: [recitationEmbed], components: [actionRow]});
    }

    public async updateQueueMessage()
    {
        const queue = this.recitator.queue;
        const index = this.recitator.queueIndex;

        if(this.recitator.queue.length == 0)
        {
            await this.queueMessage.edit("Queue is empty.");
            return;
        }

        let content = "Queue: \n";
        for (let i = 0; i < queue.length; i++)
        {
            const recitation = queue[i];
            if(i == index)
                content += `:loud_sound: `;
            content += `${i + 1}. ${recitation.surahNameTransliterated} - ${recitation.reciterName}\n`; 
        }
        await this.queueMessage.edit(content);
    }
}