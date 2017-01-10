var Bear = function(game, options)
{
    var self=this;
    this.id=game.getNewId();

    this.friend=false;
    this.has_vision=true;
    this.mesh_geo = game.assets.bear_geo;
    this.mesh_mat = game.assets.bear_mat;
    this.die_sound = game.assets.bear_die_sound;

    this.is_hoverable=true;
    this.can_walk_through=false;
    this.has_walk_through_callback=false;
    this.is_static_collision=false;

    this.options = options;
    this.game=game;
    this.move_speed= 0.5;
    this.scale=2.0;
    this.move_action_duration = 0.40;
    this.die_action_duration = 2.0;

    this.run_speed= 1.5;
    this.run_action_duration = 0.45;

    this.check_vision_every= 80;
    this.attack_range = 10;
    this.hovered=false;
    this.is_dead=false;
    this.type='bear';

    this.weapon_type='stick';
    this.weapon_speed= 1.0;
    this.weapon_range= 20;
    this.weapon_attack_damage = 1;
    this.weapon_hit_chance = 1;

    this.weapon_defense = 0;

    this.max_life=50;
    this.life=this.max_life;

    this.is_running= false;
    this.running_timer= null;

    this.move_action_weight=0;

    this.is_moving=false;
    this.in_cells=[];
    this.vision_angle = 55;
    this.vision_distance=game.opt.door_size*2.0;
    this.ennemy_detection_distance = game.opt.door_size*2.0;
};

Bear.prototype = Object.create(Character.prototype);
Bear.prototype.constructor = Character;


