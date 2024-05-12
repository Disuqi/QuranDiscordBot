import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRow, ActionRowBuilder, ButtonInteraction, MessageInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { RecitatorButton, UIManager } from '../views/ui-manager';
import { RecitatorsManager } from '../utils/manager';
import { RecitatorInteraction } from '../utils/recitatorInteraction';

export class MessageHandler extends InteractionHandler 
{

  public constructor(ctx) {
    super(ctx, {
      interactionHandlerType: InteractionHandlerTypes.MessageComponent
    });
  }

  public async run(interaction)
  {
    console.log("message interaction");
  }
}