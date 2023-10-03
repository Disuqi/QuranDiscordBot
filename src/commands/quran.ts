import { Command} from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { AttachmentBuilder, GuildMember, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandSubcommandBuilder } from 'discord.js';
import { guildId } from '../private/config.json';
import { RecitatorsManager, ServerRecitator } from '../utils/manager';
import { QuranTextAPI } from '../apis/quran-text-api';
import { Recitation } from '../utils/recitator';
import { UIManager } from '../views/ui-manager';
import { QuranAudioAPI } from '../apis/quran-audio-api';

export enum ReciteCommandOptions
{
    Surah = "surah",
    Reciter = "reciter"
}

export class Quran extends Subcommand {
    static COMMAND_ID: string = "1152024046247088148";

    public constructor(context: Subcommand.Context, options: Subcommand.Options) {
        super(context, { ...options,
            name: 'quran',
            description: "Recite The Holy Quran",
            subcommands: [
                { name: 'recite', chatInputRun: 'recite', default: true},
                { name: 'enqueue', chatInputRun: 'enqueue'},
                { name: 'skip', chatInputRun: 'skip'},
                { name: 'stop', chatInputRun: 'stop'}
            ]});
    }

    public override async registerApplicationCommands(registry: Command.Registry) {
        const build = new SlashCommandBuilder();
        build.setName(this.name);
        build.setDescription(this.description);

        const surahOption = new SlashCommandIntegerOption();
        surahOption.setName('surah');
        surahOption.setDescription('What surah do you want to recite?');
        surahOption.setRequired(true);
        surahOption.setAutocomplete(true);

        const reciterOption = new SlashCommandIntegerOption();
        reciterOption.setName('reciter');
        reciterOption.setDescription('Which reciter?');
        reciterOption.setAutocomplete(true);

        const reciteSubCommand = new SlashCommandSubcommandBuilder();
        reciteSubCommand.setName('recite');
        reciteSubCommand.setDescription('Recite the Quran');
        reciteSubCommand.addIntegerOption(surahOption);
        reciteSubCommand.addIntegerOption(reciterOption);

        const enqueueSubCommand = new SlashCommandSubcommandBuilder();
        enqueueSubCommand.setName('enqueue');
        enqueueSubCommand.setDescription('Add a recitation to the queue');
        enqueueSubCommand.addIntegerOption(surahOption);
        enqueueSubCommand.addIntegerOption(reciterOption);

        const skipSubCommand = new SlashCommandSubcommandBuilder();
        skipSubCommand.setName('skip');
        skipSubCommand.setDescription('Skip the current recitation');

        const stopSubCommand = new SlashCommandSubcommandBuilder();
        stopSubCommand.setName('stop');
        stopSubCommand.setDescription('Stop the current recitation');

        build.addSubcommand(reciteSubCommand);
        build.addSubcommand(enqueueSubCommand);
        build.addSubcommand(skipSubCommand);
        build.addSubcommand(stopSubCommand);

        registry.registerChatInputCommand(build, { idHints:[], guildIds: [guildId] });
    }

    public async recite(interaction: Command.ChatInputCommandInteraction) 
    {
        this.updateRecitator(interaction)
    }

    public async enqueue(interaction: Command.ChatInputCommandInteraction)
    {
        this.updateRecitator(interaction, true)
    }

    public async skip(interaction: Command.ChatInputCommandInteraction)
    {
        const serverRecitator= await this.getRecitator(interaction);
        if(!serverRecitator) return;
        serverRecitator.recitator.next();
        await interaction.deferReply({ephemeral: true});
        interaction.deleteReply();
    }

    public async stop(interaction: Command.ChatInputCommandInteraction)
    {
        const serverRecitator = await this.getRecitator(interaction);
        if(!serverRecitator) return;
        serverRecitator.recitator.stop();
        await interaction.deferReply({ephemeral: true});
        interaction.deleteReply();
    }

    private async updateRecitator(interaction: Command.ChatInputCommandInteraction, enqueue: boolean = false)
    {
        const serverRecitator = await this.getRecitator(interaction);
        if(!serverRecitator) return;
        const member = serverRecitator.originalInteraction.member as GuildMember;
        const recitator = serverRecitator.recitator;
        await interaction.deferReply({ ephemeral: true });
        if (interaction != serverRecitator.originalInteraction)
        {
            interaction.deleteReply();
        }

        await serverRecitator.originalInteraction.editReply({ content: "Getting the audio for you, please wait..."});
        const surahId = interaction.options.getInteger(ReciteCommandOptions.Surah);
        let reciterId = interaction.options.getInteger(ReciteCommandOptions.Reciter);

        if(!reciterId && !enqueue)
        {
            const userData = RecitatorsManager.getUserData(member.id);
            if(!userData.recitationId)
                userData.recitationId = 2;
            reciterId = userData.recitationId;
        }

        const reciterinfo = await QuranAudioAPI.getReciter(reciterId);
        const surahInfo = await QuranTextAPI.getSurahInfo(surahId);
        const audio : string = await QuranAudioAPI.getSurahAudio(surahId, reciterId);

        const recitation : Recitation = new Recitation(reciterId, reciterinfo.name, surahId, surahInfo.name_arabic, surahInfo.name_simple, surahInfo.translated_name.name, audio);
        let success : boolean = true;
        if (enqueue)
            recitator.enqueue(recitation);
        else
            success = recitator.recite(recitation);

        if (!success)
            await serverRecitator.originalInteraction.editReply("Something went wrong.");
        else
        {
            if(enqueue)
                await serverRecitator.originalInteraction.editReply(`Added ${recitation.surahNameEnglish} to the queue!`);  
            else
                await this.updateRecitatorInteraction(serverRecitator.originalInteraction, recitation);
        }    
    }

    private async getRecitator(interaction: Command.ChatInputCommandInteraction) : Promise<ServerRecitator>
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

        let recitator = RecitatorsManager.getServerRecitator(interaction.guildId);
        if (!recitator)
        {
            recitator = RecitatorsManager.createServerRecitator(interaction, voice, (newRecitation) => {
                this.updateRecitatorInteraction(interaction, newRecitation);
            }, (serverRecitator) => {
                serverRecitator.originalInteraction.editReply({content: "Stopped reciting.", embeds: [], files: [], components: []});
            } );
        }
        return recitator;
    }

    public async updateRecitatorInteraction(interaction : Command.ChatInputCommandInteraction, recitation: Recitation)
    {
        const file = new AttachmentBuilder('./assets/reciters/' + recitation.reciterId + '.jpg');
        file.setName('reciter.jpg');
        const recitationEmbed = UIManager.getRecitationEmbed(recitation);
        const actionRow = UIManager.getRecitatorActionRow();
        await interaction.editReply({content: "", embeds: [recitationEmbed], components: [actionRow], files: [file]});
    }
}