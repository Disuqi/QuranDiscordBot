// import { Command } from '@sapphire/framework';
// import { Subcommand } from '@sapphire/plugin-subcommands';
// import { GuildMember, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from 'discord.js';
// import { guildId } from '../../private/config.json';
// import { userData } from '../../data/audio-user-data.json';
// import { QueueAudioPlayer, Track } from '../../utils/audio-player';
// import { QuranAPI } from '../../apis/quran-api';

// export class QuranPlayerManager extends Subcommand {
//     private static NEW_USER_DATA = {"recitationId" : null, "translationId": null, "tafsirId" : null };
//     private audioPlayers : Map<string, QueueAudioPlayer>;
//     private userData : { [key: string]: { recitationId: number | null, translationId: number | null, tafsirId: number | null }};

//     public constructor(context: Subcommand.Context, options: Subcommand.Options) {
//         super(context, { ...options, name: 'qp', subcommands: [
//             { name: 'play', chatInputRun: 'play', default: true},
//             { name: 'stop', chatInputRun: 'stop'},
//             { name: 'pause', chatInputRun: 'pause'},
//             { name: 'resume', chatInputRun: 'resume'},
//             { name: 'skip', chatInputRun: 'skip'},
//             { name: 'add', chatInputRun: 'add' },
//             { name: 'queue', chatInputRun: 'queue'},
//             { name: 'test', type: 'group', entries: [
//                 {'name': 'test1', chatInputRun: 'test1'},
//                 {'name': 'test2', chatInputRun: 'test2'}
//             ]}
//         ] });
//         this.audioPlayers = new Map();
//         this.userData = userData;
//     }

//     public override registerApplicationCommands(registry: Command.Registry) {
//         const build = new SlashCommandBuilder();
//         build.setName('qp');
//         build.setDescription('Quran Player');

//         const playSubCommandGroup = new SlashCommandSubcommandGroupBuilder();
//         playSubCommandGroup.setName('play');
//         playSubCommandGroup.setDescription('Play the holy Quran');
//         const surahSubCommand = new SlashCommandSubcommandBuilder();
//         surahSubCommand.setName('surah');
//         surahSubCommand.setDescription('Play a Surah');
//         surahSubCommand.addIntegerOption((option) =>
//         {
//             option.setName('number');
//             option.setDescription('Number of the surah');
//             option.setRequired(true);
//             option.setAutocomplete(true);
//             return option;
//         });
//         playSubCommandGroup.addSubcommand(surahSubCommand);

//         const stopSubCommand = new SlashCommandSubcommandBuilder();
//         stopSubCommand.setName('stop');
//         stopSubCommand.setDescription('Stop the quran player');

//         const pauseSubCommand = new SlashCommandSubcommandBuilder();
//         pauseSubCommand.setName('pause');
//         pauseSubCommand.setDescription('Pause the quran player');

//         const resumeSubCommand = new SlashCommandSubcommandBuilder();
//         resumeSubCommand.setName('resume');
//         resumeSubCommand.setDescription('Resume the quran player');

//         const skipSubCommand = new SlashCommandSubcommandBuilder();
//         skipSubCommand.setName('skip');
//         skipSubCommand.setDescription('Skip the current track');

//         const addSubCommandGroup = new SlashCommandSubcommandGroupBuilder();
//         addSubCommandGroup.setName('add');
//         addSubCommandGroup.setDescription('Add a track to the queue');
//         const surahSubCommand = new SlashCommandSubcommandBuilder();

//         const queueSubCommand = new SlashCommandSubcommandBuilder();
//         queueSubCommand.setName('queue');
//         queueSubCommand.setDescription('List tracks in queue');

//         const testSubCommandGroup = new SlashCommandSubcommandGroupBuilder();
//         testSubCommandGroup.setName('test');
//         testSubCommandGroup.setDescription('Test');
//         const test1SubCommand = new SlashCommandSubcommandBuilder();
//         test1SubCommand.setName('test1');
//         test1SubCommand.setDescription('Test 1');
//         const test2SubCommand = new SlashCommandSubcommandBuilder();
//         test2SubCommand.setName('test2');
//         test2SubCommand.setDescription('Test 2');
//         testSubCommandGroup.addSubcommand(test1SubCommand);
//         testSubCommandGroup.addSubcommand(test2SubCommand);

//         build.addSubcommand(playSubCommand);
//         build.addSubcommand(stopSubCommand);
//         build.addSubcommand(pauseSubCommand);
//         build.addSubcommand(resumeSubCommand);
//         build.addSubcommand(skipSubCommand);
//         build.addSubcommand(addSubCommand);
//         build.addSubcommand(queueSubCommand);

//         build.addSubcommandGroup(testSubCommandGroup);

//         registry.registerChatInputCommand(build, { idHints:[], guildIds: [guildId] });
//     }

//     public async test1(interaction: Command.ChatInputCommandInteraction)
//     {
//         await interaction.reply('test1');
//     }

//     public async test2(interaction: Command.ChatInputCommandInteraction)
//     {
//         await interaction.reply('test2');
//     }

//     public async play(interaction : Command.ChatInputCommandInteraction) 
//     {
//         const interactionGuildId = interaction.guildId;
//         const member = interaction.member as GuildMember;
//         if (interactionGuildId == null || member == null) 
//         {
//             await interaction.reply("This command can only be used in a server");
//             return;
//         }

//         const voiceState = member.voice;
//         if (voiceState == null || voiceState.channel == null)
//         {
//             await interaction.reply("You must be in a voice channel to use this command");
//             return;
//         }

//         let audioPlayer = this.audioPlayers.get(interactionGuildId);
//         if (audioPlayer == null)
//         {
//             try
//             {
//                 audioPlayer = new QueueAudioPlayer(voiceState);
//                 this.audioPlayers.set(interactionGuildId, audioPlayer);
//                 audioPlayer.OnDestroy = (guildId) =>
//                 {
//                     this.audioPlayers.delete(guildId);
//                 };
//             }catch (error)
//             {
//                 await interaction.reply('Failed to join voice channel');
//                 return;
//             }
//         }
//         let user = this.userData[member.id];
//         if (user == null)
//         {
//             this.userData[member.id] = QuranPlayerManager.NEW_USER_DATA;
//             user = this.userData[member.id];
//         }
//         const recitationId = user.recitationId;
//         const surah = interaction.options.getInteger('surah');

//         const reciter = await QuranAPI.getReciterName(recitationId);
//         const name = (await QuranAPI.getSurahInfo(surah)).name_simple;
//         const url = (await QuranAPI.getSurahAudio(5, surah)).audio_url;
//         const success = await audioPlayer.play({ reciter: reciter, surah: name, url: url });
//         if (!success)
//         {
//             await interaction.reply('Failed to play the holy Quran');
//         }else
//         {
//             await interaction.reply('Playing the holy Quran');
//         }
//     }

//     public async stop(interaction : Command.ChatInputCommandInteraction)
//     {
//         let audioPlayer = this.audioPlayers.get(interaction.guildId);
//         if (audioPlayer != null)
//         {
//             audioPlayer.stop();
//             interaction.reply('Stopped!');
//         }
//         else
//         {
//             interaction.reply('I am not in a voice channel!');
//         }
//     }

//     public async pause(interaction : Command.ChatInputCommandInteraction)
//     {
//         let audioPlayer = this.audioPlayers.get(interaction.guildId);
//         if (audioPlayer != null)
//         {
//             interaction.reply('Paused!');
//         }
//         else
//         {
//             interaction.reply('I am not in a voice channel!');
//         }
//     }

//     public async resume(interaction : Command.ChatInputCommandInteraction)
//     {
//         let audioPlayer = this.audioPlayers.get(interaction.guildId);
//         if (audioPlayer != null)
//         {
//             audioPlayer.resume();
//             interaction.reply('Resumed!');
//         }
//         else
//         {
//             interaction.reply('I am not in a voice channel!');
//         }
//     }

//     public async skip(interaction : Command.ChatInputCommandInteraction)
//     {
//         let audioPlayer = this.audioPlayers.get(interaction.guildId);
//         if (audioPlayer != null)
//         {
//             audioPlayer.next();
//             interaction.reply('Skipped!');
//         }
//         else
//         {
//             interaction.reply('I am not in a voice channel!');
//         };
//     }

//     public async add(interaction : Command.ChatInputCommandInteraction)
//     {
//         let audioPlayer = this.audioPlayers.get(interaction.guildId);
//         if (audioPlayer != null)
//         {
//             const randomNumber = Math.floor(Math.random() * 114);
//             const name = (await QuranAPI.getSurahInfo(randomNumber))['name_simple'];
//             const url = (await QuranAPI.getSurahAudio(5, randomNumber))['audio_url'];
//             audioPlayer.enqueue({name: name, url: url});
//             interaction.reply(`Added ${name} to the queue!`);
//         }
//         else
//         {
//             interaction.reply('I am not in a voice channel!');
//         }
//     }

//     public async queue(interaction : Command.ChatInputCommandInteraction)
//     {
//         let audioPlayer = this.audioPlayers.get(interaction.guildId);
//         if (audioPlayer != null)
//         {
//             let message = "";
//             audioPlayer.queue.forEach((track) => 
//             {
//                 message += `${track.name}\n`;
//             });
//             interaction.reply(message);
//         }
//         else
//         {
//             interaction.reply('I am not in a voice channel!');
//         }
//     }
// }