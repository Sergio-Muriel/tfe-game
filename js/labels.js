Game.prototype.labels =
{
    locale: 'en',
    get: function(data)
    {
        return this[this.locale][data];
    },
    'en':
    {
        'game_name': 'The Unnamed game',
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
        'you_died': 'You died!',
        'menu_sound': 'Sound',
        'menu_graphic': 'Graphic',
        'menu_back': 'Back',
        'global_volume': 'Global',
        'ambient_volume': 'Ambient',
        'music_volume': 'Music',
        'menu_shadow': 'Enable shadows'
    } 
};
