import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { Recitation } from '../utils/recitator';

export enum RecitatorButton
{
    Add = "add",
    Skip = "skip",
    Stop = "stop",
    Queue = "queue"
}

export class UIManager
{
    public static getRecitationEmbed(recitation: Recitation) : EmbedBuilder
    {
        const embed = new EmbedBuilder();
        embed.setAuthor({ name: recitation.reciterName});
        embed.setThumbnail('attachment://reciter.jpg');
        embed.setTitle(`[${recitation.surahId}]  ${recitation.surahNameTransliterated}`);
        embed.setColor(Colors.White);
        embed.setDescription(recitation.surahNameEnglish);
        return embed;
    }

    public static getRecitatorActionRow() : ActionRowBuilder<ButtonBuilder>
    {
        const actionRow = new ActionRowBuilder<ButtonBuilder>();
        const addButton = new ButtonBuilder().setLabel("Add").setStyle(ButtonStyle.Success).setCustomId(RecitatorButton.Add);
        const skipButton = new ButtonBuilder().setLabel("Skip").setStyle(ButtonStyle.Primary).setCustomId(RecitatorButton.Skip);
        const stopButton = new ButtonBuilder().setLabel("Stop").setStyle(ButtonStyle.Danger).setCustomId(RecitatorButton.Stop);
        const queueButton = new ButtonBuilder().setLabel("Queue").setStyle(ButtonStyle.Secondary).setCustomId(RecitatorButton.Queue);
        actionRow.addComponents(addButton, skipButton, stopButton, queueButton);
        return actionRow;
    }

    public static getChaptersActionRow() : ActionRowBuilder<StringSelectMenuBuilder>
    {
        const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>();
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("Surah")
            .setPlaceholder("Select a surah");
        const options = []
        for(let i = 1; i <= 114; i++)
        {
            options.push(new StringSelectMenuOptionBuilder().setLabel(i.toString()).setValue(i.toString()));
        }
        selectMenu.addOptions(options);
        actionRow.addComponents(selectMenu);
        return actionRow;
    }
}