require('dotenv').config();

const mongoose = require('mongoose');

const Discord = require('discord.js');
const { parse } = require("discord-command-parser");
const client = new Discord.Client();
const MeetingsUtils = require('./app/MeetingsUtils');

const Settings = require('./models/SettingsModel');
const SettingsManager = require('./app/SettingsManager');

// function, description, aliases, adminOnly
const commandMap = {
    split: [MeetingsUtils.split, "Split all users in the general channel into the breakout channels. Specify the number of rooms desired as an argument.", [], true],
    unsplit: [MeetingsUtils.unsplit, "Move all members in the breakout channels to the general channel.", [], true],
    pickrand: [MeetingsUtils.pickRand, "Pick a random person in the current voice channel.", [], false],
    makeorder: [MeetingsUtils.makeOrder, "Randomly order all members connected to the current voice channel.", [], false],
    muteall: [MeetingsUtils.muteAll, "Mute everyone in the current voice channel. Mention any users (or use \"self\") as arguments to exclude them from being muted.", ["mall"], true],
    unmuteall: [MeetingsUtils.unMuteAll, "Unmute everyone in the current voice channel.", "umall", [], true],
    setgeneral: [MeetingsUtils.setGeneral, "Sets the general meeting room.", [], true],
    addbreakout: [MeetingsUtils.addBreakout, "Adds the current voice channel as a breakout channel.", [], true],
    removebreakout: [MeetingsUtils.removeBreakout, "Removes the current voice channel as a breakout channel.", [], true],
    listbreakouts: [MeetingsUtils.listBreakouts, "Lists all current breakout channels.", [], false],
    setadmin: [MeetingsUtils.setAdmin, "Sets the role with the given ID as the bot admin role.", [], true],
    moderatedsplit: [MeetingsUtils.moderatedSplit, "Split all users in the general channel into the breakout channels with at least one moderated in each. Specify the number of rooms desired as an argument.", ["msplit"], true],
    addmoderator: [MeetingsUtils.addModerator, "Adds a user to the breakout moderator list. Mention any users (or use \"self\") as arguments.", ["amod"], true],
    removemoderator: [MeetingsUtils.removeModerator, "Removes a user from the moderator list. Give the user ID as an argument.", ["rmmod"], true],
    listmoderators: [MeetingsUtils.listModerators, "Lists current breakout moderators.", ["lmod", "lsmod"], false],
    reloadsettings: [MeetingsUtils.reloadSettings, "Reloads bot settings from the database.", [], true]
}

let aliasMap = {}

for(let command of Object.keys(commandMap)){
    for(let alias of commandMap[command][2]){
        aliasMap[alias] = command;
    }
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
            await guild.systemChannel.send("No existing configuration realm exists for this server. Creating a new one.");
        }
        await SettingsManager.loadSettings();
    });

    client.on('message', async message => {
        // call parse function
        let guildSettings = SettingsManager.getGuildSettings(message.guild.id);

        if(process.env.ENVIRONMENT === "development"){
            console.log("Current settings: " + guildSettings);
        }

        if(guildSettings){
            const parsed = parse(message, guildSettings.commandPrefix, { allowSpaceBeforeCommand: true });

            // check for valid command
            if (!parsed.success) return;

            let parsedCommand = parsed.command.toLowerCase();

            if(parsedCommand === "help"){
                let output = `Current command prefix: \`${guildSettings.commandPrefix}\`\n\n`;
                for(let entry of Object.keys(commandMap)){
                    if(!commandMap[entry][3]){
                        output+=`**${entry}**\n\t - ${commandMap[entry][1]}\n\t - Aliases: ${commandMap[entry][2].length > 0 ? commandMap[entry][2].toString() : "none"}\n`;
                    }
                }
                return message.channel.send(output);
            }
            else if(parsedCommand === "ahelp"){
                // admin help
                if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
                    return;
                }

                let output = `**Admin commands:**\nCurrent command prefix: \`${guildSettings.commandPrefix}\`\n\n`;
                for(let entry of Object.keys(commandMap)){
                    if(commandMap[entry][3]){
                        output+=`**${entry}**\n\t - ${commandMap[entry][1]}\n\t - Aliases: ${commandMap[entry][2].length > 0 ? commandMap[entry][2].toString() : "none"}\n`;
                    }
                }
                return message.channel.send(output);
            }
            else{
                if(aliasMap[parsedCommand]){
                    parsedCommand = aliasMap[parsedCommand];
                }

                if(commandMap.hasOwnProperty(parsedCommand)){
                    return commandMap[parsedCommand][0](client, parsed, message, guildSettings);
                }
            }
        }
        else{
            console.log("No settings exist for the current guild! This is normal on first join.");
        }


    });

    client.login(process.env.DISCORD_BOT_TOKEN);
})
    .catch((error) => console.log(error));

