var Chest = function(game, options)
{
    this.default(options);
    this.deleted=false;
    this.type='Chest';
    this.hover_color =  0x330000;

    var original_material_emissive=[];
    var hover_material_emissive=[];

    this.is_static_collision=true;
    this.can_walk_through=false;
    this.has_walk_through_callback=false;
    this.is_hoverable=true;

    this.scale=2;
    this.mesh_position = new THREE.Vector3(0,0.5,0);

    this.object_material = game.assets.chest_mat;
    this.object_geo = game.assets.chest_geo;
    this.pick_sound = game.assets.chest_pick_sound;
    this.drop_sound = game.assets.chest_drop_sound;
};

Chest.prototype = Object.create(Common.prototype);
Chest.prototype.constructor = Common;

Chest.prototype.bind = function()
{
    this.openingClip = game.assets.chest_geo.animations[1];
    this.openedClip = game.assets.chest_geo.animations[2];
    this.open_action = this.mixer.clipAction(this.openingClip, null ).setDuration(1);
    this.open_action.setLoop(THREE.LoopOnce, 0);
    this.open_action.clampWhenFinished=true;
    this.open_action.setEffectiveWeight(1);

    this.opened_action = this.mixer.clipAction(this.openedClip, null ).setDuration(3);
    this.opened_action.setEffectiveWeight(0.1);
    this.opened_action.play();
}

Chest.prototype.targeted = function(from)
{
    if(!this.is_opened)
    {
        var distance = from.container.position.distanceTo(this.container.position);
        if(distance<from.open_range)
        {
            this.is_opened=true;
            this.is_hoverable=false;
            from.open();
            play_multiple(game.assets.chest_open_sound);
            game.updateCollisionsCache();
            this.open_action.play();
            window.setTimeout(this.drop.bind(this), 200);
            return true;
        }
    }
    return false;
};
Chest.prototype.untargeted = function(from)
{
};
Chest.prototype.drop = function()
{
    game.drop({
        drops:this.options.drops,
        x: game.focus_perso.container.position.x,
        y:0,
        z:game.focus_perso.container.position.z
    });
};



