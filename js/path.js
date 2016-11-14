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
        start_cell: { x: 0, z: 0 },
        end_cell:  { x: 2 , z: 2},
        cells:
        [
            { x: 0, z: 0, walls: [] },
            { x: 1, z: 0, walls: [] },
            { x: 1, z: 1, walls: [] },
        ]
    };

    this.walls_geom = new THREE.Geometry();
    this.doors_geom = new THREE.Geometry();
    this.walls_collision_geom = new THREE.Geometry();
    this.floor_geom_refs = {};
    this.floor_geom = new THREE.Geometry();

    this.depth = (Math.sqrt(3)/2) * game.opt.door_size*1.0;
    this.depth2 = (Math.sqrt(3)/2) * game.opt.door_size * Math.sqrt(3)/2 *1.35;
};

Path.prototype = Object.create(Maze.prototype);
Path.prototype.constructor = Path;


Path.prototype.get_start_pos = function()
{
    return this.get_cell_pos_params(this.level.start_cell);
};

Path.prototype.update = function(delta)
{
};

Path.prototype.get_end_pos = function()
{
    //var angle = Math.radians(30);
    //var width = this.width*game.opt.door_size;
    //var height = this.height*game.opt.door_size;

    var result = this.get_cell_pos_params(this.level.end_cell);
    console.log('result ',result);
    return result;
    //return { x: this.options.x + Math.cos(angle)*width, z: this.options.z + Math.sin(angle)*height};
};

Path.prototype.get_cell_pos_params = function(params)
{
    var coord = this.get_pos({ x: params.x, z: params.z });
    return { x: coord.x + this.options.x , z: coord.z + this.options.z, cellid: 0 };
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
    var meshes =  [ this.walls_collision ];

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
        mesh.type='wall';
        collision_mesh = new THREE.Mesh( game.assets.wall_geo);

        //cell.add(mesh);

        mesh.position.x = cell.position.x;
        mesh.position.y = cell.position.y;
        mesh.position.z = cell.position.z;

        collision_mesh.position.x = cell.position.x;
        collision_mesh.position.y = cell.position.y;
        collision_mesh.position.z = cell.position.z;

        self.set_mesh_orientation(mesh, wall);
        self.set_mesh_orientation(collision_mesh, wall);

        if(game.opt.debug_level<1)
        {
            if(mesh.type=='wall')
            {
                self.walls_geom.merge(mesh.geometry, mesh.matrix);
            }
            else
            {
                self.doors_geom.merge(mesh.geometry, mesh.matrix);
            }
        }
        self.walls_collision_geom.merge(collision_mesh.geometry, mesh.matrix);
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

    // Walls + doors
    var cell_wall_texture = game.assets.cell_wall_texture;
    cell_wall_texture.repeat.set(1,1);
    var cell_wall_bump_texture = game.assets.cell_wall_bump_texture;
    cell_wall_bump_texture.repeat.set(1,1);

    var cell_door_texture = game.assets.cell_door_texture;
    cell_door_texture.repeat.set(10,10);
    var cell_door_bump_texture = game.assets.cell_door_bump_texture;
    cell_door_bump_texture.repeat.set(10,10);

    var wall_material = new THREE.MeshPhongMaterial({
        bumpScale:0.5,
        map: cell_wall_texture,
        shininess:0,
        transparent: true,
        opacity:0.5,
        bumpMap: cell_wall_bump_texture
    });

    var door_material = new THREE.MeshPhongMaterial({
        bumpScale:0.5,
        map: cell_door_texture,
        transparent: true,
        shininess:0,
        opacity:1.0,
        bumpMap: cell_door_bump_texture
    });
    if(game.opt.debug_level>1)
    {
        wall_material = new THREE.MeshPhongMaterial({ visible: true});
        door_material = new THREE.MeshPhongMaterial({ visible: true});
    }



    var wall = new THREE.Mesh( this.walls_geom, new THREE.MultiMaterial([wall_material, door_material]));
    wall.name='walls';
    wall.receiveShadow=true;
    wall.castShadow=true;
    wall.receiveShadow=true;
    this.container.add(wall);

    var door = new THREE.Mesh( this.doors_geom, new THREE.MultiMaterial([wall_material, door_material]));
    door.name='doors';
    door.receiveShadow=true;
    door.castShadow=true;
    door.receiveShadow=true;
    this.container.add(door);

    // Walls collision
    this.walls_collision = new THREE.Mesh(
            this.walls_collision_geom,
            new THREE.MeshPhongMaterial(
                {
                    color:0x555555,
                    wireframe: false,
                    visible:game.opt.debug_level>1,
                    transparent: true,
                    opacity:0.8 
                }
            )
    );

    this.walls_collision.name='walls';
    this.container.add(this.walls_collision);

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
