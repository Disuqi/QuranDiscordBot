import { AudioPlayer, AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, createAudioResource, entersState, generateDependencyReport, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { VoiceState } from "discord.js";

export class Recitation
{
    readonly reciterId : number;
    readonly reciterName : string;
    readonly surahId: number;
    readonly surahNameArabic : string;
    readonly surahNameTransliterated : string;
    readonly surahNameEnglish : string;
    readonly audioUrl : string;
    
    constructor(reciterId : number, reciterName : string, surahId: number, surahNameArabic : string, surahNameTransliterated: string, surahNameEnglish : string, audioUrl : string)
    {
        this.reciterId = reciterId;
        this.reciterName = reciterName;
        this.surahId = surahId;
        this.surahNameArabic = surahNameArabic;
        this.surahNameTransliterated = surahNameTransliterated;
        this.surahNameEnglish = surahNameEnglish;
        this.audioUrl = audioUrl;
    }
}

export class Recitator
{
    private _queue : Recitation[];
    private _queueIndex : number;
    private _audioPlayer : AudioPlayer;
    private _guildId : string;
    private _repeat : boolean;

    public onRecitationChanged : (newRecitation : Recitation) => void;
    public onDestroy : (guildId: string) => void;

    constructor(voiceState : VoiceState, onRecitationChanged : (newRecitation : Recitation) => void, onDestroy : (guildId: string) => void)
    {
        this._audioPlayer = createAudioPlayer();

        this._queue = [];
        this._queueIndex = null;
        this._guildId = voiceState.guild.id;
        this.onRecitationChanged = onRecitationChanged;
        this.onDestroy = onDestroy;

        const connection = joinVoiceChannel({
            channelId: voiceState.channelId,
            guildId: this._guildId,
            adapterCreator: voiceState.guild.voiceAdapterCreator
        });
        connection.subscribe(this._audioPlayer);

        this._audioPlayer.on(AudioPlayerStatus.Idle, () => {
            this.next();
        });
    }

    set repeat(value : boolean)
    {
        this._repeat = value;
    }

    get queueIndex(): number
    {
        return this._queueIndex;
    }

    get currentRecitation() : Recitation
    {
        return this._queue[this._queueIndex];
    }

    get queue() : Recitation[]
    {
        return this._queue;
    }

    public recite(track : Recitation) : boolean
    {
        try
        {
            const resource = createAudioResource(track.audioUrl);
            this._audioPlayer.play(resource);
            return true;
        }
        catch (error)
        {
            return false;
        }
    }

    public next(index : number = -1)
    {
        if (index > -1)
        {
            this._queueIndex = index;
        }

        if (this._queue.length > 0)
        {
            this._queueIndex++;
            if(this._queueIndex >= this._queue.length)
            {
                if(this._repeat)
                    this._queueIndex = 0;
                else
                    return;
            }
            const track = this._queue[this._queueIndex]
            this.recite(track);
            this.onRecitationChanged(track);
        }
    }

    public enqueue(track : Recitation)
    {
        this._queue.push(track);
        if (this._audioPlayer.state.status == AudioPlayerStatus.Idle)
        {
            this.next();
        }
    }

    public pause()
    {
        this._audioPlayer.pause();
    }

    public resume()
    {
        this._audioPlayer.unpause();
    }

    public stop()
    {
        this._audioPlayer.stop();
        const connection = getVoiceConnection(this._guildId);
        connection.destroy();
        this.onDestroy(this._guildId);
    }
}