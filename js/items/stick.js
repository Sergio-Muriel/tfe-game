var Stick = function(game, options)
{
    this.default(options);
    this.type='Stick';
    this.deleted=false;

    this.is_hoverable=true;
    this.can_walk_through=true;
    this.has_walk_through_callback=false;
    this.is_static_collision=false;

    this.weapon_speed=0.5;
    this.weapon_range = 15;
    this.weapon_attack_damage = 10;
    this.weapon_hit_chance = 0.9;

    this.weapon_defense = 0.5;
    this.increase_life_value = 10;
    this.hover_color =  0x330000;
    this.scale=5;

    this.mesh_position = new THREE.Vector3(0,0.5,0);

    this.object_material = game.assets.stick_mat;
    this.object_geo = game.assets.stick_geo;
    this.pick_sound = game.assets.stick_pick_sound;
    this.drop_sound = game.assets.stick_drop_sound;

};

Stick.prototype = Object.create(Common.prototype);
Stick.prototype.constructor = Common;


Stick.prototype.equip= function()
{
    if(!this.deleted)
    {
        game.gui.add_weapon('stick');
        this.remove();
    }
};

Stick.prototype.bind = function()
{
    this.walk_through_callback = this.equip.bind(this, this.options.walk_through_callback);
};

