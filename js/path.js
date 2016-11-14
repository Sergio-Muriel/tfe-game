var Path = function(game, options)
{
    this.options = options;
    this.path_length = game.opt.debug_level>1 ? 2 : 3;
    this.music = game.assets.path_sound;
    this.nextType='Maze';

    this.num_items_line=2;
    this.width = 2;
    this.height = 2;
    this.id = game.getNewId();

    this.cells=[];
    this.level = {
        cells:
        [
            { x: 0, z: 0, walls: [ 2, 3, ] },
            { x: -1, z: 0, walls: [ 0, 1, 4 ,5] },
            { x: -1, z: -1, walls: [ 2,3,4,5] },
        ]
    };

    this.floor_geom_refs = {};
    this.floor_geom = new THREE.Geometry();

    this.depth = (Math.sqrt(3)/2) * game.opt.door_size*1.0;
    this.depth2 = (Math.sqrt(3)/2) * game.opt.door_size * Math.sqrt(3)/2 *1.35;
};

Path.prototype = Object.create(Maze.prototype);
Path.prototype.constructor = Path;


Path.prototype.get_start_pos = function()
{
    return { x: this.options.x, z: this.options.z};
};

Path.prototype.update = function(delta)
{
};

Path.prototype.get_end_pos = function()
{
    var angle = Math.radians(30);
    var width = this.width*game.opt.door_size;
    var height = this.height*game.opt.door_size;
    return { x: this.options.x + Math.cos(angle)*width, z: this.options.z + Math.sin(angle)*height};
};


Path.prototype.enter = function()
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
        this.entered=true;
        game.enterType(this);
    }
    this.buildNext();
};

Path.prototype.leave = function()
{
    game.fadeoutmusic(this.music);
    this.entered=false;
    console.log('leave path');
};

Path.prototype.getStaticObstacles = function()
{
    var meshes =  [];
    if(this.entered && this.close_mesh)
    {
        meshes.push(this.close_mesh);
    }
    return meshes;
};
Path.prototype.getMovingObstacles = function()
{
    return [];
};

Path.prototype.getCollisionCallbacks = function()
{
    var coll = [];
    if(!this.next_item)
    {
        this.buildNext();
    }
    coll = coll.concat(this.next_item.getOutsideCollisionCallbacks());
    if(this.options.parent)
    {
        coll = coll.concat(this.options.parent.getOutsideCollisionCallbacks());
    }
    return coll;
};
Path.prototype.getHovers = function()
{
    return [];
};

Path.prototype.collisionCallbacks = function(perso,collisions)
{
    if(collisions.length===0)
    {
        return;
    }
};

Path.prototype.add_cell = function(params)
{
    var self=this;
    var cell =this.create_cell(params);

    params.walls.forEach(function(wall)
    {
        // Top right
        mesh = new THREE.Mesh( game.assets.smallwall1_geo);
        self.set_mesh_orientation(mesh, wall);
        cell.add(mesh);
    });
};

Path.prototype.build = function()
{
    var current_x = this.options.x;
    var current_z = this.options.z;

    this.container = new THREE.Object3D();
    this.angle = Math.radians(-30);

    var self=this;
    this.level.cells.forEach(function(cell)
    {
        self.add_cell(cell);
    });


    this.container.position.x = current_x;
    this.container.position.y = 0;
    this.container.position.z = current_z;
    this.container.rotation.x = Math.radians(0);

    // Add floor
    var maze_floor_texture = game.assets.maze_floor_texture;
    maze_floor_texture.repeat.set(2,2);
    var maze_floor_bump_texture = game.assets.maze_floor_bump_texture;
    maze_floor_bump_texture.repeat.set(2,2);

    var floor_material = new THREE.MeshPhongMaterial({
        bumpScale:0.5,
        color:0xbbbbbb,
        map: maze_floor_texture,
        bumpMap: maze_floor_bump_texture
    });
    if(game.opt.debug_level>1)
    {
        floor_material = new THREE.MeshPhongMaterial({ color:0x555555, visible: true});
    }
    this.floor_geom.computeVertexNormals();
    var floor = new THREE.Mesh( this.floor_geom, floor_material);
    floor.receiveShadow=true;
    floor.castShadow=true;
    this.container.add(floor);

    game.scene.add(this.container);
};

Path.prototype.buildNext = function()
{
    if(!this.next_item)
    {
        var pos = this.get_end_pos();
        this.next_item = new window[this.nextType](game, {
            parent: this,
            level: this.options.level+1,
            x: pos.x,
            z: pos.z });
        this.next_item.build();
    }

};
Path.prototype.unload = function()
{
    this.next_item.options.parent = null;
    game.scene.remove(this.container);
};
