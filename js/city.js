var City = function(game, options)
{
    this.city_length = 2;
    this.music = game.assets.city_sound;
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
            console.log('entering city');
            game.enterType(this);
        }
        this.buildNext();
    };
    this.leave = function()
    {
        game.fadeoutmusic(this.music);
        this.entered=false;
        console.log('leave city');
    };

    this.getStaticObstacles = function()
    {
        return [this.top_mesh, this.bottom_mesh];
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

        this.cube_width  = game.opt.door_size * this.city_length;
        this.real_cube_width  = this.cube_width - game.opt.door_size;
        this.cube_height  = game.opt.door_size*0.5;


        if(game.opt.debug_level>1)
        {
            wall_material = new THREE.MeshPhongMaterial();
            floor_material = new THREE.MeshPhongMaterial();
        }

        var cube_geo = new THREE.BoxGeometry(this.real_cube_width,
                this.cube_height, 1);
        var top_geo = new THREE.BoxGeometry(this.real_cube_width, game.opt.door_size*0.5, 1);


        this.path_mesh = new THREE.Mesh(cube_geo, floor_material);
        this.path_mesh.receiveShadow=true;
        this.path_mesh.position.x = this.real_cube_width/2;

        this.top_mesh = new THREE.Mesh(top_geo, wall_material);
        this.top_mesh.position.z = game.opt.door_size*0.20;
        this.top_mesh.position.x = this.real_cube_width/2;
        this.top_mesh.position.y = this.cube_height/2;
        this.top_mesh.rotation.x = Math.radians(70);

        this.bottom_mesh = new THREE.Mesh(top_geo, wall_material);
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
};
