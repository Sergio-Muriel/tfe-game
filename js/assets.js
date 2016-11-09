var Assets = function()
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
        this.add('js/meshes/wall.js','wall');
        this.add('js/meshes/wall1.js','wall1');
        this.add('blender/wall_with_window.json','wall_with_window');
        this.add('js/meshes/door.js','door');
        this.add('js/meshes/door1.js','door1');
        this.add('js/meshes/dooropen.js','dooropen');
        this.add('js/meshes/dooropen1.js','dooropen1');

        this.add('blender/pingu_with_armature.json','perso');
        this.add('blender/stick.json','stick');
        this.add('blender/hammer.json','hammer');
        this.add('blender/ennemy.json','ennemy');
        this.add('blender/key.json','key');
        this.add('blender/potion.json','potion');
        this.add('blender/chest.json','chest');

        this.add('blender/city.json','city');

        this.add_texture('textures/path_wall.jpg','path_wall');
        this.add_texture('textures/path_wall_bump.jpg','path_wall_bump');

        this.add_texture('textures/wall.jpg','cell_wall');
        this.add_texture('textures/path_wall_bump.jpg','cell_wall_bump');
        this.add_texture('textures/wood.jpg','cell_door');
        this.add_texture('textures/wood_bump.jpg','cell_door_bump');

        this.add_texture('textures/snow.jpg','path_floor');
        this.add_texture('textures/snow_bmap.jpg','path_floor_bump');

        this.add_texture('textures/terre.jpg','maze_floor');
        this.add_texture('textures/terre_bump.jpg','maze_floor_bump');

        // Perso
        this.add_sound('sounds/step_floor.mp3','step',true, 0.5);
        this.add_sound('sounds/miss.mp3','miss', false, 1);
        this.add_sound('sounds/die.mp3','die', false, 1);
        this.add_sound('sounds/hit.mp3','hit', false, 0.5);

        // Ennemys
        this.add_sound('sounds/ennemy_hit.mp3','ennemy_hit', false, 0.5);
        this.add_sound('sounds/ennemy_die.mp3','ennemy_die', false, 1);

        // Items
        this.add_sound('sounds/chest_open.mp3','chest_open', false, 0.3);
        this.add_sound('sounds/door_open.mp3','door_open', false, 0.5);

        this.add_sound('sounds/key_drop.mp3','key_drop', false, 1);
        this.add_sound('sounds/key_pick.mp3','key_pick', false, 1);

        this.add_sound('sounds/potion_drop.mp3','potion_drop', false, 0.8);
        this.add_sound('sounds/potion_pick.mp3','potion_pick', false, 0.5);

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
        this.add_sound('sounds/music/city.mp3','city',true, 1);




        return this._load();
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
