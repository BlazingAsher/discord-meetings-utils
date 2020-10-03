let MeetingsUtils = {};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

MeetingsUtils.split = function(parsed, message){
    if(parsed.arguments.length < 1){
        return message.channel.send("Please enter the number of groups required.");
    }

    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(process.env.BOT_ADMIN_ROLE_ID)){
        return;
    }

    let general_channel = message.guild.channels.cache.get(process.env.GENERAL_VOICE_ID);

    let destination_channels = [];

    for(let channelID of process.env.BREAKOUT_VOICE_IDS.split(",")){
        destination_channels.push(message.guild.channels.cache.get(channelID));
    }

    let to_move = general_channel.members.array();
    if(to_move.length === 0){
        return message.channel.send("There are no members to move.");
    }
    shuffleArray(to_move);

    let currIndex = 0;
    while(true){
        let member = to_move.shift();
        member.voice.setChannel(destination_channels[currIndex]);

        currIndex++;
        if(currIndex > parseInt(parsed.arguments[0])){
            currIndex = 0;
        }

        if(to_move.length === 0){
            break;
        }
    }

    return message.channel.send(`Moved members between ${parsed.arguments[0]} channels.`);
}

MeetingsUtils.unsplit = function(parsed, message){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(process.env.BOT_ADMIN_ROLE_ID)){
        return;
    }

    let general_channel = message.guild.channels.cache.get(process.env.GENERAL_VOICE_ID);
    for(let channelID of process.env.BREAKOUT_VOICE_IDS.split(",")){
        let channel = message.guild.channels.cache.get(channelID);
        channel.members.forEach(member => {
            member.voice.setChannel(general_channel);
        })
    }
    return message.channel.send("Moved members from breakout channels to main channel.");
}

MeetingsUtils.pickRand = function(parsed, message){
    if(!message.member.hasPermission('ADMINISTRATOR') && !message.member.roles.has(process.env.BOT_ADMIN_ROLE_ID)){
        return;
    }

    let general_channel = message.guild.channels.cache.get(process.env.GENERAL_VOICE_ID);
    let members = general_channel.members.array();

    let chosen = members[Math.floor(Math.random() * members.length)]

    return message.channel.send(`<@${chosen.id}> was chosen!`);
}

module.exports = MeetingsUtils;