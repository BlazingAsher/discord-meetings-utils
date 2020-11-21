const { promisify } = require('util')
const sleep = promisify(setTimeout)
const Settings = require('../models/SettingsModel');
const SettingsManager = require('../app/SettingsManager');

let MeetingsUtils = {};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// returns ID of user from mention
function getUserFromMention(mention) {
    if (!mention) return;

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }

        return mention;
    }
}

async function internalSplit(client, parsed, message, guildSettings, moderators) {
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    if(parsed.arguments.length < 1 || isNaN(parsed.arguments[0])){
        return message.channel.send("Please enter the number of groups required.");
    }

    const numDesiredChannels = parseInt(parsed.arguments[0]);

    // get a list of all the breakout channels
    let destination_channels = [];
    for(let channelID of guildSettings.breakoutChannels){
        // limit channels to only the amount desired
        if(destination_channels.length === numDesiredChannels){
            break;
        }
        destination_channels.push(message.guild.channels.cache.get(channelID));
    }

    // check if there are enough channels
    if(parseInt(parsed.arguments[0]) > destination_channels.length){
        return message.channel.send("There are not enough breakout channels to fulfill your request.");
    }

    let general_channel = message.guild.channels.cache.get(guildSettings.generalChannel);

    if(general_channel === undefined){
        return message.channel.send(`The general channel is not defined! Run \`${guildSettings.commandPrefix}setGeneral\` while connected to the general channel to set it!`);
    }

    let to_move = general_channel.members.array();
    let to_moderators = [];

    for(let i = 0;i<to_move.length;i++){
        if(moderators.indexOf(to_move[i].id) !== -1){
            to_moderators.push(to_move[i]);
            to_move.splice(i,1);
        }
    }

    if(to_move.length === 0){
        return message.channel.send("There are no members to move.");
    }

    shuffleArray(to_moderators);

    shuffleArray(to_move);

    let currIndex = 0;
    let counter = 0;
    while(destination_channels.length > 0){
        let member;
        // first move the moderators
        if(to_moderators.length > 0){
            member = to_moderators.shift();
        }
        else{
            member = to_move.shift();
        }

        await sleep(250);
        member.voice.setChannel(destination_channels[currIndex]);
        counter++;

        currIndex++;
        if(currIndex >= parseInt(parsed.arguments[0])){
            currIndex = 0;
        }

        if(to_moderators.length === 0 && to_move.length === 0){
            break;
        }

    }
    return message.channel.send(`Moved ${counter} members to ${parsed.arguments[0]} breakout channels.`);
}

MeetingsUtils.split = function(client, parsed, message, guildSettings){
    internalSplit(client, parsed, message, guildSettings, []);
}

MeetingsUtils.unsplit = async function(client, parsed, message, guildSettings){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    let general_channel = message.guild.channels.cache.get(guildSettings.generalChannel);

    if(general_channel === undefined){
        return message.channel.send(`The general channel is not defined! Run \`${guildSettings.commandPrefix}setGeneral\` while connected to the general channel to set it!`);
    }

    let counter = 0;
    for(let channelID of guildSettings.breakoutChannels){
        let channel = message.guild.channels.cache.get(channelID);
        for(let member of channel.members.array()){
            await sleep(250);
            member.voice.setChannel(general_channel);
            counter++;
        }

    }
    return message.channel.send(`Moved ${counter} members from breakout channels to the main channel.`);
}

MeetingsUtils.pickRand = function(client, parsed, message, guildSettings){
    if(message.member.voice.channel === null){
        return message.channel.send("You are not currently connected to a voice channel!");
    }

    let currentChannelMembers = message.member.voice.channel.members.array();

    let chosen = currentChannelMembers[currentChannelMembers.length * Math.random() | 0]

    return message.channel.send(`<@${chosen.id}> was chosen!`);
}

MeetingsUtils.makeOrder = function(client, parsed, message, guildSettings){
    if(message.member.voice.channel === null){
        return message.channel.send("You are not currently connected to a voice channel!");
    }

    let currentChannelMembers = message.member.voice.channel.members.array();
    shuffleArray(currentChannelMembers);

    let output = "";
    for(let i=0;i<currentChannelMembers.length;i++){
        output+=`${i+1}. <@${currentChannelMembers[i].id}>\n`;
    }
    console.log(output);
    return message.channel.send(output);
}

MeetingsUtils.muteAll = async function(client, parsed, message, guildSettings){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    if(message.member.voice.channel === null){
        return message.channel.send("You are not currently connected to a voice channel!");
    }

    let excluded = [];

    if(parsed.arguments.length > 0){
        for(let exclusion of parsed.arguments){
            if(exclusion === "self"){
                excluded.push(message.member.id);
            }
            else{
                let tempUser = getUserFromMention(exclusion);
                if(isNaN(tempUser)){
                    message.channel.send(`${tempUser} is not a valid user. Skipping.`);
                }
                else{
                    excluded.push(tempUser);
                }

            }
        }
    }

    let toMute = message.member.voice.channel.members.array();

    let counter = 0;
    for(let member of toMute){
        if(excluded.indexOf(member.id) === -1){
            member.voice.setMute(true);
            counter++;
            await sleep(150);
        }
    }
    return message.channel.send(`Muted ${counter} users.`);
}

MeetingsUtils.unMuteAll = async function(client, parsed, message, guildSettings){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    if(message.member.voice.channel === null){
        return message.channel.send("You are not currently connected to a voice channel!");
    }

    let toUnmute = message.member.voice.channel.members.array();

    let counter = 0;
    for(let member of toUnmute){
        member.voice.setMute(false);
        counter++;
        await sleep(150);
    }

    return message.channel.send(`Unmuted ${counter} users.`);
}

MeetingsUtils.setGeneral = async function(client, parsed, message, guildSettings){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    if(message.member.voice.channel === null){
        return message.channel.send("You are not currently connected to a voice channel!");
    }

    let newGeneral = message.member.voice.channel.id;

    try{
        await Settings.findOneAndUpdate({
            guild: message.guild.id,
        }, {
            generalChannel: newGeneral
        });
        await SettingsManager.loadSettings();
        return message.channel.send(`The general channel has been updated to ${message.member.voice.channel.name}.`);
    }
    catch{
        return message.channel.send("There was an error updating the database.");
    }
}

MeetingsUtils.addBreakout = async function(client, parsed, message, guildSettings){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    if(message.member.voice.channel === null){
        return message.channel.send("You are not currently connected to a voice channel!");
    }

    let newBreakout = message.member.voice.channel.id;

    try{
        await Settings.findOneAndUpdate({
            guild: message.guild.id,
        }, {
            $push: {
                breakoutChannels: newBreakout
            }
        });
        await SettingsManager.loadSettings();
        return message.channel.send(`${message.member.voice.channel.name} has been added as a breakout channel.`);
    }
    catch{
        return message.channel.send("There was an error updating the database.");
    }
}

MeetingsUtils.removeBreakout = async function(client, parsed, message, guildSettings){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    if(message.member.voice.channel === null){
        return message.channel.send("You are not currently connected to a voice channel!");
    }

    let newBreakout = message.member.voice.channel.id;

    try{
        await Settings.findOneAndUpdate({
            guild: message.guild.id,
        }, {
            $pull: {
                breakoutChannels: newBreakout
            }
        });
        await SettingsManager.loadSettings();
        return message.channel.send(`${message.member.voice.channel.name} has been removed as a breakout channel.`);
    }
    catch{
        return message.channel.send("There was an error updating the database.");
    }
}

MeetingsUtils.listBreakouts = function(client, parsed, message, guildSettings){
    let output = "Current breakout channels:\n"
    for(let breakoutID of guildSettings.breakoutChannels){
        output += "- " + message.guild.channels.cache.get(breakoutID).name + "\n";
    }
    return message.channel.send(output);
}

MeetingsUtils.setAdmin = async function(client, parsed, message, guildSettings){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    if(parsed.arguments.length === 0){
        return message.channel.send(`Please specify the ID of the admin role!`);
    }

    try{
        await Settings.findOneAndUpdate({
            guild: message.guild.id,
        }, {
            adminRole: parsed.arguments[0]
        });
        await SettingsManager.loadSettings();
        return message.channel.send(`<@&${parsed.arguments[0]}> has been set as the admin role.`);
    }
    catch{
        return message.channel.send("There was an error updating the database.");
    }
}

MeetingsUtils.addModerator = async function(client, parsed, message, guildSettings){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    if(parsed.arguments.length < 1){
        return message.channel.send("Please mention at least one person to be added as a moderator!");
    }

    let to_add = [];

    for(let mention of parsed.arguments){
        if(mention === "self"){
            to_add.push(message.member.id);
        }
        else{
            let tempID = getUserFromMention(mention);
            if(isNaN(tempID)){
                return message.channel.send("Please check to ensure that you are mentioning a valid user!");
            }
            if(guildSettings.moderators.indexOf(tempID) === -1){
                to_add.push(tempID);
            }
            else{
                message.channel.send(`The user <@${tempID}> is already a moderator. Skipping them and continuing.`);
            }

        }
    }

    await Settings.findOneAndUpdate({
        guild: message.guild.id,
    }, {
        $push: {
            moderators: {
                $each: to_add
            }
        }
    });
    await SettingsManager.loadSettings();
    return message.channel.send(`Successfully updated the moderator list.`);
}

MeetingsUtils.removeModerator = async function(client, parsed, message, guildSettings){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(guildSettings.adminRole)){
        return;
    }

    if(parsed.arguments.length < 1){
        return message.channel.send("Please give the ID of the person to remove as moderator!");
    }


    let mention = parsed.arguments[0];
    if(mention === "self"){
        mention = message.member.id;
    }
    await Settings.findOneAndUpdate({
        guild: message.guild.id,
    }, {
        $pull: {
            moderators: mention
        }
    });

    await SettingsManager.loadSettings();
    return message.channel.send(`Successfully updated the moderator list.`);

}

MeetingsUtils.listModerators = async function(client, parsed, message, guildSettings){
    let output = "Current breakout moderators:\n";
    for(const moderator of guildSettings.moderators){
        const tempUser = await client.guilds.cache.get(guildSettings.guild).members.fetch(moderator);
        console.log(tempUser);
        //const tempUser = client.users.cache.get(moderator);
        output += `- ${tempUser ? tempUser.displayName + " (" + moderator + ")" : moderator}\n`;
    }
    return message.channel.send(output);
}

MeetingsUtils.moderatedSplit = function(client, parsed, message, guildSettings){
    internalSplit(client, parsed, message, guildSettings, guildSettings.moderators)
}

module.exports = MeetingsUtils;