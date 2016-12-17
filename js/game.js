var Game = function(opt)
{
    var scene;
    var lock;
    var SCREEN_HEIGHT;
    var SCREEN_HEIGHT;
    var camera;
    var renderer;
    var mazes= {};

    var animations = [];

    var camera_decal_x = 10;
    var camera_decal_y = 200;
    var camera_decal_z = 100;

    var drop_delay_multiple=50;
    if(opt.debug_level>1)
    {
        camera_decal_x = 5;
        camera_decal_y = 70;
        camera_decal_z = 30;
    }

    var current_item_id = 0;
    var clock  = new THREE.Clock();

    //var stats = new Stats();
    //stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    //document.body.appendChild( stats.dom );

    this.level=opt.level;

    this.load = function()
    {
        var promises = [];
        this.assets = new Assets(opt);
        return  this.assets.load();
    };

    this.init = function()
    {
        var self=this;
        this.load().then(function()
        {
            self.init_loaded();
        }, function(e)
        {
            console.error('error loading ',e);
            alert('Error loading some assets...');
        });
    };

    this.init_loaded= function()
    {
        var self=this;
        this.opt = opt;

        this.static_obstacles = [];
        this.moving_obstacles = [];
        this.moving_and_static_obstacles = [];
        this.obstacles_with_player = [];
        this.collision_callbacks = [];
        this.scene = new THREE.Scene();


        // Build basic structures
        var width = 10000;
        var height = 10000;
        var click_ground = new THREE.PlaneGeometry(width, height);


        // Set and add the click_ground
        this.click_ground = new THREE.Mesh(click_ground, game.assets.outside_floor_material);
        this.click_ground.name='click_ground';
        this.click_ground.rotation.x = -Math.PI / 2;
        this.click_ground.position.y=-1;

        this.scene.add(this.click_ground);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
        this.scene.add(this.camera);

        this.ambient_light = new THREE.PointLight(0xd9cba2, 0.15, 0, 1);
        this.ambient_light.position.set(50, 150, 80);
        this.ambient_light.castShadow=opt.enable_shadow;
        this.scene.add(this.ambient_light);

        this.perso_light = new THREE.PointLight(0xffffff, 1.0, game.opt.door_size*3.3, 1.0);
        if(game.opt.debug_level>1)
        {
            this.ambient_light.intensity=1;
        }

        this.perso_light.position.set(50, 150, 80);
        this.perso_light.castShadow=false;
        this.scene.add(this.perso_light);



        //this.scene.fog = new THREE.FogExp2( 0x333355, 0.0055 );


        this.renderer = new THREE.WebGLRenderer({ antialias: true});
        this.renderer.setClearColor(opt.debug_level>1 ? 0x000000 : 0x000000, 1);
        this.renderer.shadowMapEnabled=opt.enable_shadow;
        this.renderer.shadowMapSoft=opt.enable_shadow;
        this.renderer.shadowMapType = THREE.PCFSoftShadowMap;


        window.addEventListener( 'resize', onWindowResize, false );
        function onWindowResize(){
            self.camera.aspect = window.innerWidth / window.innerHeight;
            self.camera.updateProjectionMatrix();

            self.renderer.setSize( window.innerWidth, window.innerHeight );
        }
        this.container = opt.root;

        this.setAspect();
        this.container.appendChild(this.renderer.domElement);

        this.start();
        this.gui.init();
        this.render();

        this.updateCollisionsCache();
    };

    this.setAspect= function()
    {
        var w = this.container.offsetWidth;
        // Fit the initial visible area's height
        h = this.container.offsetHeight;
        // Update the renderer and the camera
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    };

    this.setFocus = function(object)
    {
        this.ambient_light.position.set(100+object.position.x, 200, 80+object.position.z);
        this.perso_light.position.set(object.position.x, 50, object.position.z);

        this.camera.position.x = object.position.x + camera_decal_x;
        this.camera.position.y = object.position.y + camera_decal_y;
        this.camera.position.z = object.position.z + camera_decal_z;

        this.camera.lookAt(object.position);
    };

    this.start = function()
    {
        var self=this;

        this.direction=0;

        this.focus_perso = self.add_character({
            x: 10,
            y: 0,
            z: 10,
            moveable: true,
            ai: false,
            game: self
        });
        this.focus_perso.name='main character';

        // Create start 
        this.current_item = new Path(this, { direction: this.direction, x: 0, z: 0});
        this.current_item.build();

        var pos = this.current_item.get_start_pos();
        var angle = Math.radians(30);
        pos.x += Math.cos(angle) * 20;
        pos.z += Math.sin(angle) * 20;


        this.current_item.enter();

        // Look at player
        this.resetCamera();
    };

    this.add_character= function(params)
    {
        return new Perso(this, params);
    },
    this.add_key= function(params)
    {
        return new Key(this, params);
    },

    this.reload = function()
    {
        this.current_item.reload();
        var pos = this.current_item.get_start_pos();
        game.focus_perso.reload(pos);
    },

    // Camera refresh animation
    this.update = function(delta)
    {
        if(this.zoomOut)
        {
        }
        else if(this.zoominDestination)
        {
            this.zoominAngle-= 0.01;
            this.current_radius = Math.min(this.current_radius+1, game.opt.door_size);

            this.current_camera_decal_x *=0.96;
            this.current_camera_decal_y *=0.96;
            this.current_camera_decal_z *=0.96;

            this.camera.position.x =
                    game.focus_perso.container.position.x + 
                    this.current_camera_decal_x +
                    this.current_radius * Math.cos( this.zoominAngle);

            this.camera.position.y *= 0.99;

            this.camera.position.z =
                    game.focus_perso.container.position.z + 
                    this.current_camera_decal_z +
                    this.current_radius * Math.sin( this.zoominAngle);

            this.camera.lookAt(game.focus_perso.container.position);

            if(this.camera.position.y<this.zoominDestination)
            {
                this.zoomOutDestination=0;
                this.zoominCallback();
                this.zoominDestination=null;
            }
        }
        else
        {
            this.setFocus(this.focus_perso.container);
        }
    },

    this.render = function()
    {
        //stats.begin();
        this.renderer.render(this.scene, this.camera);

        if(!this.updating)
        {
            this.updating=1;
            var delta = clock.getDelta();
            if(delta>0.070 && game.opt.debug_level>10)
            {
                console.warn('SLOW RENDERING DELTA: ',delta);
                delta=0.070;
            }
			//delta=0.030;

            this.update(delta);

            animations.forEach(function(anim)
            {
                anim.animation_function();
            });

            this.focus_perso.update(delta);
            this.current_item.update(delta);
            this.updating=0;
        }
	    requestAnimationFrame(this.render_fct);
        //stats.end();
    };

    this.render_fct = this.render.bind(this);

    this.getStaticObstacles = function()
    {
        return this.static_obstacles;
    };
    this.getMovingObstacles = function()
    {
        return this.moving_obstacles;
    };
    this.getMovingAndStaticObstacles = function()
    {
        return this.moving_and_static_obstacles;
    };
    this.getHovers = function()
    {
        return this.hovers;
    };
    this.getHoversWithClickGround = function()
    {
        return this.hovers_with_ground;
    };
    this.getObstaclesWithPlayer = function()
    {
        return this.obstacles_with_player;
    };
    this.getFriends = function()
    {
        return this.friends;
    };
    this.getCollisionCallbacks = function()
    {
        return this.collision_callbacks;
    }

    this.generateCollisionCallbacks = function()
    {
       return this.current_item.getCollisionCallbacks();
    };

    this.callCollisionCallbacks = function(perso,collisions)
    {
        collisions.forEach(function (obj)
        {
            obj.walk_through_callback();
        });
    };


    this.updateCollisionsCache = function()
    {
        this.hovers=this.current_item.getHovers();
        this.static_obstacles = this.current_item.getStaticObstacles();
        this.moving_obstacles = this.current_item.getMovingObstacles();
        this.friends = [].concat(this.current_item.getFriends(), this.focus_perso.container_mesh);
        this.obstacles_with_player = [].concat(this.static_obstacles, this.friends);

        this.moving_and_static_obstacles = [].concat(this.static_obstacles).concat(this.moving_obstacles);
        this.hovers_with_ground= this.hovers.concat([this.click_ground]);
        this.collision_callbacks = this.generateCollisionCallbacks();
    };

    this.getNewId = function()
    {
        return 'item_'+(++current_item_id);
    };

    this.zoomInCircle = function(callback)
    {
        this.zoominAngle = 0;
        this.zoominDestination=50;
        this.zoominCallback=callback;

        this.current_radius = 0;
        this.current_camera_decal_x = camera_decal_x;
        this.current_camera_decal_y = camera_decal_y;
        this.current_camera_decal_z = camera_decal_z;
    };

    this.resetCamera = function()
    {
        this.camera.position.x = game.focus_perso.container.position.x + camera_decal_x;
        this.camera.position.y = game.focus_perso.container.position.y + camera_decal_y;
        this.camera.position.z = game.focus_perso.container.position.z + camera_decal_z;

        this.camera.lookAt(game.focus_perso.container.position);
    }

    this.enterType = function(item)
    {
        if(this.current_item.id!==item.id)
        {
            if(parent_item = item.options.parent)
            {
                if(p_parent_item = parent_item.options.parent)
                {
                    parent_item.options.parent=null;
                    p_parent_item.unload();
                }
            }
            this.current_item.leave();
            this.current_item=item;
            this.current_item.enter();
            this.updateCollisionsCache();
        }
    };

    this.drop = function(params)
    {
        if(!params.drops || params.drops.length===0)
        {
            return false;
        }
        var self=this;
        var items = params.drops;
        var delay=0;
        var distance=0;
        var distance_step= opt.door_size*0.1;

        var start_pos = new THREE.Vector3(params.x, params.y, params.z);
        var obstacles = this.getObstaclesWithPlayer();

        items.forEach(function(item)
        {
            var collisionResults=[1];
            while(collisionResults.length>0)
            {
                item.params.x = params.x + Math.cos(distance)*distance_step;
                item.params.y = params.y;
                item.params.z = params.z + Math.sin(distance)*distance_step;

                var new_pos = new THREE.Vector3(item.params.x, item.params.y, item.params.z);
                var direction = new_pos.clone().sub(start_pos);

                var ray = new THREE.Raycaster( start_pos, direction.normalize(),0, new_pos.clone().distanceTo(start_pos));
                var collisionResults = ray.intersectObjects(obstacles);

                if(collisionResults.length===0)
                {
                    var type = item.type.substr(0,1).toUpperCase()+item.type.substr(1).toLowerCase();
                    window.setTimeout(self.current_item.add_interraction_item.bind(self.current_item,type , item.params, true), delay);
                }
                distance+=Math.radians(20+Math.floor(Math.random()*180));
                if(distance>Math.radians(360))
                {
                    distance_step += opt.door_size*0.04;
                    distance= distance%Math.radians(360);
                }
            }
            delay+=drop_delay_multiple;
        });
    }

    this.get_attack_value = function(attack_object, defense_object)
    {
        var damage=0;
        var is_hit = Math.random() < attack_object.weapon_hit_chance;
        if(is_hit)
        {
            var quota = Math.random()*0.5+0.5;
            quota -=  defense_object.weapon_defense;
            damage = Math.ceil(quota*attack_object.weapon_attack_damage);
        }
        return Math.max(0,damage);
    };

    this.add_damage_text = function(params)
    {
        params.fadeout = true;
        params.anim_callback = this.inc_scale_fadeout.bind(this, { move_y: 0.10, scale:  0, opacity: 0.02});
        params.bevelSize= 0.01;

        params.delta_y=15;
        params.size= game.config.text_hit_size;
        params.color= game.config.text_hit_color;
        params.anim_time = 1000;

        return this.add_fadeout_text(params);
    };

    this.add_friend_text = function(params)
    {
        params.fadeout = true;
        params.anim_callback = this.inc_scale_fadeout.bind(this, { move_y: 0.10, scale:  0, opacity: 0.01});
        params.bevelSize= 0;

        params.delta_y=15;
        params.size= game.config.text_friend_size;
        params.color= game.config.text_friend_color;
        params.anim_time = 1000;

        return this.add_fadeout_text(params);
    };

    this.add_fadeout_text = function(params)
    {
        var text = params.text;
        var color = params.color;
        var size = params.size;
        var position = params.position;
        var delta_y = params.delta_y;

        var text_container = new THREE.Object3D();

        var text_geo = new THREE.TextGeometry(text , {
            font: game.assets.text_font,
            size: size,
            height: 0,
            curveSegments: 1,
            bevelThickness: 1,
            bevelSize: params.bevelSize || 0.1,
            bevelEnabled: true,
            material: 0,
            extrudeMaterial: 1
        });
        text_geo.computeBoundingBox();
        var text_mesh = new THREE.Mesh( text_geo, params.material || new THREE.MeshPhongMaterial({color: color}));
        text_mesh.position.x= -( text_geo.boundingBox.max.x - text_geo.boundingBox.min.x)/2;
        text_mesh.position.y= -( text_geo.boundingBox.max.y - text_geo.boundingBox.min.y)/2;
        text_mesh.position.z= -( text_geo.boundingBox.max.z - text_geo.boundingBox.min.z)/2;
        
        text_mesh.rotation.x = Math.radians(-45);
        text_mesh.rotation.y = 0;
        text_mesh.rotation.z = Math.radians(0);

        text_container.position.x = position.x;
        text_container.position.y = position.y + delta_y;
        text_container.position.z = position.z;

        text_container.rotation.y = Math.radians(3);

        if(params.anim_callback)
        {
            text_container.animation_function = params.anim_callback.bind(undefined, text_container, text_mesh);
            animations.push(text_container);
            window.setTimeout(this.remove_animation.bind(this, text_container), params.anim_time);
        }
        text_container.add(text_mesh);
        this.scene.add(text_container);
        return text_container;
    };

    this.inc_scale_fadeout = function(params, container, mesh)
    {
        if(params.move_y)
        {
            container.position.y+=params.move_y;
        }
        if(params.scale)
        {
            container.scale.x+=params.scale;
            container.scale.y+=params.scale;
            container.scale.z+=params.scale;
        }
        if(params.opacity)
        {
            mesh.material.transparent=true;
            mesh.material.opacity-=params.opacity;
        }
    };

    this.remove_animation = function(mesh)
    {
        this.scene.remove(mesh);
        var idx = animations.indexOf(mesh);
        animations.splice(idx, 1);
    }

    this.fadeinmusic = function(audio, target, looping)
    {
        if(audio.paused) { audio.play(); }

        if(!looping)
        {
            audio.volume=0;
        }
        if(audio.volume<target)
        {
            audio.volume=Math.min(target,audio.volume+0.004);
            this.fadeinmusic_timer = window.setTimeout(this.fadeinmusic.bind(this, audio,target, true), 10);
        }
        else
        {
            audio.volume = target;
        }
    };

    this.fadeoutmusic = function(audio)
    {
        if(audio.volume>0)
        {
            audio.volume=Math.max(0,audio.volume-0.004);
            this.fadeoutmusic_timer = window.setTimeout(this.fadeoutmusic.bind(this, audio), 10);
        }
        else
        {
            audio.pause()
        }
    };

    this.getRandomWeaponType = function(level)
    {
        var weapons=[];
        if(level>3)
        {
            weapons.push('Hammer');
        }
        if(level>0)
        {
            weapons.push('Stick');
        }
        return weapons[Math.floor(Math.random()*weapons.length)];
    };

};
