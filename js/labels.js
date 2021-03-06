Game.prototype.labels =
{
    locale: 'en',
    get: function(data)
    {
        return this[this.locale][data];
    },
    'en':
    {
        'game_name': 'The Frozen Expedition',
        'life': 'Life',
        'loading_assets': 'Loading game data',
        'loading_level': 'Loading level',
        'reloading' :'Reloading level',
        'follow_me': 'Follow me!',
        'thank_you': 'Thank you!',
        'dont move': 'Don\'t move!',
        'menu_play': 'Play',
        'menu_restart': 'Restart level',
        'menu_retry': 'Retry',
        'menu_options': 'Options',
        'menu_credits': 'Credits',
        'gameover': 'Game over!',
        'menu_sound': 'Sound',
        'menu_graphic': 'Graphic',
        'menu_back': 'Back',
        'global_volume': 'Global',
        'ambient_volume': 'Ambient',
        'music_volume': 'Music',
        'menu_shadow': 'Enable shadows',
        'helpme_title': 'Help me!',
        'helpme_message': 'My name is Pinga. I am lost! Please take me to the <i>Rescue zone</i>!',
        'level2_title': 'Be careful!',
        'level2_message':'I just saw a big bear who doesn\'t look very kind!<br><br><i>Avoid</i> entering his <i>green vision zone</i> to get attacked!',
        'level_door_title':'Help! Help!',
        'level_door_message':'I am <i>trapped</i> in this cell! Please, find <i>the key</i> and rescue me!',
        'fishfound_title': 'Look at that!',
        'fishfound_message' :'A <i>fish</i>! You could use that to <i>distract guards</i>.<br><br>Tip: Use this item to put the Fish on the floor.',
        'lastlevelwin_title':'Congratulation',
        'lastlevelwin_message':'You just ended the last level of the game.',
        'credits_title':'Credits',
        'credits_dev':'Developer',
        'credits_music':'Music',

    } 

};
