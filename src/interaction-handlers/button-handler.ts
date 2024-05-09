import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { RecitatorButton } from '../views/ui-manager';
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
    await interaction.deferReply();
    interaction.deleteReply();
    const button = interaction.customId as RecitatorButton;
    const recitatorInteraction : RecitatorInteraction = RecitatorsManager.getRecitatorInteraction(interaction.guildId);
    switch(button)
    {
        case RecitatorButton.Add:
          recitatorInteraction.notifier.edit("Add is not implemented yet.");
          break;
        case RecitatorButton.Skip:
          const oldRecitationName = recitatorInteraction.recitator.currentRecitation.surahNameEnglish.slice();
          recitatorInteraction.recitator.next();
          recitatorInteraction.notifier.edit({content: "Skipped " + oldRecitationName });
          break;
        case RecitatorButton.Stop:
          recitatorInteraction.recitator.stop();
          break;
        case RecitatorButton.Queue:
          recitatorInteraction.notifier.edit({content: "Queue is not implemented yet."});
          break;
    }
  }
}