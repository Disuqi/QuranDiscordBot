import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRow, ActionRowBuilder, ButtonInteraction, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { RecitatorButton, UIManager } from '../views/ui-manager';
import { RecitatorsManager } from '../utils/manager';
import { RecitatorInteraction } from '../utils/recitatorInteraction';

export class ButtonHandler extends InteractionHandler 
{
  public constructor(ctx) {
    super(ctx, {
      interactionHandlerType: InteractionHandlerTypes.Button
    });
  }

  public async run(interaction: ButtonInteraction)
  {
    const button = interaction.customId as RecitatorButton;
    const recitatorInteraction : RecitatorInteraction = RecitatorsManager.getRecitatorInteraction(interaction.guildId);
    switch(button)
    {
        case RecitatorButton.Skip:
          const oldRecitationName = recitatorInteraction.recitator.currentRecitation.surahNameTransliterated;
          recitatorInteraction.recitator.next();
          recitatorInteraction.notifier.edit({content: "Skipped " + oldRecitationName });
          break;
        case RecitatorButton.Stop:
          recitatorInteraction.recitator.stop();
          break;
        case RecitatorButton.More:
          console.log("More pressed");
          break;
    }
    await interaction.deferReply();
    interaction.deleteReply();
  }
}