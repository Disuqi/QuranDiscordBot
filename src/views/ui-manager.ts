import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, ModalActionRowComponentBuilder } from 'discord.js';
import { Recitation } from '../utils/recitator';

export enum RecitatorButton
{
    Skip = "skip",
    Stop = "stop",
    More = "more"
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

        const skipButton = new ButtonBuilder().setLabel("Skip").setStyle(ButtonStyle.Primary).setCustomId(RecitatorButton.Skip);
        const stopButton = new ButtonBuilder().setLabel("Stop").setStyle(ButtonStyle.Danger).setCustomId(RecitatorButton.Stop);
        const moreButton = new ButtonBuilder().setLabel("More").setStyle(ButtonStyle.Secondary).setCustomId(RecitatorButton.More);

        actionRow.addComponents(skipButton, stopButton, moreButton);
        return actionRow;
    }

    public static getChaptersActionRow() : ActionRowBuilder<ModalActionRowComponentBuilder>
    {
        const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>();
        const textInput = new TextInputBuilder();
        actionRow.addComponents(textInput);
        return actionRow;
    }
}