const mongoose = require('mongoose');
const Settings = require('../models/SettingsModel');
let BotSettings = {}
let SettingsManager = {}

SettingsManager.loadSettings = async function(){
    console.log("Reloading settings.");
    BotSettings = {};
    let allSettings = await Settings.find({});
    for(let setting of allSettings){
        BotSettings[setting.guild] = setting;
    }
    console.log(BotSettings);
}

SettingsManager.getGuildSettings = function(guildID){
    return BotSettings[guildID];
}

module.exports = SettingsManager;