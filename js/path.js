var Path = function(game, options)
{
    this.options = options;
    this.path_length = game.opt.debug_level>1 ? 2 : 3;
    this.music = game.assets.path_sound;
    this.nextType='Maze';

    this.get_start_pos = function()
    {
        return { x: options.x, z: options.z};
    };

    this.update = function(delta)
    {
    };

    this.get_end_pos = function()
    {
        var angle = Math.radians(30);
        var width = this.cube_width;
        return { x: options.x + Math.cos(angle)*width, z: options.z + Math.sin(angle)*width};
    };

    this.id = game.getNewId();

    this.enter = function()
    {
        if(!this.entered)
        {
            game.fadeinmusic(this.music);

            // Create close mesh
            var close_geo = new THREE.BoxGeometry(1, game.opt.door_size*0.5,game.opt.door_size);
            this.close_material = this.wall_material;
            if(game.opt.debug_level>1)
            {
                this.close_material = new THREE.MeshPhongMaterial({color:0xff0000, wireframe:true});
            }
            this.close_mesh = new THREE.Mesh(close_geo, this.close_material);
            this.close_mesh.position.x = 10;
            this.close_mesh.position.y = 0;
            this.close_mesh.position.z = 1;
            this.close_mesh.rotation.y = Math.radians(0);
            this.container.add(this.close_mesh);

            console.log('entering path');
            this.entered=true;
            game.enterType(this);
        }
        this.buildNext();
    };
    this.leave = function()
    {
        game.fadeoutmusic(this.music);
        this.entered=false;
        console.log('leave path');
    };

    this.getStaticObstacles = function()
    {
        var meshes =  [this.top_mesh, this.bottom_mesh];
        if(this.entered)
        {
            meshes.push(this.close_mesh);
        }
        return meshes;
    };
    this.getMovingObstacles = function()
    {
        return [];
    };

    this.getCollisionCallbacks = function()
    {
        var coll = [];
        if(!this.next_item)
        {
            this.buildNext();
        }
        coll = coll.concat(this.next_item.getOutsideCollisionCallbacks());
        if(options.parent)
        {
            coll = coll.concat(options.parent.getOutsideCollisionCallbacks());
        }
        return coll;
    };
    this.getHovers = function()
    {
        return [];
    };

    this.collisionCallbacks = function(perso,collisions)
    {
        if(collisions.length===0)
        {
            return;
        }
    };

    this.build = function()
    {
        var numPoints = 100;

        var current_x = options.x;
        var current_z = options.z;

        this.container = new THREE.Object3D();

        this.cube_width  = game.opt.door_size * this.path_length;
        this.real_cube_width  = this.cube_width - game.opt.door_size;
        this.cube_height  = game.opt.door_size*0.5;


        var path_wall_texture = game.assets.path_wall_texture;
        path_wall_texture.repeat.set( this.real_cube_width/10, this.cube_height/10 );
        var path_wall_bump_texture = game.assets.path_wall_bump_texture;
        path_wall_bump_texture.repeat.set( this.real_cube_width/10, this.cube_height/10 );

        var path_floor_texture = game.assets.path_floor_texture;
        path_floor_texture.repeat.set( this.real_cube_width/10, this.cube_height/10 );
        var path_floor_bump_texture = game.assets.path_floor_bump_texture;
        path_floor_bump_texture.repeat.set( this.real_cube_width/10, this.cube_height/10 );

        var floor_material = new THREE.MeshPhongMaterial({
            bumpScale:0.5,
            map: path_floor_texture,
            bumpMap: path_floor_bump_texture
        });
        this.wall_material = new THREE.MeshPhongMaterial( { map: path_wall_texture, bumpMap: path_wall_bump_texture } );
        if(game.opt.debug_level>1)
        {
            this.wall_material = new THREE.MeshPhongMaterial({wireframe:true});
            floor_material = new THREE.MeshPhongMaterial();
        }

        var cube_geo = new THREE.BoxGeometry(this.real_cube_width, this.cube_height, 1);
        var top_geo = new THREE.BoxGeometry(this.real_cube_width, game.opt.door_size*0.5, 1);


        this.path_mesh = new THREE.Mesh(cube_geo, floor_material);
        this.path_mesh.receiveShadow=true;
        this.path_mesh.position.x = this.real_cube_width/2;

        this.top_mesh = new THREE.Mesh(top_geo, this.wall_material);
        this.top_mesh.position.z = game.opt.door_size*0.20;
        this.top_mesh.position.x = this.real_cube_width/2;
        this.top_mesh.position.y = this.cube_height/2;
        this.top_mesh.rotation.x = Math.radians(70);

        this.bottom_mesh = new THREE.Mesh(top_geo, this.wall_material);
        this.bottom_mesh.position.z = game.opt.door_size*0.20;
        this.bottom_mesh.position.x = this.real_cube_width/2;
        this.bottom_mesh.position.y = -this.cube_height*0.6;
        this.bottom_mesh.rotation.x = Math.radians(-70);

        this.angle = Math.radians(-30);
        this.container.position.x = current_x;
        this.container.position.y = 0;
        this.container.position.z = current_z;
        this.container.rotation.x = Math.radians(-90);
        this.container.rotation.z = this.angle;

        this.container.add(this.path_mesh);
        this.container.add(this.top_mesh);
        this.container.add(this.bottom_mesh);

        game.scene.add(this.container);
    };

    this.buildNext = function()
    {
        if(!this.next_item)
        {
            var pos = this.get_end_pos();
            console.log('build next' ,this.nextType);
            this.next_item = new window[this.nextType](game, {
                parent: this,
                level: options.level+1,
                x: pos.x,
                z: pos.z });
            this.next_item.build();
        }

    };
    this.unload = function()
    {
        game.scene.remove(this.container);
    };
};
