import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, ModalActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import { Recitation } from '../utils/recitation';
import { RecitatorButton, RecitatorMoreOptions } from '../utils/consts';

export class UIManager
{
    public static getRecitationEmbed(queue: Recitation[], index: number, repeatSurah: boolean = false, repeatQueue: boolean = false) : EmbedBuilder
    {
        const current = queue[index];
        if(current == null) return;

        const embed = new EmbedBuilder();
        embed.setAuthor({ name: current.reciterName});
        embed.setTitle(`${current.surahNameTransliterated}`);
        embed.setColor(Colors.White);
        embed.setDescription(current.surahNameEnglish);

        embed.addFields({name: "Queue", value: `${index + 1} of ${queue.length}`, inline: true});
        let upnext : Recitation = null;
        if (repeatQueue && index == queue.length - 1)
        {
            upnext = queue[0];
        }
        else if (index + 1 < queue.length)
        {
            upnext = queue[index + 1];
        }

        if(upnext)
            embed.addFields({name: "Up Next", value: `${upnext.surahNameTransliterated} - ${upnext.reciterName}`, inline: true});

        if (repeatSurah)
            embed.setFooter({text: "Repeating Surah 🔁"});
        else if (repeatQueue)
            embed.setFooter({text: "Repeating Queue 🔁"});

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
            new StringSelectMenuOptionBuilder().setLabel("Repeat queue").setValue(RecitatorMoreOptions.RepeatQueue),
            new StringSelectMenuOptionBuilder().setLabel("Remove a recitation from the queue").setValue(RecitatorMoreOptions.RemoveRecitationFromQueue)
        );
        actionRow.addComponents(moreOptions);
        return actionRow;
    }

    public static queueSelectMenu(queue: Recitation[]) : ActionRowBuilder<SelectMenuBuilder>
    {
        const actionRow = new ActionRowBuilder<SelectMenuBuilder>();
        const queueSelectMenu = new StringSelectMenuBuilder();
        queueSelectMenu.setPlaceholder("Select a recitation to remove");
        queueSelectMenu.setCustomId("queue_menu");
        for(let i = 0; i < queue.length; i++)
        {
            queueSelectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(`${queue[i].surahNameTransliterated} - ${queue[i].reciterName}`).setValue(i.toString()));
        }
        actionRow.addComponents(queueSelectMenu);
        return actionRow;
    }
}