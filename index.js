require('dotenv').config();

const Discord = require('discord.js');
const { parse } = require("discord-command-parser");
const client = new Discord.Client();
const MeetingsUtils = require('./MeetingsUtils');


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    // call parse function
    const parsed = parse(message, process.env.COMMAND_PREFIX, { allowSpaceBeforeCommand: true });

    // check for valid command
    if (!parsed.success) return;

    // handle command
    if (parsed.command === "split") {
        return MeetingsUtils.split(parsed, message);
    }
    else if(parsed.command === "unsplit"){
        return MeetingsUtils.unsplit(parsed, message);
    }
    else if(parsed.command === "pickrand"){
        return MeetingsUtils.pickRand(parse, message);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);