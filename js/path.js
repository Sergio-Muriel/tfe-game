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

    this.interraction_items=[];
    this.all_interraction_items=[];

    this.cells=[];
};

Path.prototype = Object.create(Maze.prototype);
Path.prototype.constructor = Path;


Path.prototype.get_start_pos = function()
{
    return this.get_cell_pos_params({x: 0, z:0});
};

Path.prototype.update = function(delta)
{
    this.interraction_items.forEach(function(item)
    {
        item.update(delta);
    });
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
    this.interraction_items.forEach(function(item)
    {
        if(item.has_walk_through_callback)
        {
            coll.push(item.container_mesh);
        }
    });
    return coll;
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
        var mesh=null;
        var collision_mesh=null;
        switch(wall.type+'')
        {
            // Small wall
            case '1':
                mesh = new THREE.Mesh( game.assets.smallwall1_geo);
                mesh.type='smallwall';
                collision_mesh = new THREE.Mesh( game.assets.wall_geo);
                break;
            // Full wall
            case '2':
                mesh = new THREE.Mesh( game.assets.wall1_geo);
                mesh.type='wall';
                collision_mesh = new THREE.Mesh( game.assets.wall_geo);
                break;
            // Opened
            case '3':
                mesh = new THREE.Mesh( game.assets.door1_geo);
                mesh.type='opened';
                collision_mesh = new THREE.Mesh( game.assets.door_geo);
                break;

            // Door:
            // @TODO
            case '4':
                mesh = new THREE.Mesh( game.assets.door1_geo);
                mesh.type='door';
                collision_mesh = new THREE.Mesh( game.assets.door_geo);
                break;
        }

        //cell.add(mesh);

        mesh.position.x = cell.position.x;
        mesh.position.y = cell.position.y;
        mesh.position.z = cell.position.z;

        collision_mesh.position.x = cell.position.x;
        collision_mesh.position.y = cell.position.y;
        collision_mesh.position.z = cell.position.z;

        console.log('mesh = ',mesh, wall); 
        self.set_mesh_orientation(mesh, wall.i);
        self.set_mesh_orientation(collision_mesh, wall.i);

        if(game.opt.debug_level<1)
        {
            self.smallwalls_geom.merge(mesh.geometry, mesh.matrix);
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

Path.prototype.build = function()
{
    var self=this;
    this.level = Levels[game.level-1] || Levels[0];
    console.log('level = ',this.level);

    if(this.options.parent)
    {
        this.level.start_cell= { x: 0 , z: 0};
    }

    var connected_end = this.get_coord_next_door(this.level.end_cell.x, this.level.end_cell.z, 4);

    // Auto add walls on outside cells
    this.level.cells.forEach(function(cell)
    {
        
        cell.collision_doors = [];

        for(var i=0; i<6; i++)
        {
            var nearcell = self.get_coord_next_door(cell.x, cell.z, i);

            // Check if not already put
            has_neighbor = self.level.cells.filter(function(item) { return item.x == nearcell[0] && item.z == nearcell[1]; }).length>0;
            has_already_wall = cell.walls.filter(function(wall) { return wall.i === i ; }).length>0;


            var is_start = self.level.start_cell ? (cell.x == self.level.start_cell.x && cell.z == self.level.start_cell.z && i===4) : false;
            var is_end = cell.x == self.level.end_cell.x && cell.z == self.level.end_cell.z && i===1;

            if(is_end)
            {
                cell.collision_doors.push(1);
            }
            else if(!has_neighbor && !has_already_wall && !is_start)
            {
                cell.walls.push({ type: '1', i: self.get_opposide_door(nearcell[2])});
            }
        }
    });

    this.walls_geom = new THREE.Geometry();
    this.smallwalls_geom = new THREE.Geometry();
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

    this.level.cells.forEach(function(cell)
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


    // Small walls
    var smallwall = new THREE.Mesh( this.smallwalls_geom, game.assets.multi_path_wall_material);
    smallwall.name='smallwalls';
    smallwall.receiveShadow=true;
    smallwall.castShadow=true;
    smallwall.receiveShadow=true;
    this.container.add(smallwall);

    // Opened
    var opened = new THREE.Mesh( this.wall1_geo, game.assets.multi_path_wall_material);
    opened.name='opened';
    opened.receiveShadow=true;
    opened.castShadow=true;
    opened.receiveShadow=true;
    this.container.add(opened);

    // Walls
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

    this.add_ennemys();

    game.scene.add(this.container);
};

Path.prototype.add_ennemys = function()
{
    var self=this;
    console.log('this level ',this.level);
    if(this.level.ennemys)
    {
        this.level.ennemys.forEach(function(ennemy)
        {
            var coord = self.get_cell_pos_params({ x: ennemy.x, z: ennemy.z });

            var view_x = coord.x + Math.cos(Math.radians(ennemy.rotation + 90)) * game.opt.door_size;
            var view_z = coord.z + Math.sin(Math.radians(ennemy.rotation + 90)) * game.opt.door_size;

            var patrols = [];
            patrols.push({
                x: coord.x + (game.opt.door_size * ennemy.left)*2 - (game.opt.door_size),
                y:1,
                z: coord.z + (game.opt.door_size * ennemy.top)*2 - (game.opt.door_size),
            });
            ennemy.patrol_positions.forEach(function(patrol)
            {
                var coord_pat = self.get_cell_pos_params({ x: patrol.x, z: patrol.z });
                patrols.push({
                    x: coord_pat.x + (game.opt.door_size * patrol.left)*2 - game.opt.door_size,
                    y: 1,
                    z: coord_pat.z + (game.opt.door_size * patrol.top)*2 - game.opt.door_size
                });
            });
            self.add_interraction_item('Ennemy',
            {
                level: game.level,
                x: coord.x + (game.opt.door_size * ennemy.left)*2 - (game.opt.door_size),
                z: coord.z + (game.opt.door_size * ennemy.top)*2 - (game.opt.door_size),
                patrol_positions: patrols,
                view_direction:  { x: view_x, z: view_z } ,
                patrol_loop:ennemy.patrol_loop,
                drops: [
                    {
                        type:'Stick',
                        params:{
                            walk_through_callback: function(){},
                            type:'stick'
                        }
                    },
                    {
                        type:'Potion',
                        params:{
                            walk_through_callback: function(){},
                            type:'potion'
                        }
                    }
                ],
                patrol_wait: ennemy.patrol_wait
            });
        });
    }
};



Path.prototype.play_step = function()
{
    game.assets.step_snow_sound.play();
};
Path.prototype.stop_step = function()
{
    game.assets.step_snow_sound.pause();
};

