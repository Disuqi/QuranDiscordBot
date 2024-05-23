import { Command} from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { AttachmentBuilder, GuildMember, Message, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption, SlashCommandSubcommandBuilder } from 'discord.js';
import { guildId } from '../private/config.json';
import { RecitatorsManager } from '../utils/manager';
import { RecitatorInteraction } from '../utils/recitatorInteraction';
import { QuranTextAPI } from '../apis/quran-text-api';
import { Recitation, Recitator } from '../utils/recitator';
import { UIManager } from '../views/ui-manager';
import { QuranAudioAPI } from '../apis/quran-audio-api';
import fs from 'fs';

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
                { name: 'add', chatInputRun: 'add' },
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

        const reciteSubCommand = new SlashCommandSubcommandBuilder();
        reciteSubCommand.setName('recite');
        reciteSubCommand.setDescription('Recite the Quran');
        reciteSubCommand.addIntegerOption(surahOption);
        reciteSubCommand.addIntegerOption(reciterOption);

        const enqueueSubCommand = new SlashCommandSubcommandBuilder();
        enqueueSubCommand.setName('add');
        enqueueSubCommand.setDescription('Add a recitation to the queue');
        enqueueSubCommand.addIntegerOption(surahOption);
        enqueueSubCommand.addIntegerOption(reciterOption);

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
        build.addSubcommand(enqueueSubCommand);
        build.addSubcommand(skipSubCommand);
        build.addSubcommand(stopSubCommand);
        build.addSubcommand(searchSubCommand);

        registry.registerChatInputCommand(build, { idHints:[], guildIds: [guildId] });
    }

    public async recite(interaction: Command.ChatInputCommandInteraction) 
    {
        this.updateRecitator(interaction)
    }

    public async add(interaction: Command.ChatInputCommandInteraction)
    {
        this.updateRecitator(interaction, true)
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

    private async updateRecitator(interaction: Command.ChatInputCommandInteraction, enqueue: boolean = false)
    {
        const recitatorInteraction : RecitatorInteraction = await this.getRecitatorInteraction(interaction);
        if(!recitatorInteraction) return;
        const member = recitatorInteraction.interaction.member as GuildMember;
        const recitator = recitatorInteraction.recitator;
        await interaction.deferReply();
        if (interaction != recitatorInteraction.interaction)
        {
            interaction.deleteReply();
        }

        await recitatorInteraction.notifier.edit("Getting the audio for you, please wait...");
        const surahId = interaction.options.getInteger(ReciteCommandOptions.Surah);
        let reciterId = interaction.options.getInteger(ReciteCommandOptions.Reciter);


        if(!reciterId && recitator.queue.length == 0)
        {
            reciterId = this.findSurahReciterForMember(surahId, member);
        }
        else if(!reciterId)
        {
            const queue = recitatorInteraction.recitator.queue;
            const index = recitatorInteraction.recitator.queueIndex;
            const reciter = await QuranAudioAPI.getReciter(queue[index].reciterId);
            const possibleReciters = QuranAudioAPI.listRecitersBySurah(surahId);
            if(!possibleReciters.includes(reciter))
            {
                const randInt = Math.floor(Math.random() * possibleReciters.length);
                reciterId = possibleReciters[randInt].id;
            }
            else
            {
                reciterId = reciter.id;
            }
        }

        const reciterinfo = await QuranAudioAPI.getReciter(reciterId);
        const surahInfo = await QuranTextAPI.getSurahInfo(surahId);
        const audio : string = await QuranAudioAPI.getSurahAudio(surahId, reciterId);

        const recitation : Recitation = new Recitation(reciterId, reciterinfo.name, surahId, surahInfo.name_arabic, surahInfo.name_simple, surahInfo.translated_name.name, audio);
        if (enqueue)
            recitator.enqueue(recitation);
        else
        {
            recitator.clear()
            recitator.enqueue(recitation);
            recitatorInteraction.notifier.edit("Reciting!");
        }

        if(enqueue)
            await recitatorInteraction.notifier.edit(`Added ${recitation.surahNameTransliterated} to the queue!`);  
        else
            await this.updateRecitatorInteraction(recitatorInteraction.interaction, recitation);
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
            recitatorInteraction = { interaction: interaction, notifier: notifier, queueMessage: queueMessage, recitator: new Recitator(voice) };
            recitatorInteraction.recitator.addOnRecitationChangedListener((i, recitations) => 
            {
                this.updateRecitatorInteraction(interaction, recitations[i]);
                this.updateQueueMessage(queueMessage, i, recitations);
            });
            recitatorInteraction.recitator.addOnDestroyListener((guildId) => 
            {
                recitatorInteraction.interaction.editReply({content: "Stopped reciting.", embeds: [], files: [], components: []});
                recitatorInteraction.notifier.delete();
            });
            recitatorInteraction.recitator.addOnRecitationFailedListener((recitation) => 
            {
                recitatorInteraction.interaction.editReply({content: "Failed to recite " + recitation.surahNameEnglish + ". Please try again.", embeds: [], files: [], components: []});
                recitatorInteraction.notifier.delete();
            });
            recitatorInteraction.recitator.addOnQueueChangedListener((queue) => 
            {
                this.updateQueueMessage(queueMessage, recitatorInteraction.recitator.queueIndex, queue);
            });

            RecitatorsManager.setRecitatorInteraction(recitatorInteraction);
        }
        return recitatorInteraction;
    }

    public async updateRecitatorInteraction(interaction : Command.ChatInputCommandInteraction, recitation: Recitation)
    {
        let imagePath = './assets/reciters/' + recitation.reciterId + '.jpg';
        if(!fs.existsSync(imagePath)) imagePath = "./assets/no-image.jpg";
        const file = new AttachmentBuilder(imagePath);
        file.setName('reciter.jpg');

        const recitationEmbed = UIManager.getRecitationEmbed(recitation);
        const actionRow = UIManager.getRecitatorActionRow();
        await interaction.editReply({content: "", embeds: [recitationEmbed], components: [actionRow], files: [file]});
    }

    public async updateQueueMessage(message: Message, index: number, recitations: Recitation[])
    {
        if(recitations.length == 0)
        {
            await message.edit("Queue is empty.");
            return;
        }

        let content = "Queue: \n";
        for (let i = 0; i < recitations.length; i++)
        {
            const recitation = recitations[i];
            if(i == index)
                content += `:loud_sound: `;
            content += `${i + 1}. ${recitation.surahNameTransliterated} - ${recitation.reciterName}\n`; 
        }
        await message.edit(content);
    }

    public async search(interaction: Command.ChatInputCommandInteraction)
    {
        var query = interaction.options.getString(Quran.QUERY_OPTION_NAME);
        const response = await QuranTextAPI.search(query);
        interaction.reply(response[0].text);
    }

    private findSurahReciterForMember(surah: number, member: GuildMember) : number
    {
        let reciterId : number = QuranAudioAPI.randomReciterForSurah(surah).id;
        const userData = RecitatorsManager.getUserData(member.id);

        if(userData)
        {
            const surahReciters = QuranAudioAPI.recitersPerChapter[surah];
            for(let reciter of surahReciters)
            {
                if(userData.reciterId == reciter.id)
                {
                    reciterId = userData.reciterId;
                    break; 
                }
            }
        }
        return reciterId;
    }
}