var Noise = function(game, options)
{
    this.default(options);
    this.noise_range =50;
    this.type='Noise';
};

Noise.prototype = Object.create(Common.prototype);
Noise.prototype.constructor = Noise;

Noise.prototype.use_callback = function(from)
{
    var self=this;
    console.log('make some noise!');
    document.querySelector('.bone_attachment.noise').classList.add('selected');
    window.setTimeout(this.stop_selection.bind(this), 500);
    game.assets.perso_noise_sound.play();
    game.getEnnemis().forEach(function(ennemy)
    {
        ennemy.object.disturb(from.container.position, self.noise_range);
    });
};
Noise.prototype.stop_selection = function()
{
    document.querySelector('.bone_attachment.noise').classList.remove('selected');
};

