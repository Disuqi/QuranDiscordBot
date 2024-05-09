import { Command } from "@sapphire/framework";
import { Message } from "discord.js";
import { Recitator } from "./recitator";

export type RecitatorInteraction =
{
    readonly interaction : Command.ChatInputCommandInteraction;
    readonly notifier: Message;
    readonly recitator : Recitator;
}