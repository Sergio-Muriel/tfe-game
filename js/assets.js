var Assets = function(opt)
{
    this.load_meshes = [];
    this.load_textures = [];
    this.load_sound = [];
    this.textures = [];

    this.current_loaded = 0;

    this.add=function(file, name)
    {
        this.load_meshes.push( { file: file, name: name});
    };

    this.load = function()
    {
        var self=this;

        this.add('js/meshes/wall.js','wall');
        this.add('js/meshes/wall1.js','wall1');
        this.add('js/meshes/smallwall1.js','smallwall1');
        this.add('blender/wall_with_window.json','wall_with_window');
        this.add('js/meshes/door.js','door');
        this.add('js/meshes/door1.js','door1');
        this.add('js/meshes/dooropen.js','dooropen');
        this.add('js/meshes/dooropen1.js','dooropen1');

        this.add('blender/pingu_with_armature.json','perso');
        this.add('blender/stick.json','stick');
        this.add('blender/hammer.json','hammer');
        this.add('blender/ennemy2_with_armature.json','ennemy');
        this.add('blender/key.json','key');
        this.add('blender/potion.json','potion');
        this.add('blender/chest.json','chest');
        this.add('blender/fish.json','fish');

        this.add_texture('textures/ice.jpg','path_wall');
        this.add_texture('textures/ice_bump.jpg','path_wall_bump');

        this.add_texture('textures/ice.jpg','cell_wall');
        this.add_texture('textures/ice_bump.jpg','cell_wall_bump');
        this.add_texture('textures/wood.jpg','cell_door');
        this.add_texture('textures/wood_bump.jpg','cell_door_bump');

        this.add_texture('textures/ice.jpg','path_floor');
        this.add_texture('textures/ice_bump.jpg','path_floor_bump');

        this.add_texture('textures/terre.jpg','maze_floor');
        this.add_texture('textures/terre_bump.jpg','maze_floor_bump');

        // Perso
        this.add_sound('sounds/step_floor.mp3','step_floor',true, 0.8);
        this.add_sound('sounds/step_snow.mp3','step_snow',true, 0.3);

        this.add_sound('sounds/miss.mp3','miss', false, 1);
        this.add_sound('sounds/die.mp3','die', false, 1);
        this.add_sound('sounds/hit.mp3','hit', false, 0.5);

        // Ennemys
        this.add_sound('sounds/ennemy_hit.mp3','ennemy_hit', false, 0.5);
        this.add_sound('sounds/ennemy_die.mp3','ennemy_die', false, 1);

        // Items
        this.add_sound('sounds/chest_open.mp3','chest_open', false, 0.3);
        this.add_sound('sounds/door_open.mp3','door_open', false, 0.5);
        this.add_sound('sounds/door_close.mp3','door_close', false, 1.0);

        this.add_sound('sounds/key_drop.mp3','key_drop', false, 1);
        this.add_sound('sounds/key_pick.mp3','key_pick', false, 1);

        this.add_sound('sounds/potion_drop.mp3','potion_drop', false, 0.8);
        this.add_sound('sounds/potion_pick.mp3','potion_pick', false, 0.5);

        this.add_sound('sounds/fish_drop.mp3','fish_drop', false, 0.2);
        this.add_sound('sounds/fish_drop.mp3','fish_pick', false, 0.2);

        this.add_sound('sounds/punch_attack.mp3','punch_attack', false, 0.4);

        this.add_sound('sounds/stick_attack.mp3','stick_attack', false, 0.4);
        this.add_sound('sounds/stick_drop.mp3','stick_drop', false, 0.2);
        this.add_sound('sounds/stick_pick.mp3','stick_pick', false, 0.2);

        this.add_sound('sounds/hammer_attack.mp3','hammer_attack', false, 0.4);
        this.add_sound('sounds/hammer_drop.mp3','hammer_drop', false, 0.2);
        this.add_sound('sounds/hammer_pick.mp3','hammer_pick', false, 0.2);

        this.add_sound('sounds/weapon_switch.mp3','weapon_switch', false, 1);

        // Music
        this.add_sound('sounds/music/path.mp3','path',true, 1);
        this.add_sound('sounds/music/maze.mp3','maze',true, 1);

        // Effects
        this.add_sound('sounds/ambient/blizzard.mp3','blizzard',true, 0);
        this.add_sound('sounds/ambient/cave.mp3','cave',true, 0);

        return this._load().then(this.loaded.bind(this));
    };
    this.loaded= function()
    {
        console.log('loaded', this);

        // transparent material
        this.transparent_material = new THREE.MeshPhongMaterial({ visible: false });

        // Add floor
        var path_floor_texture = game.assets.path_floor_texture;
        path_floor_texture.repeat.set(0.00001, 0.00001);
        var path_floor_bump_texture = game.assets.path_floor_bump_texture;
        path_floor_bump_texture.repeat.set(0.00001, 0.00001);

        this.outside_floor_material = new THREE.MeshPhongMaterial({
            bumpScale:0.5,
            color:0xffffff,
            map: path_floor_texture,
            bumpMap: path_floor_bump_texture
        });
        if(opt.debug_level>1)
        {
            this.outside_floor_material = new THREE.MeshPhongMaterial({ color:0x000000, visible: true});
        }


        // Maze floor
        var maze_floor_texture = game.assets.maze_floor_texture;
        maze_floor_texture.repeat.set(2,2);
        var maze_floor_bump_texture = game.assets.maze_floor_bump_texture;
        maze_floor_bump_texture.repeat.set(2,2);

        this.maze_floor_material = new THREE.MeshPhongMaterial({
            bumpScale:0.5,
            color:0xbbbbbb,
            shininess:1,
            map: maze_floor_texture,
            bumpMap: maze_floor_bump_texture
        });
        if(opt.debug_level>1)
        {
            this.maze_floor_material = new THREE.MeshPhongMaterial({ color:0x555555, visible: true});
        }

        // Maze cell wall
        var cell_wall_texture = game.assets.cell_wall_texture;
        cell_wall_texture.repeat.set(1,1);
        var cell_wall_bump_texture = game.assets.cell_wall_bump_texture;
        cell_wall_bump_texture.repeat.set(1,1);

        this.maze_wall_material = new THREE.MeshPhongMaterial({
            bumpScale:0.5,
            map: cell_wall_texture,
            shininess:0,
            transparent: false,
            opacity:1,
            bumpMap: cell_wall_bump_texture
        });

        var cell_door_texture = game.assets.cell_door_texture;
        cell_door_texture.repeat.set(10,10);
        var cell_door_bump_texture = game.assets.cell_door_bump_texture;
        cell_door_bump_texture.repeat.set(10,10);


        this.maze_door_material = new THREE.MeshPhongMaterial({
            bumpScale:0.5,
            map: cell_door_texture,
            transparent: true,
            shininess:0,
            opacity:1.0,
            bumpMap: cell_door_bump_texture
        });

        if(opt.debug_level>1)
        {
            this.maze_wall_material = new THREE.MeshPhongMaterial({ visible: true});
            this.maze_door_material = new THREE.MeshPhongMaterial({ visible: true});
        }

        // Path floor
        var path_floor_texture = game.assets.path_floor_texture;
        path_floor_texture.repeat.set(2,2);
        var path_floor_bump_texture = game.assets.path_floor_bump_texture;
        path_floor_bump_texture.repeat.set(2,2);

        this.path_floor_material = new THREE.MeshPhongMaterial({
            bumpScale:0.5,
            color:0x929ec4,
            map: path_floor_texture,
            bumpMap: path_floor_bump_texture
        });
        if(opt.debug_level>1)
        {
            this.path_floor_material = new THREE.MeshPhongMaterial({ color:0x555555, visible: true});
        }

        // Walls + doors
        var path_wall_texture = game.assets.path_wall_texture;
        path_wall_texture.repeat.set(1,1);
        var path_wall_bump_texture = game.assets.path_wall_bump_texture;
        path_wall_bump_texture.repeat.set(1,1);

        var cell_door_texture = game.assets.cell_door_texture;
        cell_door_texture.repeat.set(10,10);
        var cell_door_bump_texture = game.assets.cell_door_bump_texture;
        cell_door_bump_texture.repeat.set(10,10);

        game.assets.path_wall_material = new THREE.MeshPhongMaterial({
            bumpScale:0.5,
            color:0x929ec4,
            map: path_wall_texture,
            shininess:0,
            transparent: false,
            opacity:1,
            bumpMap: path_wall_bump_texture
        });

        game.assets.path_door_material = new THREE.MeshPhongMaterial({
            bumpScale:0.5,
            map: cell_door_texture,
            transparent: false,
            shininess:0,
            opacity:1.0,
            bumpMap: cell_door_bump_texture
        });
        if(opt.debug_level>1)
        {
            wall_material = new THREE.MeshPhongMaterial({ visible: true});
            door_material = new THREE.MeshPhongMaterial({ visible: true});
        }

        // create multi materials
        this.multi_wall_material = new THREE.MultiMaterial([game.assets.maze_wall_material, game.assets.maze_door_material]);
        this.multi_path_wall_material = new THREE.MultiMaterial([game.assets.path_wall_material, game.assets.path_door_material]);


    };

    this.total = function()
    {
        return this.load_meshes.length + this.load_textures.length + this.load_sound.length + 1;
    };

    this.current = function()
    {
        return this.current_loaded;
    };

    this.add_texture=function(file, name)
    {
        this.load_textures.push( { file: file, name: name});
    };
    this.add_sound=function(file, name, loop, volume)
    {
        this.load_sound.push( { file: file, name: name, loop:loop, volume: volume});
    };

    this._load = function()
    {
        var self=this;
        var promises=[];

        this.load_meshes.forEach(function(json)
        {
            promises.push(new Promise(function(ok, reject)
            {
                var loader = new THREE.JSONLoader();
                loader.load(json.file, function(geometry, mat)
                {
                    self.current_loaded++;
                    game.gui.update_loading(self.current(), self.total());
                    self[json.name+'_geo'] = geometry;
                    self[json.name+'_mat'] = mat;
                    ok();
                });
            }));
        });
        this.load_textures.forEach(function(json)
        {
            promises.push(new Promise(function(ok, reject)
            {
                var textureLoader = new THREE.TextureLoader();
                textureLoader.load(json.file, function(tex)
                {
                    self[json.name+'_texture']= tex;
                    self[json.name+'_texture'].wrapS = self[json.name+'_texture'].wrapT = THREE.RepeatWrapping;
                    self.current_loaded++;
                    game.gui.update_loading(self.current(), self.total());
                    ok();
                });
            }));
        });
        this.load_sound.forEach(function(json)
        {
            promises.push(new Promise(function(ok, reject)
            {
                self[json.name+'_sound'] = new Audio(json.file);
                self[json.name+'_sound'].load();
                self[json.name+'_sound'].loop=!!json.loop;
                self[json.name+'_sound'].volume=json.volume;
                self.current_loaded++;
                game.gui.update_loading(self.current(), self.total());
                ok();
            }));
        }); 

        promises.push(new Promise(function(ok, reject)
        {
            var loader = new THREE.FontLoader();
            loader.load('fonts/cabin_bold.json', function ( response ) {
                self.text_font = response;
                self.current_loaded++;
                game.gui.update_loading(self.current(), self.total());
                ok();
            });
        }));

        return Promise.all(promises);
    }

    this.getTexture = function(texture, bumpTexture)
    {
        if(!this.textures[texture+'_'+bumpTexture])
        {
            this.textures[texture+'_'+bumpTexture] = new THREE.MeshPhongMaterial({
                bumpScale:1,
                map: this[texture+'_texture'],
                bumpMap: this[bumpTexture+'_texture']
            });
        }
        return this.textures[texture+'_'+bumpTexture];
    }
};
