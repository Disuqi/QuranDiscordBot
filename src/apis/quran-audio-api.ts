import axios from "axios";

export class QuranAudioAPI
{
    static async listReciters() : Promise<Reciter[]>
    {
        const response = await axios.get("https://mp3quran.net/api/v3/reciters", {params: {language: 'eng'}});
        console.log(response.data);
        return response.data['reciters'] as Reciter[];
    }

    static async getSurahAudio(surah : number, reciterId : number) : Promise<string>
    {
        console.log("Getting audio for surah", surah, "reciter", reciterId);
        const response = await axios.get("https://mp3quran.net/api/v3/reciters", {params: {language: 'eng', reciter: reciterId, sura: surah}});
        console.log(response.data);
        const reciter = response.data['reciters'][0] as Reciter;
        const server = reciter.moshaf[reciter.moshaf.length - 1].server;
        const surahUrl = surah.toString().padStart(3, '0') + ".mp3";
        return server + surahUrl;
    }

    static async getReciter(reciter: number) : Promise<Reciter>
    {
        const response = await axios.get("https://mp3quran.net/api/v3/reciters", {params: {language: 'eng', reciter: reciter}});
        return response.data['reciters'][0] as Reciter;
    }

    static async listRecitersWithSurah(surah: number) : Promise<Reciter[]>
    {
        const response = await axios.get("https://mp3quran.net/api/v3/reciters", {params: {language: 'eng', sura: surah}});
        return response.data['reciters'] as Reciter[];
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
    moshaf_type: number;
    surah_list: string;
}