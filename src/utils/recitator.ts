import { AudioPlayer, AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, createAudioResource, entersState, generateDependencyReport, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { VoiceState } from "discord.js";
import { Recitation } from "./recitation";


export class Recitator
{
    private _queue : Recitation[] = [];
    private _queueIndex : number = -1;
    private _audioPlayer : AudioPlayer;
    private _guildId : string;
    private _repeat : boolean = false;

    private onRecitationChangedListeners : ((queue: Recitation[], index: number) => void)[] = [];
    private onDestroyListeners : ((guildId: string) => void)[] = [];
    private onRecitationFailedListeners : ((recitation: Recitation) => void)[] = [];
    private onQueueChangedListeners : ((queue: Recitation[], index: number) => void)[] = [];

    constructor(voiceState : VoiceState)
    {
        this._audioPlayer = createAudioPlayer();
        this._guildId = voiceState.guild.id;

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

    get currentRecitation() : Recitation
    {
        return this._queue[this._queueIndex];
    }

    get queueIndex(): number
    {
        return this._queueIndex;
    }

    get queue() : Recitation[]
    {
        return this._queue;
    }
    
    set repeat(value : boolean)
    {
        this._repeat = value;
    }

    public addOnRecitationChangedListener(listener : (queue : Recitation[], index: number) => void)
    {
        this.onRecitationChangedListeners.push(listener);
    }

    public addOnDestroyListener(listener : (guildId: string) => void)
    {
        this.onDestroyListeners.push(listener);
    }

    public addOnRecitationFailedListener(listener : (recitation: Recitation) => void)
    {
        this.onRecitationFailedListeners.push(listener);
    }

    public addOnQueueChangedListener(listener : (queue: Recitation[], index: number) => void)
    {
        this.onQueueChangedListeners.push(listener);
    }

    public removeOnRecitationChangedListener(listener : (queue: Recitation[], index: number) => void)
    {
        const index = this.onRecitationChangedListeners.indexOf(listener);
        if (index > -1)
        {
            this.onRecitationChangedListeners.splice(index, 1);
        }
    }

    public removeOnDestroyListener(listener : (guildId: string) => void)
    {
        const index = this.onDestroyListeners.indexOf(listener);
        if (index > -1)
        {
            this.onDestroyListeners.splice(index, 1);
        }
    }

    public removeOnRecitationFailedListener(listener : (recitation: Recitation) => void)
    {
        const index = this.onRecitationFailedListeners.indexOf(listener);
        if (index > -1)
        {
            this.onRecitationFailedListeners.splice(index, 1);
        }
    }

    public removeOnQueueChangedListener(listener : (queue: Recitation[], index: number) => void)
    {
        const index = this.onQueueChangedListeners.indexOf(listener);
        if (index > -1)
        {
            this.onQueueChangedListeners.splice(index, 1);
        }
    }

    private onRecitationChanged(queue: Recitation[], index: number)
    {
        this.onRecitationChangedListeners.forEach(listener => listener(queue, index));
    }

    private onDestroy(guildId: string)
    {
        this.onDestroyListeners.forEach(listener => listener(guildId));
    }

    private onRecitationFailed(recitation: Recitation)
    {
        this.onRecitationFailedListeners.forEach(listener => listener(recitation));
    }

    private onQueueChanged(queue: Recitation[], index: number)
    {
        this.onQueueChangedListeners.forEach(listener => listener(queue, index));
    }

    private recite(track : Recitation)
    {
        try
        {
            const resource = createAudioResource(track.audioUrl);
            this._audioPlayer.play(resource);
        }
        catch (error)
        {
            console.error("Failed to play", track.audioUrl, error);
            this.onRecitationFailed(track);
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
                {
                    this.stop();
                    return;
                }
            }
            const track = this._queue[this._queueIndex]
            this.recite(track);
            this.onRecitationChanged(this._queue, this._queueIndex);
        }
    }

    public enqueue(track : Recitation)
    {
        this._queue.push(track);
        this.onQueueChanged(this._queue, this._queueIndex);
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
        connection.disconnect();
        connection.destroy();
        this.onDestroy(this._guildId);
    }

    public clear()
    {
        this._audioPlayer.stop();
        this._queue = [];
        this._queueIndex = -1;
        this.onQueueChanged(this._queue, this._queueIndex);
    }
}