require('dotenv').config();

const mongoose = require('mongoose');

const Discord = require('discord.js');
const { parse } = require("discord-command-parser");
const client = new Discord.Client();
const MeetingsUtils = require('./app/MeetingsUtils');

const Settings = require('./models/SettingsModel');
const SettingsManager = require('./app/SettingsManager');

const commandMap = {
    split: [MeetingsUtils.split, "Split all members of the general channels into the breakout channels. Specify the number of rooms desired as an argument."],
    unsplit: [MeetingsUtils.unsplit, "Move all members in the breakout channels to the general channel."],
    pickRand: [MeetingsUtils.pickRand, "Pick a random person in the voice current channel."],
    makeOrder: [MeetingsUtils.makeOrder, "Randomly order all members connected to the current voice channel."],
    muteAll: [MeetingsUtils.muteAll, "Mute everyone in the current voice channel except yourself."],
    unmuteAll: [MeetingsUtils.unMuteAll, "Unmute everyone in the current voice channel. Mention any users (or use \"self\") as arguments to exclude them from being muted."],
    setGeneral: [MeetingsUtils.setGeneral, "Sets the general meeting room."],
    addBreakout: [MeetingsUtils.addBreakout, "Adds the current voice channel as a breakout channel."],
    removeBreakout: [MeetingsUtils.removeBreakout, "Removes the current voice channel as a breakout channel."],
    listBreakouts: [MeetingsUtils.listBreakouts, "Lists all current breakout channels."]
}

mongoose.connect(process.env.MONGO_DB_URL, {useNewUrlParser: true});

SettingsManager.loadSettings()
    .then(() => {
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('guildCreate', async guild => {
        const ifSeverAlreadyExists = await Settings.findOne({guild : guild.id});
        if(ifSeverAlreadyExists){
            await guild.systemChannel.send("Configuration realm already exists for this server. Restoring it.")
        }
        else{
            await Settings.create({
                guild: guild.id
            });
        }
        await guild.systemChannel.send("No existing configuration realm exists for this server. Creating a new one.");
        await SettingsManager.loadSettings();
    });

    client.on('message', async message => {
        // call parse function
        let guildSettings = SettingsManager.getGuildSettings(message.guild.id);

        console.log(guildSettings);

        const parsed = parse(message, guildSettings.commandPrefix, { allowSpaceBeforeCommand: true });

        // check for valid command
        if (!parsed.success) return;


        if(commandMap.hasOwnProperty(parsed.command)){
            return commandMap[parsed.command][0](parsed, message, guildSettings);
        }
        else if(parsed.command === "help"){
            let output = `Current command prefix: \`${guildSettings.commandPrefix}\`\n\n`;
            for(let entry of Object.keys(commandMap)){
                output+=`${entry} - ${commandMap[entry][1]}\n`;
            }
            console.log(output);
            return message.channel.send(output);
        }
    });

    client.login(process.env.DISCORD_BOT_TOKEN);
})
    .catch((error) => console.log(error));

