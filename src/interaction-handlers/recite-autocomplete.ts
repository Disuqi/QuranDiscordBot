import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { AutocompleteInteraction, APIApplicationCommandOptionChoice, APIApplicationCommandPermissionsConstant } from 'discord.js';
import { Quran, ReciteCommandOptions } from '../commands/quran';
import Fuse from 'fuse.js';
import { QuranAudioAPI, Reciter } from '../apis/quran-audio-api';
import { QuranTextAPI, SurahInfo } from '../apis/quran-text-api';
import { isNullOrUndefinedOrEmpty } from '@sapphire/utilities';
import { MAX_OPTION_CHOICES } from '../utils/consts';

export class ReciteAutocomplete extends InteractionHandler
{
  allChapters : SurahInfo[];
  chaptersFuse : Fuse<SurahInfo>;
  recitersFuse : Fuse<Reciter>;

  public constructor(ctx) {
    super(ctx, {
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
  }

  public override async onLoad()
  {
    this.allChapters = await QuranTextAPI.listSurahs();
    this.chaptersFuse = new Fuse(this.allChapters, { threshold: 0.3, keys: ['id', 'name_simple', 'name_arabic', 'translated_name.name'] });
  }

  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) 
  {
    this.recitersFuse = null;
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction)
  {
    switch (interaction.commandId)
    {
      case Quran.COMMAND_ID:
        return await this.handleQuranCommand(interaction);
      default:
        return this.none();
    }
  }

  private async handleQuranCommand(interaction: AutocompleteInteraction)
  {
    const focusedOption = interaction.options.getFocused(true);
    const options : APIApplicationCommandOptionChoice[] = [];
    switch(focusedOption.name)
    {
      case ReciteCommandOptions.Surah:
        if(isNullOrUndefinedOrEmpty(focusedOption.value))
        {
          for(let i = 0; i < MAX_OPTION_CHOICES; i++)
          {
            const surah = this.allChapters[i];
            options.push({name: surah.name_simple, value: surah.id});
          }
          break;
        }
        const chapters = this.chaptersFuse.search(focusedOption.value);

        for (let i = 0; i < chapters.length; i++)
        {
          if(i >= MAX_OPTION_CHOICES) break;
          const chapter = chapters[i].item;
          options.push({name: chapter.name_simple, value: chapter.id});
        }
        break;
      case ReciteCommandOptions.Reciter:
        const surah = interaction.options.getInteger(ReciteCommandOptions.Surah, true);
        const reciters = QuranAudioAPI.listRecitersBySurah(surah);
        if(isNullOrUndefinedOrEmpty(focusedOption.value))
        {
          for(let i = 0; i < MAX_OPTION_CHOICES; i++)
          {
            const reciter = reciters[i];
            options.push({name: reciter.name, value: reciter.id});
          }
          break;
        }

        if(this.recitersFuse == null)
          this.recitersFuse = new Fuse(reciters, {threshold: 0.3, keys: ['name']});

        const relatedReciters = this.recitersFuse.search(focusedOption.value);
        for (let i = 0; i < relatedReciters.length; i++)
        {
          if(i >= MAX_OPTION_CHOICES) break;
          const reciter = relatedReciters[i].item;
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