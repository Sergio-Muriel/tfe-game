var Key = function(game, options)
{
    this.default(options);
    this.type='Key';
    this.deleted=false;
    this.opened=false;

    this.is_hoverable=false;
    this.can_walk_through=true;
    this.has_walk_through_callback=true;
    this.is_static_collision=false;
    
    this.mesh_position = new THREE.Vector3(0,0.5,0);
    this.scale = 10;

    this.object_material = game.assets.key_mat;
    this.object_geo = game.assets.key_geo;
    this.pick_sound = game.assets.key_pick_sound;
    this.drop_sound = game.assets.key_drop_sound;
};

Key.prototype = Object.create(Common.prototype);
Key.prototype.constructor = Common;

Key.prototype.open = function()
{
    if(!this.opened)
    {
        this.opened=true;
        console.log('opening! ',this.options);
        var type = this.options.type;

        var reg = new RegExp('Key(\\d+)\-(\\d+)\-(\\d+)','i');
        var result;
        if(result = type.match(reg))
        {
            console.log('call ',this.options.parent, result);
            this.options.path.openDoor(result[1], result[2], result[3]);
            this.remove();
        }
    }
};
Key.prototype.bind = function()
{
    this.walk_through_callback = this.open.bind(this);

    this.rotatingClip = this.object_geo.animations[1];
    var duration  = Math.random()*2 + 1;
    this.rotate_action = this.mixer.clipAction(this.rotatingClip, null ).setDuration(duration);
    this.rotate_action.play();
    this.rotate_action.setEffectiveWeight(1);
};

Key.prototype.dropped=function()
{
    play_multiple(game.assets.key_drop_sound);
};
