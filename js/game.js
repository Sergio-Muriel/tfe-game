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
        camera_decal_x = 0;
        camera_decal_y = 600;
        camera_decal_z = 50;
    }

    var current_item_id = 0;
    var clock  = new THREE.Clock();

    //var stats = new Stats();
    //stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    //document.body.appendChild( stats.dom );


    this.load = function()
    {
        var promises = [];
        this.assets = new Assets();
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
        var material = new THREE.LineBasicMaterial( { color: 0x555555, opacity:0, transparent:true  } );
        // Set and add the click_ground
        this.click_ground = new THREE.Mesh(click_ground, material);
        this.click_ground.name='click_ground';
        this.click_ground.rotation.x = -Math.PI / 2;

        this.scene.add(this.click_ground);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
        this.scene.add(this.camera);

        this.ambient_light = new THREE.PointLight(0xd9cba2, 0.15, 0, 1);
        this.ambient_light.position.set(50, 50, 80);
        this.ambient_light.castShadow=opt.enable_shadow;
        this.scene.add(this.ambient_light);

        this.perso_light = new THREE.PointLight(0xffffff, 1.5, game.opt.door_size*1.5, 1.0);
        if(game.opt.debug_level>1)
        {
            this.ambient_light.intensity=1;
        }

        this.perso_light.position.set(50, 50, 80);
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
        this.current_item = new Path(this, {level: 1, direction: this.direction, x: 0, z: 0});
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
        this.obstacles_with_player = [].concat(this.static_obstacles, this.focus_perso.container_mesh);

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
                    window.setTimeout(self.current_item.add_interraction_item.bind(self.current_item,item.type, item.params, true), delay);
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

    this.add_fadeout_text = function(params)
    {
        var text = params.text;
        var color = params.color;
        var size = params.size;
        var position = params.position;
        var delta_y = params.delta_y;

        var text_geo = new THREE.TextGeometry(text , {
            font: game.assets.text_font,
            size: size,
            height: 0,
            curveSegments: 4,
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelEnabled: false,
            material: 0,
            extrudeMaterial: 1
        });
        text_geo.computeBoundingBox();
        var text_mesh = new THREE.Mesh( text_geo, new THREE.MeshPhongMaterial({color: color}));
        text_mesh.position.x= -( text_geo.boundingBox.max.x - text_geo.boundingBox.min.x)/2 + position.x;
        text_mesh.position.y= delta_y + position.y;
        text_mesh.position.z= -( text_geo.boundingBox.max.z - text_geo.boundingBox.min.z)/2 + position.z;
        
        //text_mesh.rotation.x = -this.camera.rotation.x;
        text_mesh.rotation.x=Math.radians(-90);
        text_mesh.rotation.y = -this.camera.rotation.y;
        text_mesh.rotation.z = -this.camera.rotation.z;

        text_mesh.animation_function = this.inc_scale_fadeout.bind(this, text_mesh);
        animations.push(text_mesh);

        this.scene.add(text_mesh);
        window.setTimeout(this.remove_fadeout_text.bind(this, text_mesh), 1000);
    };

    this.inc_scale_fadeout = function(mesh)
    {
        mesh.position.y+=0.3;
        mesh.scale.x+=0.05;
        mesh.scale.y+=0.05;
        mesh.scale.z+=0.05;
        mesh.material.transparent=true;
        mesh.material.opacity-=0.05;
    };

    this.remove_fadeout_text = function(mesh)
    {
        this.scene.remove(mesh);
        var idx = animations.indexOf(mesh);
        animations.splice(idx, 1);
    }

    this.fadeinmusic = function(audios)
    {
        var self=this;
        audios.forEach(function(audio)
        {
            if(audio.paused) { audio.play(); }
            if(audio.volume<game.config.music_volume)
            {
                audio.volume=Math.min(game.config.music_volume,audio.volume+0.1);
                window.clearTimeout(self.fadeinmusic_timer);
                self.fadeinmusic_timer = window.setTimeout(self.fadeinmusic.bind(self, [audio]), 100);
            }
            else
            {
                audio.volume = game.config.music_volume;
            }
        });
    };

    this.fadeoutmusic = function(audios)
    {
        audios.forEach(function(audio)
        {
            if(audio.volume>0)
            {
                audio.volume=Math.max(0,audio.volume-0.1);
                window.clearTimeout(self.fadeoutmusic_timer);
                self.fadeoutmusic_timer = window.setTimeout(self.fadeoutmusic.bind(self, [audio]), 100);
            }
            else
            {
                console.log('audio pause!');
                audio.pause()
            }
        });
    };

    this.getRandomWeaponType = function(level)
    {
        console.log('get weapon level ',level);
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
