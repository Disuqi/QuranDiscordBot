import axios from 'axios';
import { NumberLiteralType } from 'typescript';
import { Quran } from '../commands/quran';

export class QuranTextAPI {
    static quran_com: string = 'https://api.quran.com/api/v4';

    static async getSurahInfo(surah: number) : Promise<SurahInfo>
    {
        const response = await axios.get(`${QuranTextAPI.quran_com}/chapters/${surah}`);
        return response.data['chapter'] as SurahInfo;
    }

    static async getSurahDescription(surah: number) : Promise<string>
    {
        const response = await axios.get(`${QuranTextAPI.quran_com}/chapters/${surah}/info`);
        return response.data['chapter_info']['short_text'];
    }

    static async getArabicText(quran_params: QuranParams) : Promise<ArabicText>
    {
        const response = await axios.get(`${QuranTextAPI.quran_com}/quran/verses/indopak`, {
            params: QuranTextAPI.paramsToJson(quran_params),
        });
        return response.data['verses'] as ArabicText;
    }

    static async getTranslation(translationId: number, quran_params: QuranParams) : Promise<Translation>
    {
        const response = await axios.get(`${QuranTextAPI.quran_com}/quran/translations/${translationId}`, {
            params:  QuranTextAPI.paramsToJson(quran_params),
        });
        return response.data['translations'] as Translation;
    }

    static async getTafsir(tafsir_id: number, quran_params: QuranParams) : Promise<Translation>
    {
        const response = await axios.get(`${QuranTextAPI.quran_com}/quran/tafsirs/${tafsir_id}`,
        {
            params:  QuranTextAPI.paramsToJson(quran_params),
        });
        return response.data['tafsirs'] as Translation;
    }

    static async listSurahs() : Promise<SurahInfo[]>
    {
        const response = await axios.get(`${QuranTextAPI.quran_com}/chapters`);
        return response.data['chapters'] as SurahInfo[];
    }

    static async listTranslations() : Promise<TranslationInfo[]>
    {
        const response = await axios.get(`${QuranTextAPI.quran_com}/resources/translations`);
        return response.data['translations'] as TranslationInfo[];
    }

    static async listTafsirs() : Promise<TranslationInfo[]>
    {
        const response = await axios.get(`${QuranTextAPI.quran_com}/resources/tafsirs`);
        return response.data['tafsirs'] as TranslationInfo[];
    }

    static async search(query: string)
    {
        const response = await axios.get(`${QuranTextAPI.quran_com}/search`, {params: { q: query }});
        console.log(response.data);
        return response.data["search"]["results"] as SearchResult[];
    }

    private static paramsToJson(params : QuranParams) : Record<string, any>
    {
        const json: Record<string, any> = {};
        if (params.juz > 0) {
            json['juz_number'] = params.juz;
        }
        if (params.hizb > 0) {
            json['hizb_number'] = params.hizb;
        }
        if (params.rub > 0) {
            json['rub_number'] = params.rub;
        }
        if (params.page > 0) {
            json['page_number'] = params.page;
        }
        if (params.surah > 0) {
            json['chapter_number'] = params.surah;
        }
        if (params.surah > 0 && params.aya > 0) {
            json['verse_key'] = `${params.surah}:${params.aya}`;
        }
        return json;
    }
}

export type QuranParams = 
{
    juz?: number;
    hizb?: number;
    rub?: number;
    page?: number;
    surah?: number;
    aya?: number;
}

export enum RecitationType
{
    Juz,
    Hizb,
    Rub,
    Page,
    Chapter,
    Aya
}

export type SurahInfo = 
{
    id: number,
    revelation_place: string,
    revelation_order: number,
    bismillah_pre: boolean,
    name_simple: string,
    name_complex: string,
    name_arabic: string,
    verses_count: number,
    pages: [ number, number ],
    translated_name: { language_name: string, name: string }
}

export type ArabicVerse = 
{
    id: number,
    verse_key: string,
    text_indopak: string
}

export type TranslatedVerse = 
{
    resource_id : number,
    text : string
}

export type ArabicText = 
{
    ayat : [ArabicVerse]
}

export type Translation =
{
    verses: [TranslatedVerse]
}

export type Pagination = 
{
    per_page: number,
    current_page: number,
    next_page: number,
    total_pages: number,
    total_records: number
}

export type TranslationInfo = 
{
    id: number,
    name: string,
    slug: string,
    language_name: string,
    translated_name: { name: string, language_name: string }
}

export type SearchResult = 
{
    verse_key: string,
    verse_id: number,
    text: string,
    highlighted: null,
    words: [Word],
    translations: [VerseTranslation]
}

export type VerseTranslation =
{
    text: string,
    resource_id: number,
    name: string,
    language_name: string
}

export type Word = 
{
    char_type: string,
    text: string,
}