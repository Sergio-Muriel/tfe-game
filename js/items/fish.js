var Fish = function(game, options)
{
    this.default(options);
    this.type='Fish';

    this.deleted=false;

    this.is_hoverable=true;
    this.is_static_collision=false;
    this.can_walk_through=true;
    this.hover_color =  0x050533;

    this.scale=15;
    this.droppable = true;

    this.object_material = game.assets.fish_mat;
    this.object_geo = game.assets.fish_geo;
    this.pick_sound = game.assets.fish_pick_sound;
    this.drop_sound = game.assets.fish_drop_sound;

};

Fish.prototype = Object.create(Common.prototype);
Fish.prototype.constructor = Common;

Fish.prototype.bind = function()
{
    if(this.options.parameters.script)
    {
        this.equip_script =create_function_once(this.options.parameters.script);
    }

    this.equip_script
    //this.walk_through_callback = this.equip.bind(this, this.options.walk_through_callback);
    console.log('add ',this.options);

    this.rotatingClip = this.object_geo.animations[1];
    var duration  = Math.random()*2 + 1;
    this.rotate_action = this.mixer.clipAction(this.rotatingClip, null ).setDuration(duration);
    this.rotate_action.play();
    this.rotate_action.setEffectiveWeight(1);
};

Fish.prototype.targeted = function(from)
{
    var distance = from.container.position.distanceTo(this.container.position);
    if(distance<from.open_range)
    {
        this.equip();
    }
};

Fish.prototype.equip= function()
{
    if(this.equip_script)
    {
        this.equip_script();
    }
    if(!this.deleted)
    {
        game.focus_perso.open();
        game.gui.add_weapon('fish');
        this.remove();
    }
};
Fish.prototype.use_callback= function(from)
{
    var type = this.type.toLowerCase();
    if(!game.gui.is_available(type))
    {
        return false;
    }

    from.open();
    game.gui.remove_weapon(type);
    // Put a new fish on the floor and remove it
    var item = game.current_item.add_interraction_item(this.type,{
        level: game.level,
        mazeid: game.current_item.id,
        type: this.type,
        callback: function() { },
        rotate: Math.random()*Math.PI,
        parameters: {},
        drops: [],
        x: from.container.position.x,
        y: 1,
        z: from.container.position.z
    });
};


