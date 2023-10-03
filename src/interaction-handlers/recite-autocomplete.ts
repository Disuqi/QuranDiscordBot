import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import { AutocompleteInteraction, APIApplicationCommandOptionChoice, APIApplicationCommandPermissionsConstant } from 'discord.js';
import { Quran, ReciteCommandOptions } from '../commands/quran';
import Fuse from 'fuse.js';
import { QuranAudioAPI, Reciter } from '../apis/quran-audio-api';
import { QuranTextAPI, SurahInfo } from '../apis/quran-text-api';

export class ReciteAutocomplete extends InteractionHandler {
  chaptersFuse : Fuse<SurahInfo>;
  recitersFuse : Fuse<Reciter>;

  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
    this.initFuses()
  }

  private async initFuses()
  {
    this.chaptersFuse = new Fuse(await QuranTextAPI.listSurahs(), { threshold: 0.3, keys: ['id', 'name_simple', 'name_arabic', 'translated_name.name'] });
    this.recitersFuse = new Fuse(await QuranAudioAPI.listReciters(), {threshold: 0.3, keys: ['name', ['moshaf', 'surah_list']]});
  }

  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    if (interaction.commandId != Quran.COMMAND_ID) return this.none();

    const focusedOption = interaction.options.getFocused(true);
    if(focusedOption.value == "") return this.none();
    const options : APIApplicationCommandOptionChoice[] = [];
    switch(focusedOption.name)
    {
      case ReciteCommandOptions.Surah:
        const chapters = this.chaptersFuse.search(focusedOption.value);

        for (let i = 0; i < chapters.length; i++)
        {
          if(i >= Quran.MAX_OPTION_CHOICES) break;
          const chapter = chapters[i].item;
          options.push({name: chapter.name_simple, value: chapter.id});
        }
        break;
      case ReciteCommandOptions.Reciter:
        const surah = interaction.options.getInteger(ReciteCommandOptions.Surah, true);
        const reciters = this.recitersFuse.search({$and: [{name: focusedOption.value}, {$path: ["moshaf", "surah_list"], $val: "," + surah.toString() + "," }]});
        for (let i = 0; i < reciters.length; i++)
        {
          if(i >= Quran.MAX_OPTION_CHOICES) break;
          const reciter = reciters[i].item;
          options.push({name: reciter.name, value: reciter.id});
        }
        break;
        default:
          return this.none();
    };

    if(options.length == 0) return this.none();
    else return this.some(options);
  }
}