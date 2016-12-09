var Hammer = function(game, options)
{
    this.default(options);
    this.type='Hammer';
    this.deleted=false;

    this.is_hoverable=true;
    this.can_walk_through=true;
    this.has_walk_through_callback=false;
    this.is_static_collision=false;

    this.weapon_speed=1.0;
    this.weapon_range = 20;
    this.weapon_attack_damage = 45;
    this.weapon_hit_chance = 1.0;

    this.weapon_defense = 0.3;

    this.increase_life_value = 10;

    this.hover_color =  0x330000;
    this.scale=5;

    this.mesh_position = new THREE.Vector3(0,0.5,0);

    this.object_material = game.assets.hammer_mat;
    this.object_geo = game.assets.hammer_geo;
    this.pick_sound = game.assets.hammer_pick_sound;
    this.drop_sound = game.assets.hammer_drop_sound;
};

Hammer.prototype = Object.create(Common.prototype);
Hammer.prototype.constructor = Common;

Hammer.prototype.targeted= function(from)
{
    if(!this.deleted)
    {
        game.gui.add_weapon('hammer');
        this.remove();
    }
};



