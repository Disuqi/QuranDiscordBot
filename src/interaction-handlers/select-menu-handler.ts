import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRow, ActionRowBuilder, ButtonInteraction, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from 'discord.js';
import { UIManager } from '../views/ui-manager';
import { RecitatorsManager } from '../utils/manager';
import { RecitatorInteraction } from '../utils/recitatorInteraction';
import { RecitatorButton, RecitatorMoreOptions } from '../utils/consts';

export class SelectMenuHandler extends InteractionHandler 
{
  public constructor(ctx) {
    super(ctx, {
      interactionHandlerType: InteractionHandlerTypes.SelectMenu
    });
  }

  public async run(interaction: StringSelectMenuInteraction)
  {
    const option = interaction.values[0] as RecitatorMoreOptions;
    const recitatorInteraction : RecitatorInteraction = RecitatorsManager.getRecitatorInteraction(interaction.guildId);
    switch(option)
    {
        case RecitatorMoreOptions.RepeatQueue:
            recitatorInteraction.recitator.repeat = true;
            recitatorInteraction.interaction.editReply({
                    embeds: [UIManager.getRecitationEmbed(recitatorInteraction.recitator.queue, recitatorInteraction.recitator.queueIndex, false, true)], 
                    components: [UIManager.getRecitatorActionRow()]
                });
            break;
        case RecitatorMoreOptions.RepeatSurah:
            recitatorInteraction.interaction.editReply({
                    embeds: [UIManager.getRecitationEmbed(recitatorInteraction.recitator.queue, recitatorInteraction.recitator.queueIndex, true, false)], 
                    components: [UIManager.getRecitatorActionRow()]
                });
            break;
        case RecitatorMoreOptions.RemoveRecitationFromQueue:
            let queue = recitatorInteraction.recitator.queue;
            if(queue.length > 25)
            {
                queue = queue.slice(-25); 
            }

            recitatorInteraction.interaction.editReply({
                components: [ UIManager.getRecitatorActionRow(), UIManager.queueSelectMenu(queue)]
            })
            break;
    }
    await interaction.deferReply();
    interaction.deleteReply();
  }
}