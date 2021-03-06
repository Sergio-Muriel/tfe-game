var Perso = function(game, options)
{
    var self=this;
    self.id=game.getNewId();
    self.friend=true;
    self.visible_from_ennemy=true;
    self.type='perso';
    self.followers=[];
    self.following_idx=1;

    self.vision_distance = game.opt.door_size*3;

    self.walk_speed= game.opt.debug_level > 1 ? 0.50 : 0.50;
    self.run_speed= game.opt.debug_level > 1 ? 35 : 35;
    self.move_speed= self.run_speed;

    self.open_range = 12;

    self.weapon_speed=1.0;
    self.weapon_range = 15;
    self.weapon_attack_damage = 0;
    self.weapon_hit_chance = 0;
    self.weapon_defense = 0;

    self.weapon_type = 'stick';

    self.previous_weight_destination=[];


    self.is_dying=false;
    self.is_dead=false;
    self.is_running=true;

    self.max_life=game.opt.debug_level>1 ? 10000 : 1;
    self.life=self.max_life;

    self.is_attacking=false;
    self.is_opening=false;
    self.is_moving=false;

    var original_material_emissive=[];
    var hover_material_emissive=[];

    this.build = function()
    {
        this.game = game;
        this.options=options;

        this.bind();
        this.create();
        this.update_life();

        this.move_bind = this.move.bind(this);
        this.mouseup_bind = this.mouseup.bind(this);
        this.mousedown_bind = this.mousedown.bind(this);

        if(options.moveable)
        {
            this.moveable();
        }
    };

    this.bind = function()
    {
        this.life_value = document.querySelector('.life_value');
    };

    this.create =function()
    {
        var self=this;
        this.container = new THREE.Object3D();
        this.game.scene.add(this.container);

        // Cube simulating perso, for collision detection
        var cube_material = new THREE.MeshPhongMaterial( { color: 0xbbbbff, wireframe:true, visible: game.opt.debug_level>1   } );
        var cube_geo = new THREE.BoxGeometry(6,6,6);
        this.container_mesh = new THREE.Mesh(cube_geo, cube_material);
        this.container_mesh.rotation.x = Math.radians(90);
        this.container_mesh.rotation.z = Math.radians(45);
        this.container_mesh.position.y=1;
        this.container_mesh.name='p';
        this.container_mesh.object = this;
        this.container.add(this.container_mesh);

        this.container.position.x = this.options.x;
        this.container.position.y = 0;
        this.container.position.z = this.options.z;

		var materials = game.assets.perso_mat;
		for ( var i = 0; i < materials.length; i ++ ) {
			var m = materials[ i ];
			m.skinning = true;
			m.morphTargets = true;
		}
        // Clone material to be able to change the texture
        var materials=[];
		game.assets.perso_mat.forEach(function(mat){
            materials.push(mat.clone());
        });
		for ( var i = 0; i < materials.length; i ++ ) {
			var m = materials[ i ];
            original_material_emissive[i] = m.emissive;
            hover_material_emissive[i] = new THREE.Color(m.emissive).add(new THREE.Color(0x331111));
			m.skinning = true;
			m.morphTargets = true;
		}

        this.mesh = new THREE.SkinnedMesh( game.assets.perso_geo, new THREE.MultiMaterial(materials));
        this.weapon_bone = search_bone_name('Weapon',this.mesh.children.concat());

        this.mesh.castShadow=true;
        this.mesh.scale.x=15;
        this.mesh.scale.y=15;
        this.mesh.scale.z=15;
        this.container.add(this.mesh);
        this.mesh.receiveShadow  = true;

        this.mesh.position.x = 0;
        this.mesh.position.y = 1;
        this.mesh.position.z = 0;

        this.mixer = new THREE.AnimationMixer( this.mesh );
        this.mixer.addEventListener('finished', this.end_attack.bind(this));

        this.attackingClip = game.assets.perso_geo.animations[3];
        this.walkingClip = game.assets.perso_geo.animations[2];
        this.iddlingClip = game.assets.perso_geo.animations[1];
        this.dyingClip = game.assets.perso_geo.animations[4];
        this.openingClip = game.assets.perso_geo.animations[5];

        this.attack_action = this.mixer.clipAction(this.attackingClip, null ).setDuration(this.weapon_speed);
        this.attack_action.setLoop(THREE.LoopOnce, 0);
        this.attack_action.clampWhenFinished = true;

        this.open_action = this.mixer.clipAction(this.openingClip, null ).setDuration(0.8);
        this.open_action.setLoop(THREE.LoopOnce, 0);
        this.open_action.clampWhenFinished = true;

        this.dying_action = this.mixer.clipAction(this.dyingClip, null ).setDuration(0.7);
        this.dying_action.setLoop(THREE.LoopOnce, 0);
        this.dying_action.clampWhenFinished = true;

        this.move_action = this.mixer.clipAction(this.walkingClip, null ).setDuration(0.45);
        this.idle_action = this.mixer.clipAction(this.iddlingClip, null ).setDuration(5);

        this.move_action.play();
        this.idle_action.play();
        this.attack_action.setEffectiveWeight(0);
        this.move_action.setEffectiveWeight(0);
        this.idle_action.setEffectiveWeight(1);

    };

    this.use_item = function(type)
    {
        if(this.weapon_type===type)
        {
            return false;
        }

        var className = type.substr(0,1).toUpperCase()+type.substr(1).toLowerCase(); 
        var item  = new window[className](game, {});
        if(item.use_callback)
        {
            item.use_callback(this);
            return false;
        }
        if(!item.equipable)
        {
            return false;
        }
        play_multiple(game.assets.weapon_switch_sound);

        this.weapon_type = type;
        this.weapon_speed=item.weapon_speed;
        this.weapon_range = item.weapon_range;
        this.weapon_attack_damage = item.weapon_attack_damage;
        this.weapon_hit_chance = item.weapon_hit_chance;
        this.weapon_defense = item.weapon_defense;

        this.attack_action = this.mixer.clipAction(this.attackingClip, null ).setDuration(this.weapon_speed);

        if(this.weapon_mesh)
        {
            this.weapon_bone.remove(this.weapon_mesh);
            this.weapon_mesh=null;
        }
        if(game.assets[type+'_geo'])
        {
            var materials=[];
            game.assets[type+'_mat'].forEach(function(mat){
                materials.push(mat.clone());
            });

            var weapon  = new THREE.SkinnedMesh( game.assets[type+'_geo'], new THREE.MultiMaterial(materials));
            weapon.rotation.y = Math.radians(90);
            weapon.position.x=0;
            weapon.position.y=0;
            weapon.position.z=0;
            weapon.scale.x=1;
            weapon.scale.y=1;
            weapon.scale.z=1;
            this.weapon_bone.add(weapon);

            this.weapon_mesh = weapon;
        }
        return true;
    };

    this.targeted=function(from)
    {
        if(!this.is_dying)
        {
            var value = get_attack_value(from, this);

            this.mesh.material.materials.forEach(function(material, i)
            {
                material.emissive = hover_material_emissive[i];
            });
            window.clearTimeout(this.untargeted_timer),
            this.untargeted_timer = window.setTimeout(this.untargeted.bind(this), 100);

            if(value>0)
            {
                this.life= Math.max(0,this.life-value);
                game.add_damage_text({ text:value, position: this.container.position});
                this.update_life();
            }
            else
            {
                play_multiple(game.assets.miss_sound);
            }

        }
    };
    this.untargeted = function()
    {
        this.mesh.material.materials.forEach(function(material, i)
        {
            material.emissive = original_material_emissive[i];
        });
    };

    this.increase_life_value = function(value)
    {
        game.add_damage_text({ text:value, color:game.config.text_heal_color, size: game.config.text_heal_size, delta_y : 15,position: this.container.position});
        this.life= Math.min(this.max_life,this.life+value);
        this.update_life();
    };

    this.update_life = function()
    {
        this.life_value.innerText = this.life;
        if(this.life===0)
        {
            this.die();
        }
    };

    this.attack=function(target)
    {
        if(!this.is_attacking)
        {
            this.is_moving=false;
            this.is_attacking=true;
            this.set_weight_destination([0,0,1,0]);
            this.attack_action.stop();
            this.attack_action.play();

            // Effective life lost
            var value = get_attack_value(this, target);

            play_multiple_random(game.assets[this.weapon_type+'_attack_sound'], game.config.play_attack_sound_random);
            if(value>0)
            {
                play_multiple(game.assets[target.type+'_hit_sound']);

                game.add_damage_text({ text:value, position: target.container.position});
                target.life= Math.max(0,target.life-value);
                target.update_life();
                if(target.life===0)
                {
                    target.die();
                }
            }
            else
            {
                play_multiple(game.assets.miss_sound);
            }
            return true;
        }
        return false;
    };

    this.open=function()
    {
        if(!this.is_opening)
        {
            this.is_moving=false;
            this.is_opening=true;
            this.set_weight_destination([0,0,0,1]);
            this.open_action.stop();
            this.open_action.play();
        }
    };

    this.gameover = function()
    {
        var self=this;
        game.zoomLevel({ level: 10,angle: 180,distance: 10,time: 2.5,callback: function()
        {
            game.gui.open_menu();
        }});

        window.setTimeout(function()
        {
            self.is_dead=true;
            game.updateCollisionsCache();
        }, 700);
    };

    this.die = function()
    {
        var self=this;
        // Already dead?
        if(this.is_dying)
        {
            return;
        }
        play_multiple(game.assets.perso_die_sound);
        this.is_dying=true;

        self.move_action.setEffectiveWeight(0);
        self.idle_action.setEffectiveWeight(0);
        self.attack_action.setEffectiveWeight(0);
        self.dying_action.setEffectiveWeight(1);

        self.dying_action.stop();
        self.dying_action.play();

        this.gameover();
    };

    this.end_attack=function()
    {
        if(!this.is_dying)
        {
            this.is_attacking=false;
            this.is_opening=false;
            this.set_weight_destination([1,0,0,0]);
            //this.update_weight(true);
        }
    };

    this.mouseEvent= function(event, moving_mouse)
    {
        // No action if dead
        if(this.is_dying || this.is_dead) { return false; }

        if(this.click_target && this.mouse_clicked)
        {
            this.mouse_clicked=false;
            if(this.click_target.targeted(this))
            {
                this.click_target=null;
                game.current_item.stop_step();
                this.updateMovingStatus(null);
                return false;
            }
            else
            {
                //this.click_target=null;
            }
        }

        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        mouse.x = ( event.clientX / this.game.renderer.domElement.width ) * 2 - 1;
        mouse.y = - ( event.clientY / this.game.renderer.domElement.height ) * 2 + 1;

        raycaster.setFromCamera( mouse, this.game.camera );

        var objects;
        if(!this.mouse_clicked)
        {
            objects = game.getHovers();
        }
        else
        {
            objects = game.getHoversWithClickGround();
        }

        var intersects = raycaster.intersectObjects(objects);
        if ( intersects.length > 0 ) {
                if(intersects[0].object.object)
                {
                    if(this.mouse_clicked && !moving_mouse)
                    {
                        this.click_target = intersects[0].object.object;
                    }
                    if(this.last_hover_id!== intersects[0].object.id)
                    {
                        if(this.last_hover_object)
                        {
                            this.last_hover_object.unhover();
                            this.last_hover_object=null;
                        }
                        intersects[0].object.object.hover();
                        this.last_hover_object = intersects[0].object.object;
                        this.last_hover_id = this.last_hover_object.id;
                    }
                }
                else
                {
                    this.last_hover_id = '';
                    if(this.last_hover_object)
                    {
                        this.last_hover_object.unhover();
                        this.last_hover_object=null;
                    }
                }

                if(this.mouse_clicked)
                {
                    this.move_collision = intersects[0];
                    return intersects[0].point;
                }
        }
        else
        {
            this.last_hover_id = '';
            if(this.last_hover_object)
            {
                this.last_hover_object.unhover();
                this.last_hover_object=null;
            }
        }
        return null;
    }


    this.lookAt= function(pos)
    {
        if(!this.is_opening)
        {
            pos.y=0;
            this.container.lookAt(pos);
        }
    }

    this.mouseMoveCallback= function(event)
    {
        var pos = this.mouseEvent(event, true);
        if(this.click_target)
        {
            this.lookAt(this.click_target.container.position);
            this.moveTo(this.click_target.container.position);
        }
        else if(pos && this.mouse_clicked)
        {
            this.lookAt(pos);
            this.moveTo(pos);
        }
    }
    this.mouseDownCallback= function(event)
    {
        var pos = this.mouseEvent(event,false);
        if(this.click_target)
        {
            this.lookAt(this.click_target.container.position);
            this.moveTo(this.click_target.container.position);
        }
        else if(pos)
        {
            this.lookAt(pos);
            this.moveTo(pos);
        }
    }

    this.updateMovingStatus = function(destination)
    {
        if(this.is_attacking || this.is_opening)
        {
            return false;
        }
        this.is_moving=!!destination;
        var weight = destination ? 1 : 0;

        // Actually moving...
        this.set_weight_destination([this.is_moving ? 0 : 1, this.is_moving? 1 : 0, 0, 0]);
        this.move_destination = destination;
    };
    this.set_weight_destination = function(destinations)
    {
        var self=this;
        var update=false;
        destinations.forEach(function(destination, i)
        {
            if(destination!== self.previous_weight_destination[i])
            {
                update=true;
            }
        });
        if(update)
        {
            this.move_weight_destination=destinations;
            this.previous_weight_destination=this.move_weight_destination.concat()
        }
    }

    this.moveTo= function(pos)
    {
        // Check if there is something between us and the destination
        var originPoint = this.container.position;

        var localVertex = pos.clone();
        var globalVertex = localVertex.sub(originPoint);

        var collision=false;

        var current_pos = this.container.position;
        if(current_pos.equals(pos))
        {
            return;
        }
        this.move_vector = pos.clone().sub(this.container.position).normalize();

        this.move_vector_alt1 = this.move_vector.clone().applyAxisAngle(new THREE.Vector3(0,1,0), Math.radians(70));
        this.move_vector_alt2 = this.move_vector.clone().applyAxisAngle(new THREE.Vector3(0,1,0), Math.radians(-70));

        this.move_vector.multiplyScalar(this.move_speed);
        this.move_vector_alt1.multiplyScalar(this.move_speed);
        this.move_vector_alt2.multiplyScalar(this.move_speed);

        this.updateMovingStatus(pos);


    };

    this.move_step= function(delta)
    {
        if(this.click_target)
        {
            if(this.click_target.targeted(this))
            {
                this.click_target=null;
                game.current_item.stop_step();
                this.updateMovingStatus(null);
                return false;
            }
        }
        if(this.mouse_clicked)
        {
            this.mouseMoveCallback(this.last_mouse_event);
        }
        if(this.is_moving)
        {
            game.current_item.play_step();

            var moving=0;

            // Collision callbacks (keys / etc)
            var originPoint = this.container.position;
            var all_obstacles = game.getMovingAndStaticObstacles();
            var obstacles_with_callbacks = game.getCollisionCallbacks();

            var objects=[];
            for (var vertexIndex = 0; vertexIndex < this.container_mesh.geometry.vertices.length; vertexIndex++)
            {
                var localVertex = this.container_mesh.geometry.vertices[vertexIndex].clone();
                var globalVertex = localVertex.applyMatrix4( this.container_mesh.matrix );
                var directionVector = globalVertex.sub( this.container_mesh.position );

                var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize(),0 , game.opt.door_size );
                var collisionResults = ray.intersectObjects(obstacles_with_callbacks);
                collisionResults.forEach(function(collision)
                {
                    if (collision.distance < directionVector.length() ) 
                    {
                        objects.push(collision.object);
                    }
                });
            }
            game.callCollisionCallbacks(this,objects);

            // Moving if far enough
            var distance= this.container.position.clone().sub(this.move_destination).length();
            if(Math.abs(distance) > 2)
            {
                var originPoint = this.container.position.clone();
                var move_vector = this.move_vector.clone().multiplyScalar(delta);
                originPoint.add(move_vector);
                var new_distance= originPoint.clone().sub(this.move_destination).length();
                if(new_distance<distance)
                {
                    var collision=false;

                    // Check collision with items that are moving and static ones
                    for (var vertexIndex = 0; vertexIndex < this.container_mesh.geometry.vertices.length; vertexIndex++)
                    {
                        var localVertex = this.container_mesh.geometry.vertices[vertexIndex].clone();
                        var globalVertex = localVertex.applyMatrix4( this.container_mesh.matrix );
                        var directionVector = globalVertex.sub( this.container_mesh.position );

                        var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize(),0 , game.opt.door_size );
                        var collisionResults = ray.intersectObjects(all_obstacles);
                        if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
                        {
                            collision=true;
                        }
                    }
                    if(collision)
                    {
                        var originPoint = this.container.position.clone();
                        var move_vector_alt1 = this.move_vector_alt1.clone().multiplyScalar(delta);
                        originPoint.add(move_vector_alt1);
                        var distance_alt1= originPoint.clone().sub(this.move_destination).length();
                        if(distance_alt1<distance)
                        {
                            var collision_alt1= false;

                            // Check collision with items that are moving and static ones
                            for (var vertexIndex = 0; vertexIndex < this.container_mesh.geometry.vertices.length; vertexIndex++)
                            {
                                var localVertex = this.container_mesh.geometry.vertices[vertexIndex].clone();
                                var globalVertex = localVertex.applyMatrix4( this.container_mesh.matrix );
                                var directionVector = globalVertex.sub( this.container_mesh.position );

                                var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize(),0 , game.opt.door_size );
                                var collisionResults = ray.intersectObjects(all_obstacles);
                                if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
                                {
                                    collision_alt1=true;
                                }
                            }
                            if(!collision_alt1)
                            {
                                moving++;
                                this.container.position.add(move_vector_alt1);
                            }
                        }

                        var collision_alt2=false;
                        var originPoint = this.container.position.clone();
                        var move_vector_alt2 = this.move_vector_alt2.clone().multiplyScalar(delta);
                        originPoint.add(move_vector_alt2);
                        var distance_alt2= originPoint.clone().sub(this.move_destination).length();
                        if(distance_alt2<distance)
                        {
                            // Check collision with items that are moving and static ones
                            for (var vertexIndex = 0; vertexIndex < this.container_mesh.geometry.vertices.length; vertexIndex++)
                            {
                                var localVertex = this.container_mesh.geometry.vertices[vertexIndex].clone();
                                var globalVertex = localVertex.applyMatrix4( this.container_mesh.matrix );
                                var directionVector = globalVertex.sub( this.container_mesh.position );

                                var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize(),0 , game.opt.door_size );
                                var collisionResults = ray.intersectObjects(all_obstacles);
                                if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
                                {
                                    collision_alt2=true;
                                }
                            }
                            if(!collision_alt2)
                            {
                                moving++;
                                this.container.position.add(move_vector_alt2);
                            }
                        }
                    }
                    if(!collision)
                    {
                        moving++;
                        this.container.position.add(move_vector);
                    }
                }
            }


            if(!moving)
            {
                game.current_item.stop_step();
                this.updateMovingStatus(null);
            }
        }
    };

    this.update_weight  = function(force)
    {

        if(this.move_weight_destination)
        {
            var s1= this.update_weight_value(this.idle_action, this.move_weight_destination[0]);
            var s2= this.update_weight_value(this.move_action, this.move_weight_destination[1]);
            var s3= this.update_weight_value(this.attack_action, this.move_weight_destination[2]);
            var s4= this.update_weight_value(this.open_action, this.move_weight_destination[3]);
            if(s1 && s2 && s3 && s4)
            {
                this.move_weight_destination=null;
            }
        }
    };
    this.update_weight_value = function(action, to)
    {
        var current = action.getEffectiveWeight();
        if(current<to)
        {
            action.setEffectiveWeight(Math.min(to,current+0.3));
            return false;
        }
        else if(current>to)
        {
            action.setEffectiveWeight(Math.max(to,current-0.3));
            return false;
        }
        else
        {
            return true;
        }
    };

    this.moveable = function()
    {
        var self=this;
        this.mouse_clicked=false;

        // Moveable perso has a light
        document.addEventListener( 'mousemove', this.move_bind);
        document.addEventListener( 'mouseup', this.mouseup_bind);
        document.addEventListener( 'mousedown', this.mousedown_bind);
    };
    this.notmoveable = function()
    {
        // Moveable perso has a light
        document.removeEventListener( 'mousemove', this.move_bind);
        document.removeEventListener( 'mouseup', this.mouseup_bind);
        document.removeEventListener( 'mousedown', this.mousedown_bind);
    }

    this.move = function(e) {
        this.last_mouse_event=e;
        self.mouseMoveCallback(e);
    };
    this.mouseup = function(e) {
        this.last_mouse_event=e;
        self.mouse_clicked=false;
        e.stopPropagation();
        return false;
    };
    this.mousedown = function(e) {
        if(this.click_target)
        {
            this.click_target.untargeted();
            this.click_target=null;
        }
        this.last_mouse_event=e;
        self.mouse_clicked=true;
        e.stopPropagation();
        self.mouseDownCallback(e);
        return false;
    };

    this.walk = function()
    {
        this.is_running=false;
        this.move_speed = this.walk_speed;
    };
    this.run = function()
    {
        this.is_running=true;
        this.move_speed = this.run_speed;
    };

    this.loose_life = function()
    {
        this.life= Math.max(0, this.life-1);
        this.update_life();
    };


    this.update = function(delta)
    {
        this.mixer.update(delta);

        if(!this.is_dying && !this.is_attacking && !this.is_opening)
        {
            this.move_step(delta);
        }
        this.update_weight();
    };
    this.add_follower = function(target)
    {
        this.followers.push(target);
        target.start_follow(this, this.followers.indexOf(target)+1);
    };
    this.remove_follower = function(target)
    {
        var self=this;
        game.clear_interval(this.following_timer);
        this.destination_positions = [];
        target.stop_follow(true);

        var idx = this.followers.indexOf(target);
        this.followers.splice(idx, 1);
        var idx=1;
        this.followers.forEach(function(follower)
        {
            follower.start_follow(self, idx);
            idx++;
        });
    };
    this.rescue = function()
    {
        var self=this;
        this.followers.forEach(function(follower)
        {
            self.remove_follower(follower);

            // Create follow fake item to destination
            var obj = new THREE.Object3D();
            obj.position.x = self.container.position.x
            obj.position.y = self.container.position.y
            obj.position.z = self.container.position.z;

            follower.start_follow({container: obj}, 1);
            follower.end_move_callback = follower.rescued.bind(follower);
        });
    };
    this.build();
};

