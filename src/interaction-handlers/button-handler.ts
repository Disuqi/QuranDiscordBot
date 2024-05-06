import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { RecitatorButton } from '../views/ui-manager';
import { RecitatorsManager } from '../utils/manager';

export class ButtonHandler extends InteractionHandler 
{
  public constructor(ctx) {
    super(ctx, {
      interactionHandlerType: InteractionHandlerTypes.Button
    });
  }

  public async run(interaction: ButtonInteraction)
  {
      interaction.deferReply();
      interaction.deleteReply();
      const button = interaction.customId as RecitatorButton;
      const getRecitator = RecitatorsManager.getServerRecitator(interaction.guildId);
      switch(button)
      {
          case RecitatorButton.Add:
            getRecitator.originalInteraction.editReply({content: "Add is not implemented yet."});
            break;
          case RecitatorButton.Skip:
            getRecitator.recitator.next();
            break;
          case RecitatorButton.Stop:
            getRecitator.recitator.stop();
            break;
          case RecitatorButton.Queue:
            getRecitator.originalInteraction.editReply({content: "Queue is not implemented yet."});
            break;
      }
  }
}