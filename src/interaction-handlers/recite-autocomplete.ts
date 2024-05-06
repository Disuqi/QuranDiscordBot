import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { AutocompleteInteraction, APIApplicationCommandOptionChoice, APIApplicationCommandPermissionsConstant } from 'discord.js';
import { Quran, ReciteCommandOptions } from '../commands/quran';
import Fuse from 'fuse.js';
import { QuranAudioAPI, Reciter } from '../apis/quran-audio-api';
import { QuranTextAPI, SurahInfo } from '../apis/quran-text-api';
import { isNullOrUndefinedOrEmpty } from '@sapphire/utilities';

export class ReciteAutocomplete extends InteractionHandler {
  chaptersFuse : Fuse<SurahInfo>;
  recitersFuse : Fuse<Reciter>;

  public constructor(ctx) {
    super(ctx, {
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
    this.initFuses()
  }

  private async initFuses()
  {
    this.chaptersFuse = new Fuse((await QuranTextAPI.listSurahs()), { threshold: 0.3, keys: ['id', 'name_simple', 'name_arabic', 'translated_name.name'] });
    this.recitersFuse = new Fuse((await QuranAudioAPI.listReciters()), {threshold: 0.1, keys: ['name', ['moshaf', 'surah_list']]});
  }

  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) 
  {
    return interaction.respond(result);
  }

  //bug for al fatiha because there is no , in front of it
  //also other surahs dont work for some reason, the reciters search is not working as expected
  //also when there is nothing being typed then there is nothing to select, which is buggy

  // could do a dictionary with different fuse for each surah
  // or format reciters before returning so they only return with murattal
  // also organize this code below into functions
  // if nothing is types either put some popular surahs
  // or find the users latest uses
  // you could connect this to mondo db database
  public override async parse(interaction: AutocompleteInteraction)
  {
    if (interaction.commandId != Quran.COMMAND_ID) return this.none();

    const focusedOption = interaction.options.getFocused(true);
    const options : APIApplicationCommandOptionChoice[] = [];
    switch(focusedOption.name)
    {
      case ReciteCommandOptions.Surah:
        if(isNullOrUndefinedOrEmpty(focusedOption.value))
          {
            const suras = await QuranTextAPI.listSurahs();
            for(let i = 0; i < 25; i++)
            {
              const surah = suras[i];
              options.push({name: surah.name_simple, value: surah.id});
            }
            break;
          }
        const chapters = this.chaptersFuse.search(focusedOption.value);

        for (let i = 0; i < chapters.length; i++)
        {
          if(i >= Quran.MAX_OPTION_CHOICES) break;
          const chapter = chapters[i].item;
          options.push({name: chapter.name_simple, value: chapter.id});
        }
        break;
      case ReciteCommandOptions.Reciter:
        if(isNullOrUndefinedOrEmpty(focusedOption.value))
        {
          const reciters = await QuranAudioAPI.listReciters();
          for(let i = 0; i < 25; i++)
          {
            const reciter = reciters[i];
            options.push({name: reciter.name, value: reciter.id});
          }
          break;
        }

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