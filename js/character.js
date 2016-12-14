var Character = function(game, options)
{
    var self=this;
    this.id=game.getNewId();

    this.is_hoverable=true;
    this.can_walk_through=true;
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

Character.prototype.build = function()
{
    this.patrol_id = 0;
    this.patrol_inc = 1;
    this.patrol_waiting_timer = null;

    this.patrol_right_left_inc = 3;
    this.patrol_right_left_deg = 180;

    this.next_pos = this.get_next_patrol_point();
    var path = this.options.patrol_positions || [];

    // Debug draw path
    for(var i=1; i<path.length;i++)
    {
        draw_line({
            visible: game.opt.debug_level>1,
            opacity:game.opt.debug_level>1 ? 1 : 0,
            container: game.scene,
            color: Math.random()*0xffffff,
            origin: path[i-1],
            destination: path[i]
        });
    }

    this.create();

    if(this.next_pos)
    {
        var v = new THREE.Vector3(this.next_pos.x, this.next_pos.y, this.next_pos.z);
        this.view_vector = v.sub(this.container.position);
    }
    else if(this.options.view_direction)
    {
        var v = new THREE.Vector3(this.options.view_direction.x, this.container.position.y, this.options.view_direction.z);
        this.view_vector = v.clone().sub(this.container.position);
        this.lookAt(v, v);
    }
    else if(this.options.rotate)
    {
        var orig = new THREE.Vector3(0,2,0);

        this.view_vector = new THREE.Vector3(100,2,100);
        this.view_vector.applyAxisAngle(new THREE.Vector3(0,1,0), - Math.radians(30) + this.options.rotate);

        this.view_vector.add(this.container.position);
        orig.add(this.container.position);

        this.lookAt(this.view_vector, this.view_vector);
    }
};

Character.prototype.create =function()
{
    var self=this;
    this.container = new THREE.Object3D();
    this.game.scene.add(this.container);

    // Cube simulating ennemy, for collision detection
    var cube_material = new THREE.MeshPhongMaterial( { visible:false   } );
    if(game.opt.debug_level>1)
    {
        cube_material = new THREE.MeshPhongMaterial( { color: 0xbbbbff, wireframe: true, transparent:true, opacity: 1   } );
    }
    var cube_geo = new THREE.BoxGeometry(10 , 10, 10);
    this.container_mesh = new THREE.Mesh(cube_geo, cube_material);
    this.container_mesh.name=this.type;
    this.container_mesh.position.y=1;
    this.container_mesh.id= game.getNewId();

    this.container_mesh.object = this;
    this.container.add(this.container_mesh);

    this.life_container = new THREE.Object3D();
    this.life_container.name=this.type;
    this.life_container.position.y=2;
    this.life_container.rotation.x = Math.radians(90);

    var life_geo = new THREE.RingGeometry(5, 6, 6, 1, 3, Math.PI*2);
    if(this.friend)
    {
        this.life_material =  new THREE.MeshPhongMaterial( { color: 0x33aa33, side: THREE.DoubleSide, visible: false } );
    }
    else
    {
        this.life_material =  new THREE.MeshPhongMaterial( { color: 0xaa3333, side: THREE.DoubleSide, visible: false } );
    }

    this.life_mesh = new THREE.Mesh(life_geo, this.life_material);
    this.life_container.add(this.life_mesh);
    this.container.add(this.life_container);

    this.container.position.x = this.options.x;
    this.container.position.y = 0;
    this.container.position.z = this.options.z;

    if(this.has_vision)
    {
        // Vision geometry
        this.vision_geom = new THREE.Geometry();
        var current_deg_angle = -this.vision_angle;
        var v1 = new THREE.Vector3(0, 1, 0);
        var v2 = new THREE.Vector3(-Math.cos(angle)*this.vision_distance,1,Math.sin(angle)*this.vision_distance);
        var v3 = new THREE.Vector3(Math.cos(angle)*this.vision_distance,1,Math.sin(angle)*this.vision_distance);

        this.vision_orig_vertices=[v1];
        this.vision_geom.vertices.push(v1);

        var vIndex=2;
        var vision_step = this.vision_angle/10;
        for(true; current_deg_angle<=this.vision_angle; current_deg_angle+=vision_step)
        {
            var angle = Math.radians(90+current_deg_angle);
            vLast = new THREE.Vector3(Math.cos(angle)*this.vision_distance,1,Math.sin(angle)*this.vision_distance);
            this.vision_geom.vertices.push(vLast);
            this.vision_orig_vertices.push(vLast.clone());

            if(vIndex>3)
            {
                this.vision_geom.faces.push(new THREE.Face3(0,vIndex-1,vIndex-2));
            }

            vIndex+=1;
        }
        this.vision_geom.computeFaceNormals();
        this.vision_geom.dynamic=true;
        this.vision_geom.verticesNeedUpdate=true;


        var vision_material = new THREE.MeshPhongMaterial( { color: 0xaef8a8, wireframe:false, transparent:true, opacity: 0.3, visible:false  } );
        if(game.opt.debug_level>1)
        {
            vision_material = new THREE.MeshPhongMaterial( { color: 0xaaffaa, wireframe:true, transparent:true, opacity: 1, visible:false  } );
        }
        this.vision = new THREE.Mesh( this.vision_geom, vision_material);

        this.vision.rotation.y=Math.radians(0);
        this.vision.position.x = this.options.x;
        this.vision.position.y = 0;
        this.vision.position.z = this.options.z;
        game.scene.add(this.vision);
    }

    var materials = this.mesh_mat;
    for ( var i = 0; i < materials.length; i ++ ) {
        var m = materials[ i ];
        m.skinning = true;
        m.morphTargets = true;
    }

    this.mesh = new THREE.SkinnedMesh( this.mesh_geo, new THREE.MultiMaterial(materials));
    this.mesh.scale.x=1.6;
    this.mesh.scale.y=1.6;
    this.mesh.scale.z=1.6;
    this.container.add(this.mesh);
    this.mesh.receiveShadow  = true;
    this.mesh.castShadow  = true;

    this.mesh.position.x = 0;
    this.mesh.position.y = 1;
    this.mesh.position.z = 0;

    this.mixer = new THREE.AnimationMixer( this.mesh );

    this.iddlingClip = this.mesh_geo.animations[1];
    this.walkingClip = this.mesh_geo.animations[2];
    this.attackingClip = this.mesh_geo.animations[3];
    this.dyingClip = this.mesh_geo.animations[4];

    this.move_action = this.mixer.clipAction(this.walkingClip, null ).setDuration(1.20);
    this.move_action.name='move';
    this.idle_action = this.mixer.clipAction(this.iddlingClip, null ).setDuration(5);
    this.idle_action.name='idle';

    this.attack_action = this.mixer.clipAction(this.attackingClip, null ).setDuration(this.weapon_speed);
    this.attack_action.name='attack';
    this.attack_action.setLoop(THREE.LoopOnce, 0);
    this.attack_action.clampWhenFinished = true;

    this.mixer.addEventListener('finished', this.end_attack.bind(this));

    this.dying_action = this.mixer.clipAction(this.dyingClip, null ).setDuration(1.0);
    this.dying_action.setLoop(THREE.LoopOnce, 0);
    this.dying_action.clampWhenFinished = true;

    this.move_action.play();
    this.idle_action.play();

    this.attack_action.setEffectiveWeight(0);
    this.dying_action.setEffectiveWeight(0);
    this.move_action.setEffectiveWeight(0);
    this.idle_action.setEffectiveWeight(1);

    this.walk();
};

Character.prototype.hover=function()
{
    this.hovered=true;
    this.life_material.visible=true;
};
Character.prototype.unhover=function()
{
    if(!this.is_targeted)
    {
        this.hovered=false;
        this.life_material.visible=false;
    }
};


Character.prototype.untargeted=function(from)
{
    this.is_targeted=false;
    this.unhover();
};

Character.prototype.targeted=function(from)
{
    if(!this.is_dying)
    {
        this.is_targeted=true;
        this.hover();
        var distance = from.container.position.distanceTo(this.container.position);
        if(!this.friend)
        {
            if(distance<from.weapon_range && from.attack(this))
            {
                from.attack(this);
                this.moveTo(from.container.position);
                var value = get_attack_value(from, this);
                if(value>0)
                {
                    play_multiple(game.assets[from.weapon_type+'_attack_sound']);
                    play_multiple(game.assets[this.type+'_hit_sound']);

                    game.add_damage_text({ text:value, position: this.container.position});
                    this.life= Math.max(0,this.life-value);
                    this.update_life();
                }
                else
                {
                    play_multiple(game.assets.miss_sound);
                }

                if(this.life===0)
                {
                    play_multiple(this.die_sound, 200);
                    this.die();
                }
                return true;
            }
        }
        // If it is a friend, we check if we are already following it or not
        else if(this.following)
        {
            if(distance<this.weapon_range)
            {
                console.log('stop following');
                this.lookAt(from.container.position);
                this.can_walk_through=true;
                game.updateCollisionsCache();
                this.following = null;
                this.move_destination=this.container.position;
                this.is_running=true;
            }
        }
        // Friend, not following already
        else
        {
            if(distance<this.weapon_range)
            {
                console.log('following');
                this.lookAt(from.container.position);
                this.can_walk_through=true;
                game.updateCollisionsCache();
                this.following = from;
                this.is_running=true;
                this.moveTo(from.container.position);
            }
        }
        return true;
    }
    return false;
};

Character.prototype.update_life=function()
{
    var life_value = (this.life/this.max_life) * (Math.PI*2);
    this.life_mesh.geometry.dispose();
    this.life_mesh.geometry = new THREE.RingGeometry(5, 6, 6, 1, 3, life_value)
};

Character.prototype.die=function()
{
    var self=this;
    // Already dead?
    if(this.is_dying)
    {
        return;
    }
    this.is_dying=true;

    self.move_action.setEffectiveWeight(0);
    self.idle_action.setEffectiveWeight(0);
    self.attack_action.setEffectiveWeight(0);
    self.dying_action.setEffectiveWeight(1);

    self.dying_action.stop();
    self.dying_action.play();

    window.setTimeout(game.drop.bind(game,{drops:self.options.drops, x: self.container.position.x, y:0, z:self.container.position.z}),300);
    window.setTimeout(function()
    {
        self.is_hoverable=false;
        self.is_dead=true;
        game.updateCollisionsCache();
    }, 1000);

    window.setTimeout(this.remove.bind(this), 5000);
};
Character.prototype.remove = function(destination)
{
    this.options.parentStructure.remove_interraction_item(this);
    game.scene.remove(this.container);
    game.scene.remove(this.vision);
    game.updateCollisionsCache();
};

Character.prototype.run = function(destination)
{
    window.clearTimeout(this.patrol_waiting_timer);
    window.clearTimeout(this.running_timer);
    this.patrol_waiting_timer=null;
    this.running_timer=null;

    this.move_destination = destination;
    this.moveTo(this.move_destination);
    if(!this.is_running)
    {
        this.is_running=true;
        this.move_action.setDuration(0.45);
    }
    this.running_timer = window.setTimeout(this.walk.bind(this), 2000);
};

Character.prototype.walk = function()
{
    window.clearTimeout(this.running_timer);
    window.clearTimeout(this.patrol_waiting_timer);
    this.patrol_waiting_timer=null;
    this.running_timer=null;

    if(this.is_running)
    {
        this.is_running=false;
        if(this.move_destination)
        {
            this.moveTo(this.move_destination);
            this.move_action.setDuration(0.8);
        }
    }
};


Character.prototype.lookAt= function(pos,view_pos)
{
    if(pos)
    {
        pos.y=0;
        this.container.lookAt(pos);
    }
    if(this.has_vision)
    {
        this.vision_destination = new THREE.Vector3(view_pos.x, view_pos.y, view_pos.z);
        this.vision.lookAt(view_pos);
    }
}


Character.prototype.moveTo= function(pos)
{
    var current_pos = this.container.position;
    if(current_pos.equals(pos))
    {
        return;
    }
    var v = new THREE.Vector3(pos.x, pos.y, pos.z);
    this.view_vector = v.sub(this.container.position);

    var rad_ang = Math.radians(this.patrol_right_left_deg);
    var distance = game.opt.door_size;
    this.lookAt(pos, {
        x: this.container.position.x + this.view_vector.x*distance/4 + Math.cos(rad_ang) * distance,
        y: this.container.position.y + this.view_vector.y*distance/4,
        z: this.container.position.z +  this.view_vector.z*distance/4 + Math.sin(rad_ang) * distance
    });

    // Last part of moving
    this.is_moving=true;

    var distance = Math.sqrt(Math.pow(pos.x-current_pos.x,2)+Math.pow(pos.z-current_pos.z,2));
    var directionX = (pos.x-current_pos.x) / distance;
    var directionZ = (pos.z-current_pos.z) / distance;

    var speed = this.is_running ? this.run_speed : this.move_speed;
    move_step_x = speed * directionX;
    move_step_z = speed * directionZ;

    this.move_step_vector_x = new THREE.Vector2();
    this.move_step_vector_z = new THREE.Vector2();
    this.move_step_vector_x.x = move_step_x;
    this.move_step_vector_x.z=0;
    this.move_step_vector_z.x=0;
    this.move_step_vector_z.z = move_step_z;

    // Actually moving...
    this.move_destination = pos;
    if(this.move_action_weight!=1)
    {
        this.move_weight_destination = 1;
    }
};

Character.prototype.move_step= function()
{
    // Patrol right/left
    if(!this.is_running)
    {
        this.patrol_right_left_deg+=this.patrol_right_left_inc;
        this.patrol_right_left_deg = this.patrol_right_left_deg%360;
        
        var rad_ang = Math.radians(this.patrol_right_left_deg);
        var distance = game.opt.door_size;

        this.lookAt(null,{
            x: this.container.position.x + this.view_vector.x*distance/4 + Math.cos(rad_ang) * distance,
            y: this.container.position.y + this.view_vector.y*distance/4,
            z: this.container.position.z +  this.view_vector.z*distance/4 + Math.sin(rad_ang) * distance
        });
    }
    if(this.is_moving)
    {
        var moving=0;


        // Distance to player
        var distanceToPlayer = this.container.position.distanceTo(game.focus_perso.container.position);

        if(this.container.position.x!=this.move_destination.x || this.container.position.z!=this.move_destination.z)
        {
            moving++;
        }

        if(distanceToPlayer>this.attack_range || !this.is_running)
        {
            if(this.has_vision)
            {
                // Moving X restrictions
                if(Math.abs(this.container.position.x - this.move_destination.x) > 1)
                {
                    this.vision.position.add(this.move_step_vector_x);
                }
                else
                {
                    this.vision.position.x = this.move_destination.x;
                }
                if(Math.abs(this.container.position.z - this.move_destination.z) > 1)
                {
                    this.vision.position.add(this.move_step_vector_z);
                }
                else
                {
                    this.vision.position.z = this.move_destination.z;
                }
            }
            // Moving X restrictions
            if(Math.abs(this.container.position.x - this.move_destination.x) > 1)
            {
                this.container.position.add(this.move_step_vector_x);
            }
            else
            {
                this.container.position.x = this.move_destination.x;
            }
            if(Math.abs(this.container.position.z - this.move_destination.z) > 1)
            {
                this.container.position.add(this.move_step_vector_z);
            }
            else
            {
                this.container.position.z = this.move_destination.z;
            }
        }
        else if(!this.friend && !game.focus_perso.is_dying)
        {
            this.attack(game.focus_perso);
        }

        if(!moving)
        {
            this.move_weight_destination = 0;
            this.is_moving=false;
            this.move_destination=null;
        }

    }
    else
    {
        this.patrol_right_left_deg+=this.patrol_right_left_inc;
        this.patrol_right_left_deg = this.patrol_right_left_deg%360;

        var rad_ang = Math.radians(this.patrol_right_left_deg);
        var distance = game.opt.door_size;
    }
};

Character.prototype.attack = function(target, reload)
{
    if(!this.attacking || reload)
    {
        if(reload)
        {
            this.attack_action.reset();
        }
        else
        {
            this.attack_action.stop();
            this.attack_action.play();
        }
        this.attacking=true;
        this.attack_target = target;
        target.attacked(this);

        this.move_action.setEffectiveWeight(0);
        this.idle_action.setEffectiveWeight(0);
        this.attack_action.setEffectiveWeight(1);

    }
};

Character.prototype.end_attack = function(x)
{
    if(!this.is_dying)
    {
        if(this.attack_target.is_dying)
        {
            this.attacking=false;
            this.move_weight_destination=1;
            this.attack_action.setEffectiveWeight(0);
            this.idle_action.setEffectiveWeight(1);
        }
        else
        {
             var distance = this.container.position.distanceTo(this.attack_target.container.position);
             if(distance<this.weapon_range)
             {
                 // TODO: Strange behavior here: have to delay the call to avoid multiple end_attack callbacks
                 window.setTimeout(this.attack.bind(this,this.attack_target, true), 10);
             }
             else
             {
                this.attacking=false;
                this.move_weight_destination=1;
                this.attack_action.setEffectiveWeight(0);
                this.idle_action.setEffectiveWeight(1);
            }
        }
    }
};

Character.prototype.update_vision = function()
{
    this.check_vision_loop=1;
    if(!this.check_vision_timer)
    {
        this.check_vision();
    }
};
Character.prototype.check_vision = function()
{
    if(!this.check_vision_loop)
    {
        this.vision.material.visible=false;
        return;
    }

    // Collision callbacks
    var originPoint = this.container.position;
    var obstacles_with_player = game.getObstaclesWithPlayer();
    var static_obstacles = game.getStaticObstacles();

    var collisions=[];

    // Trace 1 raycast to check if it is visible to the user (no cone)
    var localVertex = game.focus_perso.container.position.clone();
    var globalVertex = localVertex.sub(originPoint);

    var ray = new THREE.Raycaster( originPoint, globalVertex.clone().normalize(),0, this.ennemy_detection_distance);
    var collisionResults = ray.intersectObjects(obstacles_with_player);

    var is_near=false;
    if (collisionResults.length > 0)
    {
        is_near=collisionResults.filter(function(x) { return x.object.name=='p';}).length>0;

        // It is visible to the user. Now let's check if the user is looking at it
        if(collisionResults[0].object.name=='p')
        {
            if(collisionResults[0].distance < this.vision_distance && this.vision_destination)
            {
                var angle = find_angle(game.focus_perso.container.position,this.container.position, this.vision_destination);
                angle = angle*180/Math.PI;
                if(angle<this.vision_angle)
                {
                    collisions.push(collisionResults[0].point);
                }
            }
        }
    }
    if(collisions.length>0)
    {
        this.run(game.focus_perso.container.position.clone());
    }

    this.vision.material.visible=is_near;
    // Update vision mesh if needed
    if(is_near)
    {
        for (var vertexIndex = 1; vertexIndex < this.vision.geometry.vertices.length; vertexIndex++)
        {
            var localVertex = this.vision.geometry.vertices[vertexIndex].clone();
            var globalVertex = localVertex.applyMatrix4( this.vision.matrix );
            var directionVector = globalVertex.sub( this.vision.position );

            var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize(),0, this.vision_distance);
            var collisionResults = ray.intersectObjects(static_obstacles);

            this.vision.geometry.vertices[vertexIndex].x = this.vision_orig_vertices[vertexIndex].x;
            this.vision.geometry.vertices[vertexIndex].y = this.vision_orig_vertices[vertexIndex].y;
            this.vision.geometry.vertices[vertexIndex].z = this.vision_orig_vertices[vertexIndex].z;
            this.vision.geometry.verticesNeedUpdate=true;

            if ( collisionResults.length > 0 && collisionResults[0].distance < this.vision_distance)
            {
                // Display limited vision vertice 
                if(collisionResults[0].object.name=='walls')
                {
                    var distance = collisionResults[0].distance;
                    this.vision.geometry.vertices[vertexIndex].x *= distance / this.vision_distance;
                    this.vision.geometry.vertices[vertexIndex].y *= distance / this.vision_distance;
                    this.vision.geometry.vertices[vertexIndex].z *= distance / this.vision_distance;
                }
            }
        }
    }

    if(this.has_vision)
    {
        // Loop check vision
        this.check_vision_loop=0;
        this.check_vision_timer= window.setTimeout(this.check_vision_end.bind(this), this.check_vision_every);
    }
};

Character.prototype.check_vision_end  = function()
{
    this.check_vision_timer=null;
    this.check_vision();
};

Character.prototype.move_weight  = function()
{
    if(this.move_weight_destination!==null)
    {
        var c = this.move_action.getEffectiveWeight();
        var dest;
        if(c>this.move_weight_destination)
        {
            var dest = Math.max(0,c-0.3);

            this.move_action.setEffectiveWeight(dest);
            this.idle_action.setEffectiveWeight(1-dest);
            this.move_action_weight=dest;
        }
        else if(c<this.move_weight_destination)
        {
            var dest = Math.min(1,c+0.3);
            this.move_action.setEffectiveWeight(dest);
            this.idle_action.setEffectiveWeight(1-dest);
            this.move_action_weight=dest;
        }
        else
        {
            this.move_weight_destination=null;
        }
        this.move_action_weight=c;
    }
};

Character.prototype.update= function(delta)
{
    var self=this;
    if(this.is_dead)
    {
        return false;
    }

    this.mixer.update(delta);
    this.delta=delta;
    if(this.hovered)
    {
        this.life_container.rotation.z += 0.03;
    }
    if(!this.move_destination && this.options.patrol_positions && this.options.patrol_positions.length>0)
    {
        if(!this.patrol_waiting_timer)
        {
            var pos = this.next_pos;
            if(pos)
            {
                this.patrol_waiting_timer=window.setTimeout(function()
                {
                    self.patrol_waiting_timer=null;
                    self.move_weight_destination=1;
                    self.moveTo(pos);
                    self.next_pos = self.get_next_patrol_point();
                }, this.patrol_wait);
            }
        }
    }
    else if(this.following)
    {
        //console.log('new follow pos',this.following.container.position);
        self.moveTo(this.following.container.position);
    }

    if(!this.is_dying)
    {
        if(!this.attacking)
        {
            this.move_step();
            this.move_weight();
        }
        if(this.has_vision)
        {
            this.update_vision();
        }
    }
};

Character.prototype.get_next_patrol_point = function()
{
    if(!this.options.patrol_positions || this.options.patrol_positions.length<2)
    {
        return null;
    }

    var next_id = this.patrol_id+this.patrol_inc;
    var next_inc = this.patrol_inc;
    this.patrol_id+= next_inc

    this.patrol_wait = 0;
    if(next_id<0)
    {
        next_inc=1;
        next_id=1;
        if(!this.options.patrol_loop)
        {
            this.patrol_wait =this.options.patrol_wait;
        }
    } 
    if(next_id>=this.options.patrol_positions.length)
    {
        if(this.options.patrol_loop)
        {
            next_id=0;
        }
        else
        {
            next_id=this.options.patrol_positions.length-2;
            next_inc=-1;
            this.patrol_wait =this.options.patrol_wait;
        }
    }
    this.patrol_id=next_id;
    this.patrol_inc=next_inc;
    return this.options.patrol_positions[next_id];
};

