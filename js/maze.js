var Maze = function(game, options)
{
    var self=this;
    this.id = game.getNewId();
    this.music = game.assets.maze_sound;
    this.ambient = game.assets.cave_sound;
    this.floor_material = game.assets.maze_floor_material;

    this.ambient_light_color =  0xd9cba2;
    this.ambient_light_intensity =  0.20;

    this.options=options;
    options.maze_num = game.level;

    this.outside_separators = [];
    this.nextType='Path';

    this.available_nodes = [];

    /* Memorize the doors created, to avoid creating doble contiguous doors */
    this.created_doors = {};

    // Cells, // by array
    this.cells = [];
    // Cells, by line/row
    this.generated_doors = {};

    this.closed_doors = {};
    this.closed_doors_collision = {};


    // Load / Save structure
    this.maze_data = [];
    this.load_data = [];

    this.maze_global_path = {};
    this.maze_path_ref = {};

    this.perso = game.focus_perso;

    this.interraction_items=[];
    this.all_interraction_items=[];

    // Internal vars
    this.depth = (Math.sqrt(3)/2) * game.opt.door_size*1.0;
    this.depth2 = (Math.sqrt(3)/2) * game.opt.door_size * Math.sqrt(3)/2 *1.35;
    this.current_cellid  = null; 
    this.findPath_cache = {};
};

Maze.prototype.load = function(data)
{
    this.load_data = data.random;
    options.maze_num = data.maze_num;
};


Maze.prototype.loadSaveRandom = function(value)
{
    if(this.load_data.length>0)
    {
        return this.load_data.shift();
    }
    else
    {
        this.maze_data.push(value);
        return value;
    }
};

Maze.prototype.build_doors = function()
{
    var self=this;

    this.container = new THREE.Object3D();
    this.floor_geom_refs = {};
    this.floor_geom = new THREE.Geometry();
    this.walls_geom = new THREE.Geometry();
    this.doors_geom = new THREE.Geometry();
    this.walls_collision_geom = new THREE.Geometry();


    this.num_items_line = Math.floor(Math.sqrt(this.options.maze_num));

    var total=0;
    self.max_row = 0;
    self.max_line = 0;

    // Loop to create maze
    // Loop lines
    for(var row=0; (row<this.num_items_line || total < this.options.maze_num); row++)
    {
        self.max_row = row;
        for(var line=0; (line<this.num_items_line &&  total < this.options.maze_num); line++)
        {
            if(self.max_line<line) { self.max_line= line ; }
            total++;
            var cell =  self.create_cell({ x: row , y: 1, z:line });
        }
    }

    this.get_random_start_end();

    // Correct position of the maze depending on the start position and direction
    var move_x = this.start_x*this.depth2*2;
    var move_z = this.start_z*this.depth2*2;

    this.container.position.x = this.options.x - move_x;
    this.container.position.y = 0;
    this.container.position.z = this.options.z - move_z;

    // Open/Close some doors
    this.maze_doors();

    // Close some doors, add interraction_items, etc
    this.game_doors(null, this.maze_global_path[this.start_x*this.num_items_line+this.start_z]);

    // Add Some chests
    this.cells.forEach(function(cell)
    {
        var cellid= self.getCellId(cell.params.x, cell.params.z);
        var pos = self.get_cell_pos(cellid);

        var num_chests = self.loadSaveRandom(Math.floor(Math.random()*5));
        var pos_chests = [];
        for(var i=0; i<num_chests; i++)
        {
            var size = game.opt.door_size*0.85;
            var current = self.loadSaveRandom(Math.floor(Math.random()*6));
            if(pos_chests.indexOf(current)===-1)
            {
                pos_chests.push(current);
                // Do not block an openeed door with a chest
                if(cell.opened_doors.indexOf(current)===-1)
                {
                    var id = -current+2;
                    self.add_interraction_item('Chest',{
                        level: game.level,
                        mazeid: self.id,
                        cellid: cellid,
                        type: 'chest',
                        callback: function() { },
                        rotate: Math.radians((-id+2)*60 + 180),
                        x: pos.x + Math.cos(Math.radians(id*60 - 30)) * size,
                        y: 1,
                        z: pos.z + Math.sin(Math.radians(id*60 -  30)) * size,
                    });
                }
                else
                {
                    if(cell.name=='pos 0 / 0')
                    {
                        //console.log(' skip ',cell, current);
                    }
                }
            }
        }
    });



    // Loop to create the meshes
    total=0;
    for(var row=0; (row<this.num_items_line || total < this.options.maze_num); row++)
    {
        for(var line=0; (line<this.num_items_line &&  total < this.options.maze_num); line++)
        {
            self.create_meshes({num:total, real_x:row, x: row , y: 1, real_z : line, z:line });
            total++;
        }
    }

    this.floor_geom.computeVertexNormals();
    var floor = new THREE.Mesh( this.floor_geom, this.floor_material);
    floor.receiveShadow=true;
    floor.castShadow=true;
    this.container.add(floor);




    var wall = new THREE.Mesh( this.walls_geom, game.assets.multi_wall_material);
    wall.name='walls';
    wall.receiveShadow=true;
    wall.castShadow=true;
    wall.receiveShadow=true;
    this.container.add(wall);

    var door = new THREE.Mesh( this.doors_geom, game.assets.multi_wall_material);
    door.name='doors';
    door.receiveShadow=true;
    door.castShadow=true;
    door.receiveShadow=true;
    this.container.add(door);


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


    game.scene.add( this.container );
};

Maze.prototype.get_random_start_end = function()
{
    var start_on_x = this.loadSaveRandom(!!Math.floor(Math.random()*2));
    var x=0;
    var z =0;

    // Start pos
    while(!this.generated_doors[x] || !this.generated_doors[x][z])
    {
        z = this.loadSaveRandom(Math.floor(Math.random()*(this.max_line+1)));
    }

    this.start_x = x;
    this.start_z = z;

    z=-1;
    x= this.max_row;

    // End door
    while(!this.generated_doors[x] || !this.generated_doors[x][z])
    {
        z = this.loadSaveRandom(Math.floor(Math.random()*(this.max_line+1)));
    }

    this.end_x = x;
    this.end_z = z;

    this.start_door = this.generated_doors[this.start_x][this.start_z];
    this.end_door = this.generated_doors[this.end_x][this.end_z];
};

Maze.prototype.maze_doors = function()
{
    // Start doors
    var params = { x: this.start_x , z: this.start_z, real_x:'outside',real_z:'outside'};
    var cell = this.cells[this.start_x*this.num_items_line + this.start_z];
    var start_door_top_bottom=false;

    this.start_i = 4;
    this.create_separation_line(cell,params, this.start_i, 'start');
    this.generated_doors[this.start_x][this.start_z].opened_doors.push(this.start_i);

    // End doors
    var params = { x: this.end_x , z: this.end_z, real_x:'outside',real_z:'outside'};
    var cell = this.cells[this.end_x*this.num_items_line + this.end_z];
    this.end_i = 1;
    this.create_separation_line(cell,params, this.end_i, 'end');
    this.generated_doors[this.end_x][this.end_z].opened_doors.push(this.end_i);

    var x= this.start_x;
    var z= this.start_z;

    var cellid = x*this.num_items_line + z;
    this.maze_global_path = {};
    this.maze_global_path[cellid] = {};
    this.maze_path_ref[cellid] = this.maze_global_path[cellid];

    this.generated_doors[x][z].used=1;
    this.maze_doors_queue = [[x,z]];
    while(this.maze_doors_queue.length>0)
    {
        this.maze_doors_next();
    }
};

Maze.prototype.getCellId = function(x, z)
{
    return x*this.num_items_line + z;
};

Maze.prototype.maze_doors_next = function()
{
    var self=this;
    var opt = this.maze_doors_queue.shift();
    if(opt===undefined)
    {
        return;
    }

    var initial_x = opt[0];
    var initial_z = opt[1];
    var initial_cellid = initial_x * this.num_items_line + initial_z;
    var parent_path =  this.maze_path_ref[initial_cellid];


    var next_doors_full = this.near_cells(initial_x, initial_z);
    var next_doors_unused=[];
    next_doors_full.forEach(function(door)
    {
        if(!self.generated_doors[door[0]][door[1]].used)
        {
            next_doors_unused.push(door);
        }
    });
    if(next_doors_unused.length>0)
    {
        var doors_to_open = this.loadSaveRandom(Math.ceil(Math.random()*3));
        for(var i=0; i<doors_to_open;i++)
        {
            var opened_link = this.loadSaveRandom(Math.floor(Math.random()*next_doors_unused.length));
            var dest_x = next_doors_unused[opened_link][0];
            var dest_z = next_doors_unused[opened_link][1];
            var dest_i = next_doors_unused[opened_link][2];

            this.generated_doors[initial_x][initial_z].opened_doors.push(this.get_opposide_door(dest_i));
            this.generated_doors[dest_x][dest_z].opened_doors.push(dest_i);
            
            var cellid = dest_x * this.num_items_line + dest_z;
            parent_path[cellid] = {};
            this.maze_path_ref[cellid] = parent_path[cellid];

            this.generated_doors[next_doors_unused[opened_link][0]][next_doors_unused[opened_link][1]].used=1;
            this.maze_doors_queue.push(next_doors_unused[opened_link]);
        }
    }

    // Do a maze with the not connected dots too
    else
    {
        for(var x=0; x<=this.max_row; x++)
        {
            for(var z=0; z<=this.max_line; z++)
            {
                // Need to link and unused cell with a used cell
                if(this.generated_doors[x][z] && !this.generated_doors[x][z].used)
                {
                    next_doors_full = this.near_cells(x, z);
                    next_doors_used=[];
                    next_doors_full.forEach(function(door)
                    {
                        if(self.generated_doors[door[0]][door[1]].used)
                        {
                            next_doors_used.push(door);
                        }
                    });
                    if(next_doors_used.length>0)
                    {
                        var connected_door = next_doors_used[this.loadSaveRandom(Math.floor(Math.random()* next_doors_used.length))];
                        var cellid = connected_door[0] * this.num_items_line + connected_door[1];
                        parent_path =  this.maze_path_ref[initial_cellid];


                        cellid = x*this.num_items_line + z;
                        parent_path[cellid] = {};
                        this.maze_path_ref[cellid] = parent_path[cellid];

                        this.generated_doors[connected_door[0]][connected_door[1]].used=1;
                        this.maze_doors_queue.push(connected_door);
                    }
                }
            }
        }
    }
};

// Close some doors, add interraction_items, etc
Maze.prototype.game_doors = function(currentid, subnodes)
{
    var doors = Object.keys(subnodes);
    if(!doors || !doors.length)
    {
        return;
    }
    if(currentid)
    {
        this.available_nodes.push(currentid);
    }


    if(this.available_nodes.length>0)
    {
        var close_door = doors[this.loadSaveRandom(Math.floor(Math.random()*doors.length))];
        var cell_door = this.cells[close_door];
        var close_i = cell_door.opened_doors[this.loadSaveRandom(Math.floor(Math.random()*cell_door.opened_doors.length))];
        if(cell_door.opened_doors.length>0 && cell_door.closed_doors.indexOf(close_i)===-1)
        {
            var interruptor_idx = this.loadSaveRandom(Math.floor(Math.random()*this.available_nodes.length));
            var cell_interruptor = this.cells[this.available_nodes[interruptor_idx]];
            cell_door.closed_doors.push(close_i);

            // Needs to add corresponding closed door from the other side
            var opposite_pos = this.get_coord_next_door(cell_door.params.x, cell_door.params.z, close_i);

            var cellid = this.getCellId(opposite_pos[0], opposite_pos[1]);
            var opposite_cell = this.cells[cellid];

            // If it is the end cell, there is no opposite cell
            if(opposite_cell)
            {
                opposite_cell.closed_doors.push(opposite_pos[2]);
            }

            var pos_interruptor = this.get_cell_pos(this.available_nodes[interruptor_idx]);

            // Add ennemy with the key
            var num_vectors = this.loadSaveRandom(Math.floor(Math.random()*9))+3;
            var start_position = this.loadSaveRandom(Math.floor(Math.random()*12));
            var size = game.opt.door_size * this.loadSaveRandom(Math.floor(Math.random()*10)/20 + 0.4);
            if(num_vectors>6) { num_vectors=12; patrol_loop=true; }

            patrol_positions = this.ennemy_patrol_round(currentid, start_position, num_vectors, size);

            var patrol_wait = (2 + this.loadSaveRandom(Math.floor(Math.random()*4)))*1000;
            this.add_interraction_item('Ennemy',
            {
                level: game.level,
                x: patrol_positions[0].x,
                z: patrol_positions[0].z,
                patrol_positions: patrol_positions,
                patrol_loop:patrol_loop,
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
                    },
                    {
                        type:'Key',
                        params:{
                            type: 'key',
                            walk_through_callback: this.openDoor.bind(this, cell_door, close_i)
                    }
                  }
                ],
                patrol_wait: patrol_wait
            });

            this.available_nodes = this.available_nodes.splice(interruptor_idx-1, 1);
        }
    }
    if(currentid)
    {
        var start_id = currentid;
        var destination_id = this.available_nodes[this.loadSaveRandom(Math.floor(Math.random()*this.available_nodes.length))];

        var patrol_positions=null;
        var patrol_loop=false;

        // Patrol in current cell only
        if(start_id==destination_id)
        {
            var num_vectors = this.loadSaveRandom(Math.floor(Math.random()*9))+3;
            var start_position = this.loadSaveRandom(Math.floor(Math.random()*12));
            var size = game.opt.door_size * this.loadSaveRandom(Math.floor(Math.random()*10)/20 + 0.4);

            if(num_vectors>6) { num_vectors=12; patrol_loop=true; }

            patrol_positions = this.ennemy_patrol_round(currentid, start_position, num_vectors, size);
        }
        // Patrol between 2 cells
        else
        {
            patrol_positions= this.findPath(this.cells[start_id], this.cells[destination_id]);

            var start_pos = this.get_cell_pos(start_id);
            var end_pos = this.get_cell_pos(destination_id);
            var start_vector = new THREE.Vector3(start_pos.x , 1, start_pos.z);
            var end_vector = new THREE.Vector3(end_pos.x , 1, end_pos.z);

            patrol_positions.push(start_vector);
            patrol_positions.unshift(end_vector);
            var path = patrol_positions;

        }
    }
    for(var i=0; i<doors.length; i++)
    {
        this.game_doors(doors[i], subnodes[doors[i]]);
    }
};

Maze.prototype.ennemy_patrol_round = function(cellid, start_angle, num_steps, size, clockwise)
{
    var start = this.get_cell_pos(cellid);
    var patrol_positions = [];
    for(var i=start_angle; i< start_angle+num_steps;i++)
    {
        patrol_positions.push({
            x: start.x + (Math.cos(Math.radians((clockwise ? i : -i)*30)) * size),
            y: 1,
            z: start.z + (Math.sin(Math.radians((clockwise ? i : -i)*30)) * size),
        });
    }
    return patrol_positions;
};

Maze.prototype.openDoor = function(closed_door, i, opposite_cell, opposite_i)
{
    play_multiple(game.assets.door_open_sound);
    var closed_door_id = this.get_closed_door_id(closed_door.params, i);
    var closed_door_mesh = this.closed_doors[closed_door_id];
    var closed_door_mesh_col = this.closed_doors_collision[closed_door_id];
    if(closed_door_mesh)
    {
        closed_door_mesh.material.visible=false;
        closed_door_mesh_col.material.visible=false;
        delete this.closed_doors[closed_door_id];
        delete this.closed_doors_collision[closed_door_id];
    }
}
Maze.prototype.get_closed_door_id=  function(params,i)
{
    var first_cellid = this.getCellId(params.x, params.z);

    var coord_next = this.get_coord_next_door(params.x, params.z, i);
    var next_cellid = this.getCellId(coord_next[0], coord_next[1]);

    if(first_cellid>next_cellid)
    {
        var t = next_cellid;
        next_cellid=first_cellid;
        first_cellid=t;
    }

    return 'closed_from_'+first_cellid+'_to_'+next_cellid;
};

Maze.prototype.get_opposide_door = function(i)
{
    switch(i)
    {
        case 0: return 3;
        case 1: return 4;
        case 2: return 5;
        case 3: return 0;
        case 4: return 1;
        case 5: return 2;
    }
};

Maze.prototype.get_coord_next_door = function(initial_x, initial_z, i)
{
    var pair = !!(initial_x%2===0);
    switch(i)
    {
        //bottom
        case 0:  return([ initial_x, initial_z+1, this.get_opposide_door(i)]); break;
        // right bottom
        case 1:  return([ initial_x+1, pair ? initial_z : initial_z+1, this.get_opposide_door(i)]); break;
        // right top
        case 2:  return([ initial_x+1, pair ? initial_z-1 : initial_z, this.get_opposide_door(i)]); break;
        // top
        case 3:  return([ initial_x, initial_z-1, this.get_opposide_door(i)]); break;
        // left top
        case 4:  return([ initial_x-1, pair ? initial_z-1 : initial_z, this.get_opposide_door(i) ]); break;
        // left bottom
        case 5:  return([ initial_x-1, pair ? initial_z : initial_z+1, this.get_opposide_door(i)]); break;
    }
};

Maze.prototype.near_cells = function(initial_x, initial_z, only_connected)
{
    var self=this;
    var next_doors = [];

    var check = [];
    var door = this.generated_doors[initial_x] ? this.generated_doors[initial_x][initial_z] : null;
    var add_check = only_connected ?
        [
            door.opened_doors.indexOf(0)!==-1 ? 1 : 0,
            door.opened_doors.indexOf(1)!==-1 ? 1 : 0,
            door.opened_doors.indexOf(2)!==-1 ? 1 : 0,
            door.opened_doors.indexOf(3)!==-1 ? 1 : 0,
            door.opened_doors.indexOf(4)!==-1 ? 1 : 0,
            door.opened_doors.indexOf(5)!==-1 ? 1 : 0
        ] :
        [ 1, 1, 1, 1, 1, 1 ];

    for(var i=0; i<6;i++)
    {
        if(add_check[i]) { check.push(this.get_coord_next_door(initial_x, initial_z, i)); }
    }
    check.forEach(function(c)
    {
        var x = c[0];
        var z = c[1];
        var i = c[2];
        if(self.generated_doors[x] && self.generated_doors[x][z])
        {
            next_doors.push([x,z,i]);
        }
    });
    return next_doors;
};

Maze.prototype.register_door= function(x, z, i, cell)
{
    if(!this.created_doors[x+'.'+z])
    {
        this.created_doors[x+'.'+z]={};
    }

    this.created_doors[x+'.'+z][i] = 1;

    if(cell)
    {
        var coords = this.get_coord_next_door(x, z, this.get_opposide_door(i));
        this.register_door(coords[0], coords[1], i, false);
    }
};

Maze.prototype.get_pos = function(params)
{
    var pair = params.x%2 ? this.depth2 : 0;
    var x =params.x * this.depth *2;
    var z =params.z * this.depth2 *2 + pair;

    return { x: x, z: z};
};
Maze.prototype.get_start_pos = function()
{
    var cellid = this.getCellId(this.start_x, this.start_z);
    return this.get_cell_pos(cellid);
};

Maze.prototype.get_cell_pos = function(cellid)
{
    var cell = this.cells[cellid];
    var coord = this.get_pos({ x: cell.params.x - this.start_x , z: cell.params.z - this.start_z });
    return { x: coord.x + this.options.x , z: coord.z + this.options.z, cellid: 0 };
};

Maze.prototype.get_end_pos = function()
{
    var coord_close_door = this.get_coord_next_door(this.end_x, this.end_z, 1);
    var coord = this.get_pos({ x: coord_close_door[0] - this.start_x , z: coord_close_door[1] - this.start_z });
    return { x: coord.x + this.options.x , z: coord.z + this.options.z, cellid: this.cells.length };
};

Maze.prototype.create_cell = function(params)
{
    var self=this;

    var cellid = params.real_x=='outside' ? 'outside' : params.real_x*this.num_items_line + params.real_z;

    this.fulldepth = game.opt.door_size + game.opt.door_size*2;
    var pair = params.x%2 ? this.depth2 : 0;
    var cell = new THREE.Object3D();

    if(!this.generated_doors[params.x])
    {
        this.generated_doors[params.x] = {};
    }
    this.generated_doors[params.x][params.z]  = cell;

    cell.id=cellid;
    cell.name='pos '+params.x+' / '+params.z;
    cell.separation_lines=[];
    cell.opened_doors=[];
    cell.closed_doors=[];
    var pos = this.get_pos(params);
    cell.position.x=pos.x;
    cell.position.y=0;
    cell.position.z=pos.z;
    cell.incell=false;
    cell.params=params;
    this.cells.push(cell);
    this.container.add(cell);

    var key = params.x+'_'+params.z;
    var start_idx = this.floor_geom.vertices.length;

    // Create ground of that pivot
    // V1 = top left, V2 = left, V3 = bottom left, etc

    var vcenter = new THREE.Vector3(cell.position.x ,1,cell.position.z);
    this.floor_geom.vertices.push(vcenter);
    var vcenter_idx = start_idx;
    start_idx++;

    if(!this.floor_geom_refs[key] || !this.floor_geom_refs[key].v1 )
    {
        var v1 = new THREE.Vector3(cell.position.x - game.opt.door_size/1.8 , 0 , cell.position.z-this.depth2*1.0 );
        this.floor_geom.vertices.push(v1);
        v1_idx = start_idx;
        start_idx++;
    }
    else
    {
        v1_idx = this.floor_geom_refs[key].v1;
    }

    if(!this.floor_geom_refs[key] || !this.floor_geom_refs[key].v2)
    {
        var v2 = new THREE.Vector3(cell.position.x - game.opt.door_size*1.2 , 0,cell.position.z);
        this.floor_geom.vertices.push(v2);
        v2_idx = start_idx;
        start_idx++;
    }
    else
    {
        v2_idx = this.floor_geom_refs[key].v2;
    }

    if(!this.floor_geom_refs[key] || !this.floor_geom_refs[key].v3)
    {
        var v3 = new THREE.Vector3(cell.position.x - game.opt.door_size/1.8 , 0 , cell.position.z+this.depth2*1.0 );
        this.floor_geom.vertices.push(v3);
        v3_idx = start_idx;
        start_idx++;
    }
    else
    {
        v3_idx = this.floor_geom_refs[key].v3;
    }

    if(!this.floor_geom_refs[key] || !this.floor_geom_refs[key].v4)
    {
        var v4 = new THREE.Vector3(cell.position.x + game.opt.door_size/1.8 , 0 , cell.position.z+this.depth2*1.0 );
        this.floor_geom.vertices.push(v4);
        v4_idx = start_idx;
        start_idx++;
    }
    else
    {
        v4_idx = this.floor_geom_refs[key].v4;
    }

    if(!this.floor_geom_refs[key] || !this.floor_geom_refs[key].v5)
    {
        var v5 = new THREE.Vector3(cell.position.x + game.opt.door_size*1.2 , 0,cell.position.z);
        this.floor_geom.vertices.push(v5);
        v5_idx = start_idx;
        start_idx++;
    }
    else
    {
        v5_idx = this.floor_geom_refs[key].v5;
    }

    if(!this.floor_geom_refs[key] || !this.floor_geom_refs[key].v6)
    {
        var v6 = new THREE.Vector3(cell.position.x + game.opt.door_size/1.8 , 0 , cell.position.z-this.depth2*1.0 );
        this.floor_geom.vertices.push(v6);
        v6_idx = start_idx;
        start_idx++;
    }
    else
    {
        v6_idx = this.floor_geom_refs[key].v6;
    }


    var subkey;
    // Top / Bottom vertices
    subkey = (params.x)+'_'+(params.z+1);
    if(!this.floor_geom_refs[subkey])
    {
        this.floor_geom_refs[subkey] = {};
    }
    this.floor_geom_refs[subkey].v1 = v3_idx;
    this.floor_geom_refs[subkey].v6 = v4_idx;

    // Side vertices
    if(params.x%2==0)
    {
        subkey = (params.x+1)+'_'+(params.z);
        if(!this.floor_geom_refs[subkey])
        {
            this.floor_geom_refs[subkey] = {};
        }
        this.floor_geom_refs[subkey].v1 = v5_idx;
        this.floor_geom_refs[subkey].v2 = v4_idx;

        subkey = (params.x+1)+'_'+(params.z-1);
        if(!this.floor_geom_refs[subkey])
        {
            this.floor_geom_refs[subkey] = {};
        }
        this.floor_geom_refs[subkey].v2 = v6_idx;
        this.floor_geom_refs[subkey].v3 = v5_idx;
    }
    else
    {
        subkey = (params.x+1)+'_'+(params.z);
        if(!this.floor_geom_refs[subkey])
        {
            this.floor_geom_refs[subkey] = {};
        }
        this.floor_geom_refs[subkey].v2 = v6_idx;
        this.floor_geom_refs[subkey].v3 = v5_idx;

        subkey = (params.x-1)+'_'+(params.z+1);
        if(!this.floor_geom_refs[subkey])
        {
            this.floor_geom_refs[subkey] = {};
        }
        this.floor_geom_refs[subkey].v6 = v2_idx;
        this.floor_geom_refs[subkey].v5 = v3_idx;
    }

    var material = new THREE.MeshBasicMaterial( { color: 0x3366bb  } );
    this.floor_geom.faces.push( new THREE.Face3( vcenter_idx, v1_idx, v2_idx ) );
    var faceuv = [
        new THREE.Vector2(0,0),
        new THREE.Vector2(1,1),
        new THREE.Vector2(1,0),
    ];
    this.floor_geom.faceVertexUvs[0].push(faceuv);

    this.floor_geom.faces.push( new THREE.Face3( vcenter_idx, v2_idx, v3_idx ) );
    var faceuv = [
        new THREE.Vector2(1,1), // 3
        new THREE.Vector2(0,1), // 1
        new THREE.Vector2(1,0), // 2
    ];
    this.floor_geom.faceVertexUvs[0].push(faceuv);

    this.floor_geom.faces.push( new THREE.Face3( vcenter_idx, v3_idx, v4_idx ) );
    var faceuv = [
        new THREE.Vector2(1,0), // 1
        new THREE.Vector2(1,1), // 2
        new THREE.Vector2(0,1) // 3
    ];
    this.floor_geom.faceVertexUvs[0].push(faceuv);

    this.floor_geom.faces.push( new THREE.Face3( vcenter_idx, v4_idx, v5_idx ) );
    var faceuv = [
        new THREE.Vector2(0,1),
        new THREE.Vector2(1,1),
        new THREE.Vector2(1,0),
    ];
    this.floor_geom.faceVertexUvs[0].push(faceuv);

    this.floor_geom.faces.push( new THREE.Face3( vcenter_idx, v5_idx, v6_idx ) );
    var faceuv = [
        new THREE.Vector2(1,0),
        new THREE.Vector2(0,1),
        new THREE.Vector2(1,1),
    ];
    this.floor_geom.faceVertexUvs[0].push(faceuv);

    this.floor_geom.faces.push( new THREE.Face3( vcenter_idx, v6_idx, v1_idx) );
    var faceuv = [
        new THREE.Vector2(0,1), // 2
        new THREE.Vector2(0,0), // 1
        new THREE.Vector2(1,0), // 3
    ];
    this.floor_geom.faceVertexUvs[0].push(faceuv);

    return cell;
};

Maze.prototype.set_mesh_orientation = function(mesh,i)
{
    var ratio = 0.6;
    mesh.scale.x=ratio*game.opt.door_size;
    mesh.scale.y= ratio*game.opt.door_size;
    mesh.scale.z= ratio*game.opt.door_size;
    mesh.rotation.y= Math.radians(i*60);


    switch(i)
    {
        case 0:
            mesh.position.z += game.opt.door_size;
            break;
        case 1: 
            mesh.position.z += game.opt.door_size * 0.50;
            mesh.position.x += this.depth;
            break;
        case 2:
            mesh.position.z -= game.opt.door_size * 0.50;
            mesh.position.x += this.depth;
            break;
        case 3:
            mesh.position.z -= game.opt.door_size;
            break;
        case 4:
            mesh.position.z -= game.opt.door_size * 0.50;
            mesh.position.x -= this.depth;
            break;
        case 5:
            mesh.position.z += game.opt.door_size * 0.50;
            mesh.position.x -= this.depth;
            break;
    }
    mesh.updateMatrix();
};

Maze.prototype.create_meshes = function(params)
{
    var self=this;


    this.fulldepth = game.opt.door_size + game.opt.door_size*2;
    var cell = this.cells[params.num];
    for(var i=0; i<6;i++)
    {
        if(!this.created_doors[params.x+'.'+params.z] || !this.created_doors[params.x+'.'+params.z][i])
        {
            this.register_door(params.x, params.z, i, cell);

            var materials = [];

            var mesh=null;
            var collision_mesh=null;
            if(this.generated_doors[params.real_x][params.real_z].opened_doors.indexOf(i)!==-1)
            {
                mesh = new THREE.Mesh( game.assets.door1_geo);
                mesh.type=='door';
                collision_mesh = new THREE.Mesh( game.assets.door_geo);
                var closed_door_id = this.get_closed_door_id(params,i);
                if(this.generated_doors[params.x][params.z].closed_doors.indexOf(i)!==-1 && !this.closed_doors[closed_door_id])
                {
                    var door_collision_mat = new THREE.MeshBasicMaterial( { color:0xffbbbb, wireframe: false, visible:game.opt.debug_level>1, transparent:true, opacity:0.5   } );
                    var close_mesh = new THREE.Mesh( game.assets.dooropen_geo, door_collision_mat);
                    var close_mesh1 = new THREE.Mesh( game.assets.dooropen1_geo, new THREE.MultiMaterial(game.assets.dooropen1_mat));
                    close_mesh.name=closed_door_id;
                    this.closed_doors[closed_door_id] = close_mesh;
                    this.closed_doors_collision[closed_door_id] = close_mesh1;

                    this.container.add(close_mesh);
                    this.container.add(close_mesh1);

                    close_mesh.position.x = cell.position.x;
                    close_mesh.position.y = cell.position.y;
                    close_mesh.position.z = cell.position.z;
                    this.set_mesh_orientation(close_mesh, i);

                    close_mesh1.position.x = cell.position.x;
                    close_mesh1.position.y = cell.position.y;
                    close_mesh1.position.z = cell.position.z;
                    this.set_mesh_orientation(close_mesh1, i);

                }

            }
            else
            {
                mesh = new THREE.Mesh( game.assets.wall1_geo);
                mesh.type=='wall';
                collision_mesh = new THREE.Mesh( game.assets.wall_geo);
            }
            if(mesh)
            {
                mesh.position.x = cell.position.x;
                mesh.position.y = cell.position.y;
                mesh.position.z = cell.position.z;

                collision_mesh.position.x = cell.position.x;
                collision_mesh.position.y = cell.position.y;
                collision_mesh.position.z = cell.position.z;

                this.set_mesh_orientation(mesh, i);
                this.set_mesh_orientation(collision_mesh, i);

                if(game.opt.debug_level<1)
                {
                    if(mesh.type=='wall')
                    {
                        this.walls_geom.merge(mesh.geometry, mesh.matrix);
                    }
                    else
                    {
                        this.doors_geom.merge(mesh.geometry, mesh.matrix);
                    }
                }
                this.walls_collision_geom.merge(collision_mesh.geometry, mesh.matrix);
            }
        }
        
        var areas=[];
        // Create collision items to detect enter in the cell
        if(this.generated_doors[params.real_x][params.real_z].opened_doors.indexOf(i)!==-1)
        {
            var door = this.generated_doors[params.real_x][params.real_z];
            var outside_door =
                ( params.real_x == this.start_x && params.real_z == this.start_z && i == this.start_i) ||
                ( params.real_x == this.end_x && params.real_z == this.end_z && i == this.end_i);

            this.create_separation_line(cell,params, i, false, outside_door);
        }
    }
    return cell;
};

Maze.prototype.findPath = function(origin, destination)
{
    var self=this;
    if(this.findPath_cache[origin.name+' to '+destination.name])
    {
        var res = this.findPath_cache[origin.name+' to '+destination.name].concat();
        return res;
    }

    var parent_paths= {};

    var to_visit = [];
    var correct_path= null;

    var doors = this.near_cells(origin.params.x, origin.params.z, true);
    var i=0;
    while(i<doors.length && !correct_path)
    {
        var door_data = doors[i];
        var cell = this.generated_doors[door_data[0]][door_data[1]];
        parent_paths[cell.name] = { i : (door_data[2]), cell: origin };
        correct_path = (cell===destination);
        if(!correct_path)
        {
            to_visit.push({ parent: origin.name, cell: cell});
        }
        i++;
    }

    while(!correct_path && to_visit.length>0)
    {
        var next = to_visit.shift();
        var cell = next.cell;

        this.near_cells(cell.params.x, cell.params.z, true).forEach(function(door_data)
        {
            var near_cell = self.generated_doors[door_data[0]][door_data[1]];
            if(!parent_paths[near_cell.name])
            {
                parent_paths[near_cell.name] = { i : (door_data[2]), cell: cell };
                if(near_cell===destination)
                {
                    correct_path = true;
                }
                to_visit.push({ parent: cell.name, cell: near_cell});
            }
        });
    }

    var path = [];
    // There is a path to this
    if(correct_path)
    {
        var current = destination;
        var loop_avoid=0;
        var next_i = this.get_opposide_door(parent_paths[destination.name].i);

        path.push(this.getFindPathCoord(destination, parent_paths[destination.name].i));
        while(parent_paths[current.name] && parent_paths[current.name].cell!==origin)
        {
            var old_current = current;
            current = parent_paths[current.name].cell;
            path.push(this.getFindPathCoord(parent_paths[old_current.name].cell, next_i));

            next_i = this.get_opposide_door(parent_paths[current.name].i);
            path.push(this.getFindPathCoord(parent_paths[old_current.name].cell, parent_paths[current.name].i));

            loop_avoid++;
        }
        path.push(this.getFindPathCoord(origin, next_i));
    }
    this.findPath_cache[origin.name+' to '+destination.name] = path.concat();
    return path;
};

Maze.prototype.getFindPathCoord = function(cell, i)
{
    var origin = cell.position.clone().add(this.container.position);
    var dot = new THREE.Vector3(0, 1, game.opt.door_size*0.7);
    dot.applyAxisAngle(new THREE.Vector3(0,1,0), Math.radians(i*60));

    dot.add(origin);
    return dot;
};


Maze.prototype.create_separation_line= function(cell,params, i, extra_door, outside_door)
{
    var self=this;
    var material = new THREE.MeshBasicMaterial( { color: 0x666699, transparent:true, visible:false } );
    if(game.opt.debug_level>1)
    {
        material = new THREE.MeshBasicMaterial( { color: 0xffff99 + 0x0000ff, visible:true  } );
    }

    var extra = extra_door ? game.opt.door_size*0.4 : 0;
    var separator = outside_door ? 0.8 : 0.85;

    var pivot = new THREE.Object3D();
    pivot.name ='p '+params.x+'/'+params.z+'/'+i;
    pivot.rotation.y= Math.radians(i*60);
    cell.add(pivot);

    draw_line({
        visible: game.opt.debug_level>1,
        opacity:game.opt.debug_level>1 ? 1 : 0,
        container: pivot,
        color: 0x999999 + Math.random()* 0xffffff,
        origin: { x: this.depth*( !extra_door ? .65 : .7), y: 1,  z: game.opt.door_size*separator +extra },
        destination: { x: -this.depth*(!extra_door ? .65 : .7), y: 1, z: game.opt.door_size*separator +extra }
    });


    var cellid = params.real_x=='outside' ? 'outside' : params.real_x*this.num_items_line + params.real_z;

    // Used by game enter detection.
    line.mazeid = this.id;
    line.cellid = cellid;
    cell.separation_lines.push(line);

    var action = '';
    if(extra_door=='start'){
        action = 'leave_maze_from_start';
    }
    if(extra_door=='end'){
        action = 'leave_maze_from_end';
    }
    line.walk_through_callback=this.changeCellEvent.bind(this, cellid, action);

    line.enter_leave_door = !!extra;
    line.outside_door = outside_door;
    if(outside_door)
    {
        self.outside_separators.push(line);
    }
};

Maze.prototype.reload = function()
{
    var self=this;
    console.log('maze reload!');
};

Maze.prototype.getStaticObstacles = function()
{
    var obstacles = [this.walls_collision];
    if(this.closed_doors)
    {
        for(var i in this.closed_doors)
        {
            obstacles.push(this.closed_doors[i]);
        }
    }
    this.interraction_items.forEach(function(item)
    {
        if(item.is_static_collision && !item.can_walk_through)
        {
            obstacles.push(item.container_mesh);
        }
    });
    if(this.entered && this.close_mesh)
    {
        obstacles.push(this.close_mesh);
    }
    return obstacles;
};

Maze.prototype.getMovingObstacles = function()
{
    var obstacles=[];
    this.interraction_items.forEach(function(item)
    {
        if(item.is_hoverable && !item.is_static_collision && !item.can_walk_through)
        {
            obstacles.push(item.container_mesh);
        }
    });
    return obstacles;
};

Maze.prototype.getHovers = function()
{
    var hovers = [];
    this.interraction_items.forEach(function(item)
    {
        if(item.is_hoverable)
        {
           hovers.push(item.container_mesh);
        }
    });
    return hovers;
};

Maze.prototype.getCollisionCallbacks = function()
{
    var self=this;
    if(this.perso.current_cell!==null)
    {
        var cbs=[];
        var cell = this.cells[this.perso.current_cell];
        if(!cell)
        {
            console.error('no current cell !');
            return [];
        }

        var params = cell.params;

        // If current cell has an enter/leave maze separation line,
        // add it to collision callback
        cell.separation_lines.forEach(function(line)
        {
            if(line.enter_leave_door && !line.outside_door)
            {
                cbs.push(line);
            }
        });
        this.interraction_items.forEach(function(item)
        {
            if(item.has_walk_through_callback)
            {
                cbs.push(item.container_mesh);
            }
        });

        // Add separation lines of neighbor cells
        var doors = this.near_cells(params.x, params.z);
        doors.forEach(function(door)
        {
            var door_x = door[0];
            var door_z = door[1];
            var near_cell = self.cells[door_x*self.num_items_line+door_z];
            cbs=cbs.concat(near_cell.separation_lines)
        });
        return cbs;
    }
    else
    {
        return [];
    }
};

Maze.prototype.getOutsideCollisionCallbacks = function()
{
    return this.outside_separators;
};


Maze.prototype.changeCellEvent = function(cellid, action)
{
    if(cellid != this.current_cellid)
    {
        this.current_cellid = cellid;
        if(cellid!='outside')
        {
            this.changeCell(cellid);
        }

        if(action=='leave_maze_from_start')
        {
            game.enterType(this.options.parent);
        }
        else if(action=='leave_maze_from_end')
        {
            console.log('leave maze from end');
            game.enterType(this.next_item);
        }
        game.updateCollisionsCache();
    }
};

Maze.prototype.changeCell= function(cellid)
{
    console.log('entering cell here ',cellid);
    game.enterType(this);
    game.focus_perso.current_cell=cellid;
    var cell = this.cells[cellid];
};

Maze.prototype.build = function(load_data)
{
    var self=this;
    if(load_data)
    {
        this.load(load_data);
    }
    this.build_doors();
};


Maze.prototype.getMazeGenerationString = function()
{
    return {
        maze_num: this.options.maze_num,
        random: this.maze_data
    };
};
Maze.prototype.enter = function()
{
    if(!this.entered)
    {
        this.level_text = game.add_fadeout_text({
            text:'L e v e l   '+game.level,
            color:game.config.enter_color,
            bevelSize: 0.4,
            size: game.config.enter_size,
            material: this.floor_material.clone(),
            delta_y : 5,
            position: this.container.position
        });

        this.music.currentTime=0;
        this.ambient.currentTime=0;

        game.fadeinmusic(this.music, game.config.music_volume);
        game.fadeinmusic(this.ambient, game.config.ambient_volume);
        game.ambient_light.color = new THREE.Color(this.ambient_light_color);
        game.ambient_light.intensity = game.opt.debug_level>1 ? 1 : this.ambient_light_intensity;
        this.entered=true;
        game.enterType(this);
        if(this.options.parent)
        {
            game.assets.door_close_sound.play();
            var door_collision_mat = new THREE.MeshBasicMaterial( { visible:false    } );

            this.close_mesh = new THREE.Mesh( game.assets.wall_geo, door_collision_mat);
            var close_mesh1 = new THREE.Mesh( game.assets.dooropen1_geo, new THREE.MultiMaterial(game.assets.dooropen1_mat));

            this.container.add(this.close_mesh);
            this.container.add(close_mesh1);

            var cell = this.start_door;
            this.close_mesh.position.x = cell.position.x;
            this.close_mesh.position.y = cell.position.y;
            this.close_mesh.position.z = cell.position.z;
            this.set_mesh_orientation(this.close_mesh, this.start_i);

            close_mesh1.position.x = cell.position.x;
            close_mesh1.position.y = cell.position.y;
            close_mesh1.position.z = cell.position.z;
            this.set_mesh_orientation(close_mesh1, this.start_i);
        }
    }
    this.buildNext();
};

Maze.prototype.leave = function()
{
    game.fadeoutmusic(this.music);
    game.fadeoutmusic(this.ambient);
    this.stop_step();
    this.entered=false;
    console.log('leave maze');
};

Maze.prototype.remove_interraction_item = function(item)
{
    var idx = this.interraction_items.indexOf(item);
    this.interraction_items.splice(idx, 1);
};

Maze.prototype.add_interraction_item = function(type,options, dropping)
{
    options.ai = true;
    options.parentStructure = this;
    options.game = game;
    if(!window[type])
    {
        return console.error('Cannot create interraction item ',type);
    }
    var item = new window[type](game,  options);

    item.build();
    if(dropping)
    {
        item.dropped();
    }
    item.name=type;
    this.interraction_items.push(item);
    this.all_interraction_items.push(item);
    game.updateCollisionsCache();
    return item;
};

Maze.prototype.update= function(delta)
{
    this.interraction_items.forEach(function(item)
    {
        item.update(delta);
    });
    game.focus_perso.update_temperature(-delta*100);
};

Maze.prototype.buildNext = function()
{
    game.level++;
    if(!this.next_item)
    {
        var pos = this.get_end_pos();
        var next_door = this.get_coord_next_door(pos.x ,pos.z, 1); 

        this.next_item = new window[this.nextType](game, {
            parent: this,
            x: next_door[0],
            z: next_door[1] });
        this.next_item.build();
    }

};

Maze.prototype.play_step = function()
{
    game.assets.step_floor_sound.play();
};

Maze.prototype.stop_step = function()
{
    game.assets.step_floor_sound.pause();
};

Maze.prototype.unload = function()
{
    this.next_item.options.parent = null;
    this.all_interraction_items.forEach(function(item)
    {
        item.remove();
    });
    game.scene.remove(this.level_text);
    game.scene.remove(this.container);
};
