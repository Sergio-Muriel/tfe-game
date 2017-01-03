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


Maze.prototype.getCellId = function(x, z)
{
    return x*this.num_items_line + z;
};

Maze.prototype.openDoor = function(x, z, i)
{
    var door = this.doors[x+'-'+z+'-'+i];
    door.opened=true;
    var closed_door_mesh = door.mesh;
    var closed_door_mesh_col = door.collision;

    play_multiple(game.assets.door_open_sound);
    if(closed_door_mesh)
    {
        closed_door_mesh.material.visible=false;
        closed_door_mesh_col.material.visible=false;
    }
    game.updateCollisionsCache();
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


Maze.prototype.create_separation_line= function(cell,params, i, callback)
{
    var self=this;
    var material = new THREE.MeshBasicMaterial( { color: 0x666699, transparent:true, visible:false } );
    if(game.opt.debug_level>1)
    {
        material = new THREE.MeshBasicMaterial( { color: 0xffff99 + 0x0000ff, visible:true  } );
    }

    var extra = 0;
    var separator = 0.75;

    var pivot = new THREE.Object3D();
    pivot.name ='p '+params.x+'/'+params.z+'/'+i;
    pivot.rotation.y= Math.radians(i*60);
    cell.add(pivot);

    draw_line({
        visible: game.opt.debug_level>1,
        opacity:game.opt.debug_level>1 ? 1 : 0,
        container: pivot,
        color: 0x999999 + Math.random()* 0xffffff,
        origin: { x: this.depth*.65, y: 1,  z: game.opt.door_size*separator +extra },
        destination: { x: -this.depth*.65 , y: 1, z: game.opt.door_size*separator +extra }
    });


    var cellid = params.real_x=='outside' ? 'outside' : params.real_x*this.num_items_line + params.real_z;

    // Used by game enter detection.
    line.mazeid = this.id;
    line.cellid = cellid;
    cell.separation_lines.push(line);

    var action = '';
    line.walk_through_callback= callback;

    line.enter_leave_door = !!extra;

    return line;
};

Maze.prototype.restart = function()
{
    var self=this;
    var pos = this.get_start_pos();
    game.focus_perso.restart(pos);
    game.set_zoom_level(this.level.zoom_level);
};

Maze.prototype.getStaticObstacles = function()
{
    var obstacles = [this.walls_collision];
    if(this.doors)
    {
        for(var i in this.doors)
        {
            if(!this.doors[i].opened)
            {
                obstacles.push(this.doors[i].collision);
            }
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
Maze.prototype.getFriends = function()
{
    var obstacles=[];
    this.interraction_items.forEach(function(item)
    {
        if(item.friend && !item.is_dying)
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
        this.music.currentTime=0;
        this.ambient.currentTime=0;

        game.fadeinmusic(this.music, 'music_volume');
        game.fadeinmusic(this.ambient,'ambient_volume');
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
            this.set_mesh_orientation(this.close_mesh, this.level.start_cell.i);

            close_mesh1.position.x = cell.position.x;
            close_mesh1.position.y = cell.position.y;
            close_mesh1.position.z = cell.position.z;
            this.set_mesh_orientation(close_mesh1, this.level.start_cell.i);
        }
        game.set_zoom_level(this.level.zoom_level);
    }
    this.buildNext();
};

Maze.prototype.leave = function()
{
    game.fadeoutmusic(this.music);
    game.fadeoutmusic(this.ambient);
    this.stop_step();
    this.entered=false;
};

Maze.prototype.remove_interraction_item = function(item)
{
    var idx = this.interraction_items.indexOf(item);
    this.interraction_items.splice(idx, 1);
};

Maze.prototype.add_interraction_item = function(type,options, dropping)
{
    options.parentStructure = this;
    options.game = game;

    if(type.indexOf('key')!==-1)
    {
        type='Key';
    }
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
    if(!this.next_item)
    {
        game.level++;
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
    this.options.parent=null;
    this.next_item.options.parent = null;
    this.all_interraction_items.forEach(function(item)
    {
        item.remove();
    });
    game.scene.remove(this.level_text);
    game.scene.remove(this.container);
};
