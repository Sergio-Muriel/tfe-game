var Stick = function(game, options)
{
    this.deleted=false;

    this.is_hoverable=true;
    this.can_walk_through=true;
    this.has_walk_through_callback=false;
    this.is_static_collision=false;

    this.weapon_speed=0.5;
    this.weapon_range = 15;
    this.weapon_attack_damage = 5;
    this.weapon_hit_chance = 0.9;

    this.weapon_defense = 0.5;

    this.increase_life_value = 10;

    var hover_material_emissive=[];
    var original_material_emissive=[];

    this.build =function()
    {
        var self=this;
        this.options=options;
        this.container = new THREE.Object3D();
        game.scene.add(this.container);

        var cube_material = new THREE.MeshPhongMaterial( { color: 0xbbbbff, wireframe:true, visible: game.opt.debug_level>1 } );
        var cube_geo = new THREE.BoxGeometry(20 , 10, 10);
        this.container_mesh = new THREE.Mesh(cube_geo, cube_material);
        this.container_mesh.name='Stick';
        this.container_mesh.object = this;
        this.id=game.getNewId();
        this.container_mesh.position.y=0;
        this.container_mesh.rotation.x = Math.radians(0);
        this.container_mesh.rotation.y = Math.radians(Math.floor(Math.random()*180));
        this.container.add(this.container_mesh);

        this.container.position.x = options.x;
        this.container.position.y = 0;
        this.container.position.z = options.z;


		var materials = [];
		for ( var i = 0; i < game.assets.stick_mat.length; i ++ ) {
			var m = game.assets.stick_mat[ i ].clone();
			m.skinning = true;
			m.morphTargets = true;
            materials.push(m);

            hover_material_emissive[i] = new THREE.Color(m.emissive).add(new THREE.Color(0x330000));
            original_material_emissive[i] = m.emissive;
		}
	
        this.mesh = new THREE.SkinnedMesh( game.assets.stick_geo, new THREE.MultiMaterial(materials));
        this.mesh.scale.x=5;
        this.mesh.scale.y=5;
        this.mesh.scale.z=5;
        this.mesh.rotation.x = Math.radians(90);
        this.mesh.rotation.y = Math.radians(0);
        this.mesh.rotation.z = Math.radians(90);
        this.container_mesh.add(this.mesh);
        this.mesh.castShadow  = true;

        this.mesh.position.x = 10;
        this.mesh.position.y = 10;
        this.mesh.position.z = 0;
    };

    this.targeted= function(from)
    {
        if(!this.deleted)
        {
            var distance = from.container.position.distanceTo(this.container.position);
            if(distance<from.open_range)
            {
                this.remove();
                console.log('stick picked');
                game.gui.add_weapon('stick');
                play_multiple(game.assets.stick_pick_sound);
            }
        }
    };
    this.remove = function()
    {
        this.deleted=true;
        this.options.parentStructure.remove_interraction_item(this);
        game.scene.remove(this.container);
        game.updateCollisionsCache();
    };


    this.untargeted = function(from)
    {
    };

    this.dropped=function()
    {
        play_multiple(game.assets.stick_drop_sound);
    };

    this.hover = function()
    {
        console.log('hover stick!');
        this.mesh.material.materials.forEach(function(material, i)
        {
            material.emissive = hover_material_emissive[i];
        });
    };
    this.unhover = function()
    {
        this.mesh.material.materials.forEach(function(material, i)
        {
            material.emissive = original_material_emissive[i];
        });
    };

    this.update = function(delta)
    {
    };
};

