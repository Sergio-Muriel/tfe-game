var Noise = function(game, options)
{
    this.default(options);
    this.type='Noise';
};

Noise.prototype = Object.create(Common.prototype);
Noise.prototype.constructor = Noise;

Noise.prototype.use_callback = function()
{
    console.log('make some noise!');
    play_multiple(game.assets.perso_noise_sound);
};

