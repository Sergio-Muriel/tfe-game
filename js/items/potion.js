var Potion = function(game, options)
{
    this.default(options);
    this.deleted=false;

    this.is_hoverable=false;
    this.can_walk_through=true;
    this.has_walk_through_callback=true;
    this.is_static_collision=false;

    this.increase_life_value = 10;

    this.object_material = game.assets.potion_mat;
    this.object_geo = game.assets.potion_geo;
    this.pick_sound = game.assets.potion_pick_sound;
    this.drop_sound = game.assets.potion_drop_sound;

    this.remove= function(callback)
    {
        if(!this.deleted)
        {
            this.deleted=true;
            play_multiple(game.assets.potion_pick_sound);
            game.focus_perso.increase_life_value(this.increase_life_value);
            this.options.parentStructure.remove_interraction_item(this);
            game.scene.remove(this.container);
            if(callback)
            {
                callback();
            }
            game.updateCollisionsCache();
        }
    }
};

Potion.prototype = Object.create(Common.prototype);
Potion.prototype.constructor = Common;

