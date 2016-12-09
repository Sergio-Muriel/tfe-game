var Common = function(game, options)
{
    this.default(options);
};

Common.prototype.default = function(options)
{
    this.deleted=false;
    this.id=game.getNewId();
    this.original_material_emissive=[];
    this.hover_material_emissive=[];

    this.is_hoverable=false;
    this.can_walk_through=true;
    this.is_static_collision=false;

    this.options=options;
};

Common.prototype.build =function()
{
    var self=this;
    
    this.container = new THREE.Object3D();
    game.scene.add(this.container);


    this.container.position.x = this.options.x;
    this.container.position.y = 0;
    this.container.position.z = this.options.z;
    this.container.rotation.y = this.options.rotate;

    var materials;
    if(this.hover_color)
    {
        var materials=[];
		game.assets.chest_mat.forEach(function(mat){
            materials.push(mat.clone());
        });
		for ( var i = 0; i < materials.length; i ++ ) {
			var m = materials[ i ];
            self.original_material_emissive[i] = m.emissive;
            self.hover_material_emissive[i] = new THREE.Color(m.emissive).add(new THREE.Color(this.hover_color));

			m.skinning = true;
			m.morphTargets = true;
		}
    }
    else
    {
        materials = this.object_material;
        for ( var i = 0; i < materials.length; i ++ ) {
            var m = materials[ i ];
            m.skinning = true;
            m.morphTargets = true;
        }
    }

    this.mesh = new THREE.SkinnedMesh( this.object_geo, new THREE.MultiMaterial(materials));
    if(this.scale)
    {
        this.mesh.scale.x=this.scale;
        this.mesh.scale.y=this.scale;
        this.mesh.scale.z=this.scale;
    }
    //this.mesh.rotation.y = Math.radians(Math.floor(Math.random()*180));

    this.mesh.geometry.computeBoundingBox();
    var bbox = this.mesh.geometry.boundingBox;

    var bbox_x = (bbox.max.x - bbox.min.x) * this.mesh.scale.x + 3;
    var bbox_y = (bbox.max.y - bbox.min.y) * this.mesh.scale.y + 3;
    var bbox_z = (bbox.max.z - bbox.min.z) * this.mesh.scale.z + 3;

    this.container.add(this.mesh);
    this.mesh.castShadow  = true;

    if(this.mesh_position)
    {
        this.mesh.position.x = this.mesh_position.x;
        this.mesh.position.y = this.mesh_position.y;
        this.mesh.position.z = this.mesh_position.z;
    }

    var cube_material = new THREE.MeshPhongMaterial( { color: 0xbbbbff, wireframe:true, visible: game.opt.debug_level>1 } );
    var cube_geo = new THREE.BoxGeometry(bbox_x, 10, bbox_z);
    this.container_mesh = new THREE.Mesh(cube_geo, cube_material);
    this.container_mesh.name=this.type || 'Common';
    this.container_mesh.object = this;
    this.container.add(this.container_mesh);


    this.mixer = new THREE.AnimationMixer( this.mesh );
    if(this.bind)
    {
        this.bind();
    }

    if(this.walk_through_callback)
    {
        this.container_mesh.walk_through_callback = this.walk_through_callback;
    }
};

Common.prototype.remove= function(callback)
{
    if(!this.deleted)
    {
        this.deleted=true;
        play_multiple(this.pick_sound);
        this.options.parentStructure.remove_interraction_item(this);
        game.scene.remove(this.container);
        if(callback)
        {
            callback();
        }
        game.updateCollisionsCache();
    }
}
Common.prototype.dropped=function()
{
    play_multiple(this.drop_sound);
};

Common.prototype.update = function(delta)
{
    this.mixer.update(delta);
};

Common.prototype.hover = function()
{
    var self=this;
    this.mesh.material.materials.forEach(function(material, i)
    {
        material.emissive = self.hover_material_emissive[i];
    });
};
Common.prototype.unhover = function()
{
    var self=this;
    this.mesh.material.materials.forEach(function(material, i)
    {
        material.emissive = self.original_material_emissive[i];
    });
};
