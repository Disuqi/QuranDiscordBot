import { Command} from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { AttachmentBuilder, GuildMember, Message, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption, SlashCommandSubcommandBuilder } from 'discord.js';
import { guildId } from '../private/config.json';
import { RecitatorsManager } from '../utils/manager';
import { RecitatorInteraction } from '../utils/recitatorInteraction';
import { QuranTextAPI } from '../apis/quran-text-api';
import { Recitator } from '../utils/recitator';
import { UIManager } from '../views/ui-manager';
import { QuranAudioAPI } from '../apis/quran-audio-api';
import fs from 'fs';
import { Recitation } from '../utils/recitation';

export enum ReciteCommandOptions
{
    Surah = "surah",
    Reciter = "reciter"
}

export class Quran extends Subcommand {
    static readonly COMMAND_ID: string = "1152024046247088148";
    static readonly QUERY_OPTION_NAME: string = "query";

    public constructor(context: Subcommand.Context, options: Subcommand.Options) {
        super(context, { ...options,
            name: 'quran',
            description: "Recite The Holy Quran",
            subcommands: [
                { name: 'recite', chatInputRun: 'recite', default: true},
                { name: 'skip', chatInputRun: 'skip' },
                { name: 'stop', chatInputRun: 'stop' },
                { name: 'search', chatInputRun: 'search' }
            ]});
    }

    public override async registerApplicationCommands(registry: Command.Registry) {
        const build = new SlashCommandBuilder();
        build.setName(this.name);
        build.setDescription(this.description);

        const surahOption = new SlashCommandIntegerOption();
        surahOption.setName(ReciteCommandOptions.Surah);
        surahOption.setDescription('What surah do you want to recite?');
        surahOption.setRequired(true);
        surahOption.setAutocomplete(true);

        const reciterOption = new SlashCommandIntegerOption();
        reciterOption.setName(ReciteCommandOptions.Reciter);
        reciterOption.setDescription('Which reciter?');
        reciterOption.setAutocomplete(true);

        const replaceOption = new SlashCommandBooleanOption();
        replaceOption.setName('replace');
        replaceOption.setDescription('Replace the current recitation queue');
        replaceOption.setRequired(false);

        const reciteSubCommand = new SlashCommandSubcommandBuilder();
        reciteSubCommand.setName('recite');
        reciteSubCommand.setDescription('Recite the Quran');
        reciteSubCommand.addIntegerOption(surahOption);
        reciteSubCommand.addBooleanOption(replaceOption);
        reciteSubCommand.addIntegerOption(reciterOption);

        const skipSubCommand = new SlashCommandSubcommandBuilder();
        skipSubCommand.setName('skip');
        skipSubCommand.setDescription('Skip the current recitation');

        const stopSubCommand = new SlashCommandSubcommandBuilder();
        stopSubCommand.setName('stop');
        stopSubCommand.setDescription('Stop the current recitation');

        const queryOption = new SlashCommandStringOption();
        queryOption.setName(Quran.QUERY_OPTION_NAME);
        queryOption.setDescription("What are you looking for?");
        queryOption.setRequired(true);

        const searchSubCommand = new SlashCommandSubcommandBuilder();
        searchSubCommand.setName('search');
        searchSubCommand.addStringOption(queryOption);
        searchSubCommand.setDescription('Search for an aya in the Quran');

        build.addSubcommand(reciteSubCommand);
        build.addSubcommand(skipSubCommand);
        build.addSubcommand(stopSubCommand);
        build.addSubcommand(searchSubCommand);

        registry.registerChatInputCommand(build, { idHints:[], guildIds: [guildId] });
    }

    public async recite(interaction: Command.ChatInputCommandInteraction) 
    {
        const recitatorInteraction : RecitatorInteraction = await this.getRecitatorInteraction(interaction);
        if(!recitatorInteraction) return;

        const member = recitatorInteraction.interaction.member as GuildMember;
        const recitator = recitatorInteraction.recitator;

        interaction.reply("Getting the audio for you, please wait...");

        let enqueue = true;
        if(interaction.options.getBoolean('replace'))
            enqueue = interaction.options.getBoolean('replace');

        const surahId = interaction.options.getInteger(ReciteCommandOptions.Surah);

        let reciterId = interaction.options.getInteger(ReciteCommandOptions.Reciter);
        if(!reciterId)
        {
            reciterId = QuranAudioAPI.DEFAULT_RECITER_ID;
            const queue = recitatorInteraction.recitator.queue;

            if(queue.length > 0)
            {
                const index = recitatorInteraction.recitator.queueIndex;
                const reciter = await QuranAudioAPI.getReciter(queue[index].reciterId);
                const possibleReciters = QuranAudioAPI.listRecitersBySurah(surahId);

                if(possibleReciters.includes(reciter))
                {
                    reciterId = reciter.id;
                }
            }
        }

        const reciterinfo = await QuranAudioAPI.getReciter(reciterId);
        const surahInfo = await QuranTextAPI.getSurahInfo(surahId);
        const audio : string = await QuranAudioAPI.getSurahAudio(surahId, reciterId);

        const recitation : Recitation = 
        {
            reciterId: reciterId, 
            reciterName: reciterinfo.name, 
            surahId: surahId,
            surahNameArabic: surahInfo.name_arabic,
            surahNameTransliteration : surahInfo.name_simple,
            surahNameTranslation: surahInfo.translated_name.name,
            audioUrl: audio
        };

        if (enqueue)
        {
            recitator.enqueue(recitation);
            interaction. editReply("Added " + recitation.surahNameTransliteration  + " - " + recitation.reciterName + " to the queue.")
        }
        else
        {
            recitator.clear()
            recitator.enqueue(recitation);
        }
    }

    public async skip(interaction: Command.ChatInputCommandInteraction)
    {
        const recitatorInteraction= await this.getRecitatorInteraction(interaction);
        if(!recitatorInteraction) return;
        recitatorInteraction.recitator.next();
        await interaction.deferReply({ephemeral: true});
        interaction.deleteReply();
    }

    public async stop(interaction: Command.ChatInputCommandInteraction)
    {
        const recitatorInteraction = await this.getRecitatorInteraction(interaction);
        if(!recitatorInteraction) return;
        recitatorInteraction.recitator.stop();
        await interaction.deferReply({ephemeral: true});
        interaction.deleteReply();
    }

    private async getRecitatorInteraction(interaction: Command.ChatInputCommandInteraction) : Promise<RecitatorInteraction>
    {
        const member = interaction.member as GuildMember;
        if (!member)
        {
            await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
            return;
        }

        const voice = member.voice;
        if (!voice || !voice.channel)
        {
            await interaction.reply({ content: "You must be in a voice channel to use this command.", ephemeral: true });
            return;
        }

        let recitatorInteraction = RecitatorsManager.getRecitatorInteraction(interaction.guildId);
        if (!recitatorInteraction)
        {
            const notifier = await interaction.channel.send("Loading...");
            const thread = await notifier.startThread({name: "Queue"});
            const queueMessage = await thread.send("Loading...");
            recitatorInteraction = new RecitatorInteraction(interaction, notifier, queueMessage, new Recitator(voice));
            RecitatorsManager.setRecitatorInteraction(recitatorInteraction);
        }
        return recitatorInteraction;
    }

    public async search(interaction: Command.ChatInputCommandInteraction)
    {
        var query = interaction.options.getString(Quran.QUERY_OPTION_NAME);
        const response = await QuranTextAPI.search(query);
        interaction.reply(response[0].text);
    }
}