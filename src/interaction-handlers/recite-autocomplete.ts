import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import { AutocompleteInteraction, APIApplicationCommandOptionChoice } from 'discord.js';
import { Quran, ReciteCommandOptions } from '../commands/quran';
import { QuranAudioAPI } from '../apis/quran-audio-api';

export class ReciteAutocomplete extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
  }

public override async run(interaction: AutocompleteInteraction) 
{
    if (interaction.commandId == Quran.COMMAND_ID) return;

    const options : APIApplicationCommandOptionChoice[] = [];
    switch(interaction.options.getFocused(true).name)
    {
        case ReciteCommandOptions.Surah:
            console.log("Surah");
            
            break;
        case ReciteCommandOptions.Reciter:

            break;  
    };
    await interaction.respond(options);
}

//   public override async parse(interaction: AutocompleteInteraction) {
//     // Only run this interaction for the command with ID '1000802763292020737'

    
//     return this.none();
//     // Get the focussed (current) option
//     const focusedOption = interaction.options.getFocused(true);

//     // Ensure that the option name is one that can be autocompleted, or return none if not.
//     switch (focusedOption.name) {
//       case 'search': {
//         // Search your API or similar. This is example code!
//         const searchResult = await myApi.searchForSomething(focusedOption.value as string);

//         // Map the search results to the structure required for Autocomplete
//         return this.some(searchResult.map((match) => ({ name: match.name, value: match.key })));
//       }
//       default:
//         return this.none();
//     }
//  }
}