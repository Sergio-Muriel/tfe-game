function draw_line(params)
{
    // Visualize path
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array( 2 * 3 ); // 3 vertices per point
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    drawCount = 2; // draw the first 2 points, only
    geometry.setDrawRange( 0, drawCount );
    var material = new THREE.MeshBasicMaterial( { color: params.color, transparent: true , visible: params.visible, opacity: params.opacity   });
    line = new THREE.Line( geometry,  material );

    params.container.add(line);
    var positions = line.geometry.attributes.position.array;
    positions[0]=params.origin.x;
    positions[1]=params.force_y || params.origin.y;
    positions[2]=params.origin.z;
    positions[3]=params.destination.x;
    positions[4]=params.force_y || params.destination.y;
    positions[5]=params.destination.z;

    return line;
}

function find_angle(A,B,C) {
    var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.z-A.z,2));    
    var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.z-C.z,2)); 
    var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.z-A.z,2));
    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB));
}

function  play_multiple(audio, delay)
{
    var new_audio= new Audio(audio.getAttribute('src'));
    new_audio.volume=audio.volume;
    if(delay)
    {
        window.setTimeout(new_audio.play.bind(new_audio), delay);
    }
    else
    {
        new_audio.play();
    }
}

function search_bone_name(name,childrens)
{
    var found=false;
    while(!found && childrens.length>0)
    {
        var child = childrens.pop();
        if(child.name==name)
        {
            return child;
        }
        childrens = childrens.concat(child.children);
    }
}

get_attack_value = function(attack_object, defense_object)
{
    var damage=0;
    var is_hit = Math.random() < attack_object.weapon_hit_chance;
    if(is_hit)
    {
        var quota = Math.random()*0.5+0.5;
        quota -=  defense_object.weapon_defense;
        damage = Math.ceil(quota*attack_object.weapon_attack_damage);
    }
    return Math.max(0,damage);
};

function throttle(fn, threshhold, scope) {
  threshhold || (threshhold = 250);
  var last,
      deferTimer;
  return function () {
    var context = scope || this;

    var now = +new Date,
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

