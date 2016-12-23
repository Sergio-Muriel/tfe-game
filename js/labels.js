Game.prototype.labels =
{
    locale: 'en',
    get: function(data)
    {
        return this[this.locale][data];
    },
    'en':
    {
        'life': 'Life',
        'loading_assets': 'Loading game data',
        'loading_level': 'Loading level',
        'reloading' :'Reloading level',
        'follow me': 'Follow me!',
        'dont move': 'Don\'t move!',
        'menu_play': 'Play',
        'menu_restart': 'Restart',
        'menu_retry': 'Retry',
        'you_died': 'You died!'
    }
};
