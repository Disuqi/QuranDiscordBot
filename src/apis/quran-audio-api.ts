import axios, { all } from "axios";
import { QuranTextAPI } from "./quran-text-api";

export class QuranAudioAPI
{
    public static readonly DEFAULT_RECITER_ID = 118;
    private static _allReciters : Reciter[];
    private static _recitersPerChapter : {[key: number]: Set<Reciter> };

    static async initialize() : Promise<void>
    {
        const response = await axios.get("https://mp3quran.net/api/v3/reciters", {params: {language: 'eng'}});
        QuranAudioAPI._allReciters = response.data['reciters'] as Reciter[]; 

        QuranAudioAPI._recitersPerChapter = {};
        for(let i = 1; i <= 114; i++)
        {
            QuranAudioAPI._recitersPerChapter[i] = new Set<Reciter>();
        }

        QuranAudioAPI._allReciters.forEach(reciter => 
        {
            reciter.moshaf.forEach(moshaf => 
            {
                const moshafSuras : number[] = moshaf.surah_list.split(',').map(Number);
                moshafSuras.forEach(surah => 
                {
                    QuranAudioAPI.recitersPerChapter[surah].add(reciter);
                });
            });
        });
    }

    static get listReciters() : Reciter[]
    {
        return QuranAudioAPI._allReciters;
    }

    static get recitersPerChapter() : {[key: number]: Set<Reciter> }
    {
        return QuranAudioAPI._recitersPerChapter;
    }

    static getReciter(id: number) : Reciter
    {
        return QuranAudioAPI._allReciters.find(reciter => reciter.id == id);
    }

    static listRecitersBySurah(surah: number) : Reciter[]
    {
        return Array.from(QuranAudioAPI.recitersPerChapter[surah]);
    }

    static async getSurahAudio(surah : number, reciterId : number, moshafType: MoshafType = MoshafType["Rewayat Hafs A'n Assem - Murattal"], allowOtherMoshaf: boolean = true) : Promise<string>
    {
        const response = await axios.get("https://mp3quran.net/api/v3/reciters", {params: {language: 'eng', reciter: reciterId}});
        const reciter = response.data['reciters'][0] as Reciter;

        let link : string = null;
        for(let i = reciter.moshaf.length - 1; i >= 0; i--)
        {
            const moshaf = reciter.moshaf[i];
            if(moshaf.moshaf_type == moshafType)
            {
                if(moshaf.surah_list.includes(surah.toString()))
                    link = moshaf.server + surah.toString().padStart(3, '0') + ".mp3";

                break;
            }
        }

        if(!link && allowOtherMoshaf)
        {
            for(let i = reciter.moshaf.length - 1; i >= 0; i--)
            {
                const moshaf = reciter.moshaf[i];
                if(moshaf.surah_list.includes(surah.toString()))
                {
                    link = moshaf.server + surah.toString().padStart(3, '0') + ".mp3";
                    break;
                }
            }
        }

        if(link)
            return link;
        else
            throw new Error("No audio found for surah " + surah + " and reciter " + reciterId);
    }

    static randomReciterForSurah(surah: number) : Reciter
    {
        const reciters = QuranAudioAPI.listRecitersBySurah(surah);
        return reciters[Math.floor(Math.random() * reciters.length)];
    }
}

export type Reciter =
{
    id: number;
    name: string;
    letter: 'I',
    moshaf: [Moshaf]
}

export type Moshaf = 
{
    id: number;
    name: string;
    server: string;
    surah_total: number;
    moshaf_type: MoshafType;
    surah_list: string;
}

enum MoshafType {
    "Rewayat Hafs A'n Assem - Murattal" = 11,
    "Almusshaf Al Mojawwad - Almusshaf Al Mojawwad" = 222,
    "Almusshaf Al Mo'lim - Almusshaf Al Mo'lim" = 213,
    "Rewayat Warsh A'n Nafi' Men Tariq Alazraq - Murattal" = 181,
    "Rewayat Hafs A'n Assem - 4" = 14,
    "Rewayat Warsh A'n Nafi' Men  Tariq Abi Baker Alasbahani - Murattal" = 101,
    "Rewayat AlDorai A'n Al-Kisa'ai - Murattal" = 121,
    "Rewayat Albizi and Qunbol A'n Ibn Katheer - Murattal" = 111,
    "Rewayat Qalon A'n Nafi' - Murattal" = 51,
    "Rewayat Aldori A'n Abi Amr - Murattal" = 131,
    "Rewayat Warsh A'n Nafi' - Murattal" = 21,
    "Ibn Thakwan A'n Ibn Amer - Murattal" = 161,
    "Sho'bah A'n Asim - Murattal" = 151,
    "Ibn Jammaz A'n Abi Ja'far - Murattal" = 201,
    "Hesham A'n Abi A'mer - Murattal" = 191,
    "Rewayat Khalaf A'n Hamzah - Murattal" = 31,
    "Rewayat Assosi A'n Abi Amr - Murattal" = 71,
    "Rewayat Albizi A'n Ibn Katheer - Murattal" = 41,
    "Rewayat Qunbol A'n Ibn Katheer - Murattal" = 61,
    "Rewayat Rowis and Rawh A'n Yakoob Al Hadrami  - Murattal" = 91,
    "Rewayat Qalon A'n Nafi' Men Tariq Abi Nasheet - Murattal" = 81
}