import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRow, ActionRowBuilder, ButtonInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { RecitatorButton } from '../views/ui-manager';
import { RecitatorsManager } from '../utils/manager';
import { RecitatorInteraction } from '../utils/recitatorInteraction';

export class ButtonHandler extends InteractionHandler 
{
  addRecitationRow : ActionRowBuilder<StringSelectMenuBuilder>;

  public constructor(ctx) {
    super(ctx, {
      interactionHandlerType: InteractionHandlerTypes.Button
    });

    const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('starter')
			.setPlaceholder('Make a selection!')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Bulbasaur')
					.setDescription('The dual-type Grass/Poison Seed Pokémon.')
					.setValue('bulbasaur'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Charmander')
					.setDescription('The Fire-type Lizard Pokémon.')
					.setValue('charmander'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Squirtle')
					.setDescription('The Water-type Tiny Turtle Pokémon.')
					.setValue('squirtle'),
			);
        
    this.addRecitationRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);
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
          const reply = await recitatorInteraction.interaction.fetchReply();
          //recitatorInteraction.interaction.editReply({components: [this.addRecitationRow]})
          break;
        case RecitatorButton.Skip:
          const oldRecitationName = recitatorInteraction.recitator.currentRecitation.surahNameTransliterated;
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