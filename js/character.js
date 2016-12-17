var Character = function(game, options)
{
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
    if(this.custom)
    {
        this.custom();
    }

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
    this.attack_target = game.focus_perso;
    this.following_idx=1;
    this.followers = [];

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
    this.helpClip = this.mesh_geo.animations[5];

    this.idle_action = this.mixer.clipAction(this.iddlingClip, null ).setDuration(5);
    this.idle_action.name='idle';

    this.move_action = this.mixer.clipAction(this.walkingClip, null ).setDuration(this.move_action_duration);
    this.move_action.name='move';


    this.attack_action = this.mixer.clipAction(this.attackingClip, null ).setDuration(this.weapon_speed);
    this.attack_action.name='attack';
    this.attack_action.setLoop(THREE.LoopOnce, 0);
    this.attack_action.clampWhenFinished = true;

    this.mixer.addEventListener('finished', this.end_attack.bind(this));

    this.dying_action = this.mixer.clipAction(this.dyingClip, null ).setDuration(1.0);
    this.dying_action.setLoop(THREE.LoopOnce, 0);
    this.dying_action.clampWhenFinished = true;

    this.help_action = this.mixer.clipAction(this.helpClip, null ).setDuration(5);
    this.help_action.name='idle';

    this.move_action.play();
    this.idle_action.play();
    if(this.friend)
    {
        this.help_action.play();
    }

    this.attack_action.setEffectiveWeight(0);
    this.dying_action.setEffectiveWeight(0);
    this.move_action.setEffectiveWeight(0);
    this.idle_action.setEffectiveWeight(1);
    this.help_action.setEffectiveWeight(0);

    this.walk();
};

Character.prototype.hover=function()
{
    this.is_hovered=true;
    this.life_material.visible=true;
};
Character.prototype.unhover=function()
{
    this.is_hovered=false;
    this.life_material.visible=false;
};


Character.prototype.untargeted=function(from)
{
    if(this.is_targeted)
    {
        this.is_targeted=false;
        this.unhover();
    }
};

Character.prototype.targeted=function(from)
{
    var self=this;
    if(!this.is_dying && !this.is_targeted)
    {
        this.hover();
        var distance = from.container.position.distanceTo(this.container.position);
        if(this.friend != from.friend)
        {
            if(distance<from.weapon_range && from.attack(this))
            {
                this.moveTo(from.container.position);
                return false;
            }
        }

        // Frien stopping following
        else if(this.following)
        {
            if(distance<from.open_range)
            {
                this.is_targeted=true;
                from.remove_follower(this);
                this.move_destination=this.container.position;
                window.pinga= this;
                this.is_running=true;
                from.open();
                game.add_friend_text({ text:game.labels.get('dont move'), position: from.container.position});
                window.setTimeout(self.untargeted.bind(self), 500);
                return true;
            }
        }
        // Friend start following
        else
        {
            if(distance<from.open_range)
            {
                this.is_targeted=true;
                self.lookAt(from.container.position);
                from.add_follower(this);
                self.is_running=true;
                self.moveTo(from.container.position);
                game.add_friend_text({ text:game.labels.get('follow me'), position: from.container.position});
                from.open();

                window.setTimeout(self.untargeted.bind(self), 500);
                return true;
            }
        }
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
    game.updateCollisionsCache();
    play_multiple(game.assets[this.type+'_die_sound'], 200);

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
        this.move_action.setDuration(this.run_action_duration);
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
            this.move_action.setDuration(this.move_action_duration);
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

    this.move_step_vector = pos.clone();
    this.move_step_vector.sub(this.container.position).normalize();

    var speed = this.is_running ? this.run_speed : this.move_speed;
    this.move_step_vector.multiplyScalar(speed);


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
        var distanceToTarget = 999;
        if(this.attack_target)
        {
           distanceToTarget = this.container.position.distanceTo(this.attack_target.container.position);
        }

        if(this.container.position.x!=this.move_destination.x || this.container.position.z!=this.move_destination.z)
        {
            moving++;
        }

        if(distanceToTarget<this.attack_range)
        {
            moving=0;
        }
        if(distanceToTarget>this.attack_range*this.following_idx || !this.is_running)
        {
            if(this.has_vision)
            {
                // Moving
                if(Math.abs(this.container.position.x - this.move_destination.x) > 1 || Math.abs(this.container.position.z - this.move_destination.z) > 1)
                {
                    this.vision.position.add(this.move_step_vector);
                }
                else
                {
                    this.vision.position = this.move_destination;
                }
            }
            // Moving X restrictions
            if(Math.abs(this.container.position.x - this.move_destination.x) > 1 || Math.abs(this.container.position.z - this.move_destination.z) > 1)
            {
                this.container.position.add(this.move_step_vector);
            }
            else
            {
                this.container.position = this.move_destination;
                moving=false;
            }
        }
        else if(!this.friend && !this.attack_target.is_dying)
        {
            this.attack(this.attack_target);
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
        target.targeted(this);

        this.move_action.setEffectiveWeight(0);
        this.idle_action.setEffectiveWeight(0);
        this.attack_action.setEffectiveWeight(1);

        // Effective life lost
        var value = get_attack_value(this, target);
        if(value>0)
        {
            play_multiple(game.assets[this.weapon_type+'_attack_sound']);
            play_multiple(game.assets[target.type+'_hit_sound']);

            game.add_damage_text({ text:value, position: target.container.position});
            target.life= Math.max(0,target.life-value);
            target.update_life();
        }
        else
        {
            play_multiple(game.assets.miss_sound);
        }

        if(target.life===0)
        {
            target.die();
        }
        return true;
    }
    return false;
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
    var self=this;
    if(!this.check_vision_loop)
    {
        this.vision.material.visible=false;
        return;
    }

    // Collision callbacks
    var originPoint = this.container.position;
    var obstacles_with_player = game.getObstaclesWithPlayer();
    var static_obstacles = game.getStaticObstacles();

    var collision_distance = 999;
    var collision_object = null;

    var is_near= game.focus_perso.container.position.distanceTo(this.container.position) < game.focus_perso.vision_distance;

    this.friends = game.getFriends();
    this.friends.forEach(function(friend)
    {
        // Trace 1 raycast to check if it is visible to the user (no cone)
        var localVertex = friend.object.container.position.clone();
        var globalVertex = localVertex.sub(originPoint);

        var ray = new THREE.Raycaster( originPoint, globalVertex.clone().normalize(),0);
        var collisionResults = ray.intersectObjects(obstacles_with_player);

        if (collisionResults.length > 0)
        {
            // It is visible to the user by distance, let's check if the user is looking at it
            if(collisionResults[0].object.object && collisionResults[0].object.object.friend)
            {
                if(collisionResults[0].distance < self.vision_distance)
                {
                    var angle = find_angle(collisionResults[0].object.object.container.position,self.container.position, self.vision_destination);
                    angle = angle*180/Math.PI;
                    if(angle<self.vision_angle)
                    {
                        if(collisionResults[0].distance < collision_distance)
                        {
                            collision_object = collisionResults[0].object.object;
                            collision_distance = collisionResults[0].distance;
                        }
                    }
                }
            }
        }
        if(collision_object)
        {
            self.set_target(collision_object);
        }
    });

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

Character.prototype.set_target  = function(obj)
{
    this.attack_target = obj;
    this.run(obj.container.position.clone());
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
    if(this.is_hovered)
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
    var r = this.options.patrol_positions[next_id];
    return new THREE.Vector3(r.x, r.y, r.z);
};

Character.prototype.add_follower = function(target)
{
    this.followers.push(target);
    target.following_idx = this.followers.indexOf(target)+1;
    target.following= this;
    console.log('idx  = ',target.following_idx);
};
Character.prototype.remove_follower = function(target)
{
    target.following=null;
    var idx = this.followers.indexOf(target);
    this.followers.splice(idx, 1);
    var idx=1;
    this.followers.forEach(function(follower)
    {
        follower.following_idx=idx;
        idx++;
    });
};

