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
        'follow me': 'Follow me!',
        'dont move': 'Don\'t move!',
    }
};
