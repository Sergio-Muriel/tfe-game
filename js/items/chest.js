var Chest = function(game, options)
{
    this.deleted=false;

    var original_material_emissive=[];
    var hover_material_emissive=[];

    this.is_static_collision=true;
    this.can_walk_through=false;
    this.has_walk_through_callback=false;
    this.is_hoverable=true;

    this.build =function()
    {
        var self=this;
        this.options=options;

        this.container = new THREE.Object3D();
        this.container.rotation.y = options.rotate;
        game.scene.add(this.container);

        var cube_material = new THREE.MeshPhongMaterial( { color: 0xbbbbff, wireframe:true, visible: game.opt.debug_level>1 } );
        var cube_geo = new THREE.BoxGeometry(15 , 10, 10, 1, 1);
        this.container_mesh = new THREE.Mesh(cube_geo, cube_material);
        this.container_mesh.object = this;
        this.container_mesh.name='Chest';
        this.id=game.getNewId();
        this.container_mesh.position.y=8;
        this.container.add(this.container_mesh);

        this.container_mesh.callback = this.remove.bind(this, options.callback);

        this.container.position.x = options.x;
        this.container.position.y = 0;
        this.container.position.z = options.z;

        // Clone material to be able to change the texture
        var materials=[];
		game.assets.chest_mat.forEach(function(mat){
            materials.push(mat.clone());
        });
		for ( var i = 0; i < materials.length; i ++ ) {
			var m = materials[ i ];
            original_material_emissive[i] = m.emissive;
            hover_material_emissive[i] = new THREE.Color(m.emissive).add(new THREE.Color(0x330000));

			m.skinning = true;
			m.morphTargets = true;
		}
	
        this.mesh = new THREE.SkinnedMesh( game.assets.chest_geo, new THREE.MultiMaterial(materials));
        this.mesh.scale.x=3;
        this.mesh.scale.y=3;
        this.mesh.scale.z=3;
        this.container.add(this.mesh);
        this.mesh.receiveShadow  = true;
        this.mesh.castShadow  = true;

        this.mesh.position.x = 0;
        this.mesh.position.y = 10;
        this.mesh.position.z = 0;

        this.mixer = new THREE.AnimationMixer( this.mesh );

        this.openingClip = game.assets.chest_geo.animations[1];
        this.openedClip = game.assets.chest_geo.animations[2];

        this.open_action = this.mixer.clipAction(this.openingClip, null ).setDuration(1);
        this.open_action.setLoop(THREE.LoopOnce, 0);
        this.open_action.clampWhenFinished=true;
        this.open_action.setEffectiveWeight(1);

        this.opened_action = this.mixer.clipAction(this.openedClip, null ).setDuration(3);
        this.opened_action.setEffectiveWeight(0.1);
        this.opened_action.play();
        this.mixer.addEventListener('finished', this.end_attack.bind(this));

    };

    this.remove= function(callback)
    {
        if(!this.deleted)
        {
            this.deleted=true;
            game.scene.remove(this.container);
            if(callback)
            {
                callback();
            }
            game.updateCollisionsCache();
        }
    }

    this.update = function(delta)
    {
        this.mixer.update(delta);
    };

    this.hover = function()
    {
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
    this.untargeted = function(from)
    {
    };

    this.targeted = function(from)
    {
        if(!this.is_opened)
        {
            var distance = from.container.position.distanceTo(this.container.position);
            if(distance<from.open_range)
            {
                this.is_opened=true;
                this.is_hoverable=false;
                from.open();
                play_multiple(game.assets.chest_open_sound);
                game.updateCollisionsCache();
                this.open_action.play();
                window.setTimeout(this.drop.bind(this), 200);
                return true;
            }
        }
        return false;
    };

    this.drop = function()
    {
        var drops=[];
        var drop_weapon = Math.random()>0.5;

        if(drop_weapon)
        {
            var type = game.getRandomWeaponType(options.level);
            console.log('typeclass ',type);
            drops.push(
            {
                type: type,
                params:
                {
                    walk_through_callback: function(){},
                    type:type
                }
            });
        }

        game.drop({
            drops:drops,
            x: game.focus_perso.container.position.x,
            y:0,
            z:game.focus_perso.container.position.z
        });
    };
    this.end_attack = function()
    {
        console.log('end open chest');
    };
};

