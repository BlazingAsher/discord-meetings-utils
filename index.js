require('dotenv').config();

const Discord = require('discord.js');
const { parse } = require("discord-command-parser");
const client = new Discord.Client();
const MeetingsUtils = require('./MeetingsUtils');

const commandMap = {
    split: [MeetingsUtils.split, "Split all members of the general channels into the breakout channels."],
    unsplit: [MeetingsUtils.unsplit, "Move all members in the breakout channels to the general channel."],
    pickRand: [MeetingsUtils.pickRand, "Pick a random person in the voice current channel."],
    makeOrder: [MeetingsUtils.makeOrder, "Randomly order all members connected to the current voice channel."],
    muteAll: [MeetingsUtils.muteAll, "Mute everyone in the current voice channel except yourself."],
    unmuteAll: [MeetingsUtils.unMuteAll, "Unmute everyone in the current voice channel except yourself."]
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    // call parse function
    const parsed = parse(message, process.env.COMMAND_PREFIX, { allowSpaceBeforeCommand: true });

    // check for valid command
    if (!parsed.success) return;


    if(commandMap.hasOwnProperty(parsed.command)){
        return commandMap[parsed.command][0](parsed, message);
    }
    else if(parsed.command === "help"){
        let output = `Current command prefix: \`${process.env.COMMAND_PREFIX}\`\n\n`;
        for(let entry of Object.keys(commandMap)){
            output+=`${entry} - ${commandMap[entry][1]}\n`;
        }
        console.log(output);
        return message.channel.send(output);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);