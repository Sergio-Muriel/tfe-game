var Fish = function(game, options)
{
    this.deleted=false;

    this.is_hoverable=false;
    this.can_walk_through=true;
    this.has_walk_through_callback=true;
    this.is_static_collision=false;

    this.increase_life_value = 10;

    this.build =function()
    {
        var self=this;
        this.options=options;
        this.container = new THREE.Object3D();
        game.scene.add(this.container);

        var cube_material = new THREE.MeshPhongMaterial( { color: 0xbbbbff, wireframe:true, visible: game.opt.debug_level>1 } );
        var cube_geo = new THREE.BoxGeometry(6 , 6, 6);
        this.container_mesh = new THREE.Mesh(cube_geo, cube_material);
        this.container_mesh.name='Fish';
        this.id=game.getNewId();
        this.container_mesh.position.y=0;
        this.container_mesh.rotation.x = Math.radians(90);
        this.container_mesh.rotation.z = Math.radians(45);
        this.container.add(this.container_mesh);

        this.container_mesh.walk_through_callback = this.remove.bind(this, options.walk_through_callback);

        this.container.position.x = options.x;
        this.container.position.y = 0;
        this.container.position.z = options.z;


		var materials = game.assets.fish_mat;
		for ( var i = 0; i < materials.length; i ++ ) {
			var m = materials[ i ];
			m.skinning = true;
			m.morphTargets = true;
		}
	
        this.mesh = new THREE.SkinnedMesh( game.assets.fish_geo, new THREE.MultiMaterial(materials));
        this.mesh.scale.x=2;
        this.mesh.scale.y=2;
        this.mesh.scale.z=2;
        this.container.add(this.mesh);
        this.mesh.castShadow  = true;

        this.mesh.position.x = 0;
        this.mesh.position.y = 0;
        this.mesh.position.z = 0;

        this.mixer = new THREE.AnimationMixer( this.mesh );

        this.rotatingClip = game.assets.fish_geo.animations[1];
        this.rotate_action = this.mixer.clipAction(this.rotatingClip, null ).setDuration(2);
        this.rotate_action.play();
        this.rotate_action.setEffectiveWeight(1);
    };

    this.remove= function(callback)
    {
        if(!this.deleted)
        {
            this.deleted=true;
            play_multiple(game.assets.fish_pick_sound);
            game.focus_perso.increase_life_value(this.increase_life_value);
            this.options.parentStructure.remove_interraction_item(this);
            game.scene.remove(this.container);
            if(callback)
            {
                callback();
            }
            game.updateCollisionsCache();
        }
    }
    this.dropped=function()
    {
        play_multiple(game.assets.fish_drop_sound);
    };

    this.update = function(delta)
    {
        this.mixer.update(delta);
    };
};
