var Potion = function(game, options)
{
    this.default(options);
    this.deleted=false;

    this.is_hoverable=false;
    this.is_static_collision=false;
    this.can_walk_through=true;

    this.increase_life_value = 10;

    this.object_material = game.assets.potion_mat;
    this.object_geo = game.assets.potion_geo;
    this.pick_sound = game.assets.potion_pick_sound;
    this.drop_sound = game.assets.potion_drop_sound;
};

Potion.prototype = Object.create(Common.prototype);
Potion.prototype.constructor = Common;

Potion.prototype.bind = function()
{
    this.walk_through_callback = this.drink.bind(this);
};

Potion.prototype.drink= function()
{
    if(!this.deleted)
    {
        game.focus_perso.increase_life_value(this.increase_life_value);
        this.remove();
    }
}


