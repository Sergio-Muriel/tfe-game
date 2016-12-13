var Pinga = function(game, options)
{
    var self=this;
    this.id=game.getNewId();

    this.friend=true;
    this.has_vision=false;
    this.mesh_geo = game.assets.pinga_geo;
    this.mesh_mat = game.assets.pinga_mat;
    this.die_sound = game.assets.pinga_die_sound;

    this.is_hoverable=true;
    this.can_walk_through=false;
    this.has_walk_through_callback=false;
    this.is_static_collision=false;

    this.options = options;
    this.game=game;
    this.move_speed= 0.3;
    this.run_speed= 2.0;
    this.check_vision_every= 80;
    this.attack_range = 10;
    this.hovered=false;
    this.is_dead=false;
    this.type='pinga';

    this.weapon_type='stick';
    this.weapon_speed= 0.5;
    this.weapon_range= 20;
    this.weapon_attack_damage = 100;
    this.weapon_hit_chance = 0.5;

    this.weapon_defense = 0.1;

    this.max_life=10;
    this.life=this.max_life;

    this.is_running= false;
    this.running_timer= null;

    this.move_action_weight=0;

    this.is_moving=false;
    this.in_cells=[];
    this.vision_angle = 55;
    this.vision_distance=game.opt.door_size*1.0;
    this.ennemy_detection_distance = game.opt.door_size*2.0;
};

Pinga.prototype = Object.create(Character.prototype);
Pinga.prototype.constructor = Character;


