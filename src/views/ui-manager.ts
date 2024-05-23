import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, ModalActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import { Recitation } from '../utils/recitator';
import { RecitatorButton, RecitatorMoreOptions } from '../utils/consts';

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

    public static moreOptionsSelectMenu() : ActionRowBuilder<SelectMenuBuilder>
    {
        const actionRow = new ActionRowBuilder<SelectMenuBuilder>();
        const moreOptions = new StringSelectMenuBuilder();
        moreOptions.setPlaceholder("Select an option");
        moreOptions.setCustomId("more_options_menu");
        moreOptions.addOptions(
            new StringSelectMenuOptionBuilder().setLabel("Repeat Surah").setValue(RecitatorMoreOptions.RepeatSurah),
            new StringSelectMenuOptionBuilder().setLabel("Repeat Queue").setValue(RecitatorMoreOptions.RepeatQueue),
            new StringSelectMenuOptionBuilder().setLabel("Remove Last Added Recitation").setValue(RecitatorMoreOptions.RemoveLastAddedRecitation)
        );
        actionRow.addComponents(moreOptions);
        return actionRow;
    }
}