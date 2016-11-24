var Path = function(game, options)
{
    var self=this;

    this.options = options;

    this.path_length = game.opt.debug_level>1 ? 2 : 3;

    this.music = game.assets.path_sound;
    this.ambient = game.assets.blizzard_sound;
    this.floor_material = game.assets.path_floor_material;

    this.ambient_light_color = 0xffffff;
    this.ambient_light_intensity = 0.20;

    this.nextType='Maze';

    this.num_items_line=2;
    this.width = 2;
    this.height = 2;
    this.id = game.getNewId();
    this.generated_doors = {};

    this.cells=[];
};

Path.prototype = Object.create(Maze.prototype);
Path.prototype.constructor = Path;


Path.prototype.get_start_pos = function()
{
    console.log('get start pos');
    return this.get_cell_pos_params({x: this.level.end_cell.x, z:this.level.end_cell.z});
};

Path.prototype.update = function(delta)
{
    game.focus_perso.update_temperature(delta*500);
};

Path.prototype.get_end_pos = function()
{
    var next_door = this.get_coord_next_door(this.level.end_cell.x, this.level.end_cell.z, 1); 
    return this.get_cell_pos_params({x: next_door[0], z:next_door[1] });
};

Path.prototype.get_cell_pos_params = function(params)
{
    var coord = this.get_pos({ x: params.x, z: params.z });
    return { x: coord.x + this.options.x , z: coord.z + this.options.z, cellid: 0 };
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

    params.collision_doors.forEach(function(door)
    {
        collision_mesh = new THREE.Mesh( game.assets.door_geo);
        collision_mesh.position.x = cell.position.x;
        collision_mesh.position.y = cell.position.y;
        collision_mesh.position.z = cell.position.z;
        self.set_mesh_orientation(collision_mesh, door);
        self.walls_collision_geom.merge(collision_mesh.geometry, collision_mesh.matrix);
    });
};

Path.prototype.levels =[
{
    outside_cells:
    [
        { x: 0, z: 0},
    ],
    extracells:
    [
    ],
    end_cell:  { x: 0 , z: 0},
},
{
    outside_cells:
    [
        { x: 0, z: 0},
        { x: 0, z: 1},
        { x: 1, z: 0},
        { x: 1, z: 1},
        { x: 2, z: 1},
        { x: 2, z: 2},
        { x: 3, z: 0},
        { x: 3, z: 1},
        { x: 3, z: 2},
    ],
    extracells:
    [
    ],
    end_cell:  { x: 3 , z: 2},
}
];

Path.prototype.build = function()
{
    var self=this;
    this.level = this.levels[this.options.level-1];
    this.options.level++;

    if(this.options.parent)
    {
        this.level.start_cell= { x: 0 , z: 0};
    }

    var connected_end = this.get_coord_next_door(this.level.end_cell.x, this.level.end_cell.z, 4);

    // Auto add walls on outside cells
    this.level.outside_cells.forEach(function(cell)
    {
        cell.walls = [];
        cell.collision_doors = [];
        
        for(var i=0; i<6; i++)
        {
            var nearcell = self.get_coord_next_door(cell.x, cell.z, i);
            var search = self.level.outside_cells.filter(function(item) { return item.x == nearcell[0] && item.z == nearcell[1]; });

            var is_start = self.level.start_cell ? (cell.x == self.level.start_cell.x && cell.z == self.level.start_cell.z && i===4) : false;
            var is_end = cell.x == self.level.end_cell.x && cell.z == self.level.end_cell.z && i===1;

            if(is_end)
            {
                console.log('is end ',is_end, cell);
                cell.collision_doors.push(1);
            }
            else if(!search.length && !is_start)
            {
                cell.walls.push(self.get_opposide_door(nearcell[2]));
            }
        }
    });

    this.walls_geom = new THREE.Geometry();
    this.doors_geom = new THREE.Geometry();
    this.walls_collision_geom = new THREE.Geometry();
    this.floor_geom_refs = {};
    this.floor_geom = new THREE.Geometry();

    this.depth = (Math.sqrt(3)/2) * game.opt.door_size*1.0;
    this.depth2 = (Math.sqrt(3)/2) * game.opt.door_size * Math.sqrt(3)/2 *1.35;
    var self=this;
    var current_x = this.options.x;
    var current_z = this.options.z;

    this.container = new THREE.Object3D();
    this.angle = Math.radians(-30);

    this.level.outside_cells.forEach(function(cell)
    {
        self.add_cell(cell);
    });

    // Set start and end door/cell
    this.start_i = 4;
    this.start_door=null;
    if(this.level.start_cell)
    {
        this.start_door = this.generated_doors[this.level.start_cell.x][this.level.start_cell.z];
    }


    this.container.position.x = current_x;
    this.container.position.y = 0;
    this.container.position.z = current_z;
    this.container.rotation.x = Math.radians(0);

    this.floor_geom.computeVertexNormals();
    var floor = new THREE.Mesh( this.floor_geom, game.assets.path_floor_material);
    floor.receiveShadow=true;
    floor.castShadow=true;
    this.container.add(floor);


    var wall = new THREE.Mesh( this.walls_geom, game.assets.multi_path_wall_material);
    wall.name='walls';
    wall.receiveShadow=true;
    wall.castShadow=true;
    wall.receiveShadow=true;
    this.container.add(wall);

    var door = new THREE.Mesh( this.doors_geom, game.assets.multi_path_wall_material);
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

Path.prototype.play_step = function()
{
    game.assets.step_snow_sound.play();
};
Path.prototype.stop_step = function()
{
    game.assets.step_snow_sound.pause();
};

Path.prototype.unload = function()
{
    this.next_item.options.parent = null;
    game.scene.remove(this.container);
};
