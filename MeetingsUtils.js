const { promisify } = require('util')
const sleep = promisify(setTimeout)

let MeetingsUtils = {};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

MeetingsUtils.split = async function(parsed, message){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(process.env.BOT_ADMIN_ROLE_ID)){
        return;
    }

    if(parsed.arguments.length < 1 || isNaN(parsed.arguments[0])){
        return message.channel.send("Please enter the number of groups required.");
    }

    // get a list of all the breakout channels
    let destination_channels = [];
    for(let channelID of process.env.BREAKOUT_VOICE_IDS.split(",")){
        destination_channels.push(message.guild.channels.cache.get(channelID));
    }

    // check if there are enough channels
    if(parseInt(parsed.arguments[0]) > destination_channels.length){
        return message.channel.send("There are not enough breakout channels to fulfill your request.");
    }

    let general_channel = message.guild.channels.cache.get(process.env.GENERAL_VOICE_ID);

    let to_move = general_channel.members.array();
    if(to_move.length === 0){
        return message.channel.send("There are no members to move.");
    }
    shuffleArray(to_move);

    let currIndex = 0;
    let counter = 0;
    while(true){
        let member = to_move.shift();
        await sleep(250);
        member.voice.setChannel(destination_channels[currIndex]);
        counter++;

        currIndex++;
        if(currIndex >= parseInt(parsed.arguments[0])){
            currIndex = 0;
        }

        if(to_move.length === 0){
            break;
        }

    }
    return message.channel.send(`Moved ${counter} members to ${parsed.arguments[0]} breakout channels.`);
}

MeetingsUtils.unsplit = async function(parsed, message){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(process.env.BOT_ADMIN_ROLE_ID)){
        return;
    }

    let general_channel = message.guild.channels.cache.get(process.env.GENERAL_VOICE_ID);

    let counter = 0;
    for(let channelID of process.env.BREAKOUT_VOICE_IDS.split(",")){
        let channel = message.guild.channels.cache.get(channelID);
        for(let member of channel.members.array()){
            await sleep(250);
            member.voice.setChannel(general_channel);
            counter++;
        }

    }
    return message.channel.send(`Moved ${counter} members from breakout channels to the main channel.`);
}

MeetingsUtils.pickRand = function(parsed, message){
    if(message.member.voice.channel === null){
        return message.channel.send("You are not currently connected to a voice channel!");
    }

    let currentChannelMembers = message.member.voice.channel.members.array();

    let chosen = currentChannelMembers[Math.floor(Math.random() * currentChannelMembers.length)]

    return message.channel.send(`<@${chosen.id}> was chosen!`);
}

MeetingsUtils.makeOrder = function(parsed, message){
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

MeetingsUtils.muteAll = function(parsed, message){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(process.env.BOT_ADMIN_ROLE_ID)){
        return;
    }

    if(message.member.voice.channel === null){
        return message.channel.send("You are not currently connected to a voice channel!");
    }

    let toMute = message.member.voice.channel.members.array();

    let counter = 0;
    for(let member of toMute){
        if(member.id !== message.member.id){
            member.voice.setMute(true);
            counter++;
        }
    }
    return message.channel.send(`Muted ${counter} users.`);
}

MeetingsUtils.unMuteAll = function(parsed, message){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(process.env.BOT_ADMIN_ROLE_ID)){
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
    }

    return message.channel.send(`Unmuted ${counter} users.`);
}

module.exports = MeetingsUtils;