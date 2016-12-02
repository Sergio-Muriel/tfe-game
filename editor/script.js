var editor = document.getElementById('editor');

var selected_item=null;
var moving_item = null;
var moving_hexa = null;

var objects={
    'add_ennemy' : 'Ennemy',

    'add_stick' : 'Stick',
    'add_hammer' : 'Hammer',
    'add_potion' : 'Potion',
    'add_chest' : 'Chest'
};
var hidden_fields =
[
    'style',
    'type',
    'class',
    'object_id',
    'patrol_id'
];

        document.addEventListener('mousemove', function(e)
        {
            if(moving_item)
            {
                var pos = get_pos(e, moving_hexa);
                update_pos(moving_item, pos);
                console.log('mouse move');
            }
        });
        document.addEventListener('mouseup', function()
        {
            moving_item=null;
            moving_hexa=null;
        });


var levels_container = document.getElementById('levels');
// Build load levels list
Levels.forEach(function(level, num)
{
    var opt = document.createElement('option');
    opt.setAttribute('value',num);
    opt.innerText= 'Level '+(num+1);
    levels_container.appendChild(opt);
});

for(var line=0; line<30; line++)
{
    var l = document.createElement('div');
    l.className='line '+(line%2 ? 'line-impair' : '');

    for(var row=0; row<30; row++)
    {
        var real_row = line%2===0 ? row*2  : row*2+1;
        var real_line = Math.floor(line/2);

        var h = document.createElement('div');
        h.className='hexagone '+(line==0 && row==0 ? 'start_cell' : 'disabled');
        h.setAttribute('line',real_line);
        h.setAttribute('row',real_row);
        h.addEventListener('click',toggle.bind(this,h, real_line, real_row), false);
        l.appendChild(h);
    }
    editor.appendChild(l);

}


var mode='edit_map';
var mode_param=null;

document.getElementById('new').addEventListener('click',function() { if(confirm('Are you sure you want to create a new map?')) { create_new(); }}, false);
document.getElementById('reset').addEventListener('click',function() { if(confirm('Are you sure you want to reset the map?')) { reset(); }}, false);
document.getElementById('edit_map').addEventListener('click',toggle_mode.bind(this,'edit_map'), false);
document.getElementById('wall_properties').addEventListener('click',toggle_mode.bind(this,'wall_properties'), false);
document.getElementById('mark_end').addEventListener('click',toggle_mode.bind(this,'mark_end'), false);
document.getElementById('mark_next').addEventListener('click',toggle_mode.bind(this,'mark_next'), false);
document.getElementById('add_object').addEventListener('click',add_object_toggle, false);
document.getElementById('save').addEventListener('click',save, false);
document.getElementById('load').addEventListener('click',load, false);
document.getElementById('remove').addEventListener('click',remove, false);


var chest_id = 0;
var object_id = 0;
var has_ennemy = false;

function toggle_mode(_mode)
{
    var container = document.getElementById('edit_item');
    container.innerText='';

    mode = _mode;
    var nodes = Array.prototype.slice.call(document.querySelectorAll('.mode'));
    nodes.forEach(function(node)
    {
        if(node.id.indexOf(_mode)===-1)
        {
            node.classList.remove('selected');
        }
        else
        {
            node.classList.add('selected');
        }
    });

}
function add_object_toggle()
{
    var c = document.getElementById('object_list');
    var add_type =  c.options[c.selectedIndex].value;

    var regex = new RegExp('add_patrol_point_(\\d+)');
    var result;
    if(result = add_type.match(regex))
    {
        console.log('set mode ad_patrol point');
        toggle_mode('add_patrol_point');
        mode_param = result[1];
    }
    else
    {
        toggle_mode(add_type);
    }
    console.log('add type ',add_type);
}

function update_lists()
{
    has_ennemy=false;
    var object_list = document.getElementById('object_list');

    object_list.innerText='';
    var nodes = Array.prototype.slice.call(document.querySelectorAll('.ennemy'));

    var opt;
    for(var key in objects)
    {
        opt = document.createElement('option');
        opt.setAttribute('value', key);
        opt.innerText =  objects[key];
        object_list.appendChild(opt);
        if(mode==key) { opt.setAttribute('selected',true) }
    }

    nodes.forEach(function(node)
    {
        has_ennemy=true;
        opt = document.createElement('option');
        var key = 'add_patrol_point_'+node.getAttribute('object_id');
        opt.setAttribute('value', key);
        opt.innerText =  'Patrol point - Ennemy '+node.getAttribute('object_id');
        object_list.appendChild(opt);
        if(mode==key) { opt.setAttribute('add_patrol_point',true) }
    });
}

function create_new()
{
    reset();
    var num = levels_container.options.length;
    var opt = document.createElement('option');
    opt.setAttribute('value',num);
    opt.innerText= 'Level '+(num+1);
    levels_container.appendChild(opt);
    levels_container.selectedIndex = num;
}

function reset()
{
    object_id=0;
    var list = document.querySelectorAll('.hexagone');
    var nodes = Array.prototype.slice.call(list);
    nodes.forEach(function(node)
    {
        if(node.getAttribute('row')!=="0" || node.getAttribute('line')!=="0")
        {
            node.classList.add('disabled');
            node.classList.remove('end_cell');
            node.classList.remove('next_maze');
            node.innerText='';
        }
    });

}
function load()
{
    var data = Levels[levels_container.options[levels_container.selectedIndex].value];

    if(data)
    {
        reset();

        var c = document.getElementById('level_type');
        var level_type =  c.options[c.selectedIndex].value;
        switch(data.type)
        {
            case 'outside':  c.selectedIndex=0; break;
            case 'indoor':  c.selectedIndex=1; break;
        }

        if(data && data.cells)
        {
            // Load walls
            data.cells.forEach(function(cell)
            {
                var node = document.querySelector('.hexagone[row="'+cell.x+'"][line="'+cell.z+'"]');
                node.classList.remove('disabled');

                if(cell.walls)
                {
                    // Load wall types
                    cell.walls.forEach(function(wall)
                    {
                        add_walltype(node, wall.i,  wall.type);
                    });
                }
            });


            // Load end cell
            node = document.querySelector('.hexagone[row="'+data.end_cell.x+'"][line="'+data.end_cell.z+'"]');
            node.classList.add('end_cell');
            if(data.next_maze)
            {
                node = document.querySelector('.hexagone[row="'+data.next_maze.x+'"][line="'+data.next_maze.z+'"]');
                node.classList.add('next_maze');
            }

            // Load ennemys + patrol points
            data.ennemys.forEach(function(ennemy)
            {
                var ennemynode = document.querySelector('.hexagone[row="'+ennemy.x+'"][line="'+ennemy.z+'"]');
                var e_id = self.add_object('ennemy',ennemynode, ennemy);
                ennemy.patrol_positions.forEach(function(patrol)
                {
                    var patrolnode = document.querySelector('.hexagone[row="'+patrol.x+'"][line="'+patrol.z+'"]');
                    self.add_patrol_point(patrolnode, e_id, patrol.top, patrol.left);
                });
            });

            // Add other objects
            for (var key in objects)
            {
                var type = key.replace('add_','');
                if(type!='ennemy')
                {
                    // Load chests
                    if(data[type])
                    {
                        data[type].forEach(function(object)
                        {
                            var objectnode = document.querySelector('.hexagone[row="'+object.x+'"][line="'+object.z+'"]');
                            self.add_object(type,objectnode, object);
                        });
                    }
                }
            }

        }
    }
    else
    {
        alert('No level selected');
    }
}

function save()
{
    var c = document.getElementById('level_type');
    var level_type =  c.options[c.selectedIndex].value;

    var map =
    {
        type:  level_type,
        cells: [ ],
        ennemys: [],
        extrawalls: [ ],
        end_cell:  null,
        next_maze:  null
    };
    // Add outside cells
    var nodes = Array.prototype.slice.call(document.querySelectorAll('.hexagone:not(.disabled)'));
    nodes.forEach(function(node)
    {
        var item = { x: parseInt(node.getAttribute('row'),10), z: parseInt(node.getAttribute('line'),10), walls: [] };

        // Add extra walls
        var subnodes = Array.prototype.slice.call(node.querySelectorAll('.walltype'));
        subnodes.forEach(function(node)
        {
            var p = node.parentElement;
            item.walls.push({ type:parseInt(node.getAttribute('type'),10), i:parseInt(node.getAttribute('i'),10) });
        });
        map.cells.push(item);
    });



    // Add end node
    var node = document.querySelector('.end_cell');
    if(!node){
        alert('Error: no end cell marked');
        return;
    }
    map.end_cell = { x: parseInt(node.getAttribute('row'),10), z: parseInt(node.getAttribute('line'),10) };

    node = document.querySelector('.next_maze');
    if(!node){
        alert('Error: no next cell marked');
        return;
    }
    map.next_maze = { x: parseInt(node.getAttribute('row'),10), z: parseInt(node.getAttribute('line'),10) };

    // Add ennemys
    var nodes = Array.prototype.slice.call(document.querySelectorAll('.ennemy'));
    nodes.forEach(function(node)
    {
        var p = node.parentElement;
        var e_id = node.getAttribute('object_id');
        var ennemy = 
        {
            x: parseInt(p.getAttribute('row'),10),
            z: parseInt(p.getAttribute('line'),10),
            top: parseFloat(node.getAttribute('top')),
            left: parseFloat(node.getAttribute('left')),
            patrol_positions : [],
            patrol_loop : node.getAttribute('patrol_loop'),
            patrol_wait : parseInt(node.getAttribute('patrol_wait'),10),
            drops : node.getAttribute('drops'),
            rotation: parseInt(node.getAttribute('rotation')),
        };
        var search=1;
        var found=true;
        while(found)
        {
            // Add patrol positions if any
            var patrols = Array.prototype.slice.call(document.querySelectorAll('.patrol_point[object_id="'+e_id+'"][patrol_id="'+search+'"'));
            patrols.forEach(function(patrol)
            {
                var parent_patrol = patrol.parentElement;
                ennemy.patrol_positions.push(
                {
                    x: parseInt(parent_patrol.getAttribute('row'),10),
                    z: parseInt(parent_patrol.getAttribute('line'),10),
                    top: parseFloat(patrol.getAttribute('top')),
                    left: parseFloat(patrol.getAttribute('left')),
                });
            });
            found = patrols.length;
            search++;
        }
        map.ennemys.push(ennemy);
    });

    for (var key in objects)
    {
        var type = key.replace('add_','');
        if(type!='ennemy')
        {
            // Add type (chest/potion/etc)
            var nodes = Array.prototype.slice.call(document.querySelectorAll('.'+type));
            nodes.forEach(function(node)
            {
                var p = node.parentElement;
                var c_id = node.getAttribute('object_id');
                var attributes = Array.prototype.slice.call(node.attributes);
                var obj = 
                {
                    x: parseInt(p.getAttribute('row'),10),
                    z: parseInt(p.getAttribute('line'),10),
                    top: parseFloat(node.getAttribute('top')),
                    left: parseFloat(node.getAttribute('left')),
                    rotation: parseInt(node.getAttribute('rotation')),
                };
                attributes.forEach(function(attribute)
                {
                    if(hidden_fields.indexOf(attribute.name)===-1)
                    {
                        if(attribute.name!='left' && attribute.name!='top' && attribute.name!='row' && attribute.name!='line')
                        {
                            obj[attribute.name] = attribute.value
                        }
                    }
                });
                if(!map[type]) { map[type]=  []; }
                map[type].push(obj);
            });
        }
    }

    Levels[levels_container.options[levels_container.selectedIndex].value] =  map;

    var link = document.createElement('a');
    link.download = 'levels.js';
    link.href = 'data:text/plain,var Levels = '+JSON.stringify(Levels, null , '\t');
    link.innerText='Download';
    document.body.appendChild(link);
    link.click();
};

function toggle(h, line, row, e)
{
    if(mode=='edit_map')
    {
        if(h.classList.contains('disabled'))
        {
            h.classList.remove('disabled');
        }
        else
        {
            var row = h.getAttribute('row');
            var line = h.getAttribute('line');
            if(!h.classList.contains('end_cell') && (row!='0' || line!='0'))
            {
                h.classList.add('disabled');
            }
        }
    }
    else if(mode=='wall_properties')
    {
        build_form_wall(h);
    }
    else if(mode=='mark_end')
    {
        var nodes = Array.prototype.slice.call(document.querySelectorAll('.hexagone'));
        nodes.forEach(function(node)
        {
            node.classList.remove('end_cell');
        });
        h.classList.add('end_cell');
        h.classList.remove('disabled');
    }
    else if(mode=='mark_next')
    {
        var nodes = Array.prototype.slice.call(document.querySelectorAll('.hexagone'));
        nodes.forEach(function(node)
        {
            node.classList.remove('next_maze');
        });
        h.classList.add('next_maze');
        h.classList.add('disabled');
    }
    else if(mode=='add_patrol_point')
    {
        if(h.classList.contains('disabled') || !has_ennemy) { return; }
        var pos = get_pos(e,h);
        self.add_patrol_point(h, mode_param, pos.top, pos.left);
        e.stopPropagation();
    }
    else if(mode=='add_ennemy')
    {
        if(h.classList.contains('disabled')) { return; }
        var pos = get_pos(e,h);
        this.add_ennemy(h, { top: pos.top, left:pos.left, rotation:0, patrol_loop: true, drops:'', patrol_wait: 2000});
        e.stopPropagation();
    }

    else if(mode=='add_chest')
    {
        if(h.classList.contains('disabled')) { return; }
        var pos = get_pos(e,h);
        this.add_object('chest',h, { top: pos.top, left:pos.left, rotation:0, drops:''});
        e.stopPropagation();
    }
    else
    {
        if(h.classList.contains('disabled')) { return; }
        var pos = get_pos(e,h);
        this.add_object(mode.replace('add_',''),h, { top: pos.top, left:pos.left, rotation:0 });
        e.stopPropagation();
    }

}

function add_patrol_point(h, e_id, top, left)
{
    var num = Array.prototype.slice.call(document.querySelectorAll('.patrol_point[object_id="'+e_id+'"]')).length+1;
    var div = document.createElement('div');
    div.className='patrol_point selectable_item';
    div.setAttribute('type','patrol_point');
    div.innerText=e_id+'-'+num;
    h.appendChild(div);

    div.addEventListener('mousedown', function()
    {
        moving_item=div;
        moving_hexa=h;
    });

    div.setAttribute('left', left);
    div.setAttribute('object_id', e_id);
    div.setAttribute('patrol_id', num);
    div.setAttribute('top', top);
    div.style.left=(left*100)+'%';
    div.style.top=(top*100)+'%';

    div.addEventListener('click', selectItem.bind(this, div, h), true);
    div.click();
}

function get_pos(e, h)
{
        var editorLeft =  editor.offsetLeft;
        var editorTop =  editor.offsetTop;
        var left = ((e.pageX - h.offsetLeft - editorLeft ) / h.offsetWidth).toFixed(2);
        var top = ((e.pageY - h.offsetTop - editorTop ) / h.offsetHeight).toFixed(2);
        if(left<0) {  
            left = ((e.pageX - h.offsetLeft ) / h.offsetWidth).toFixed(2); 
            top = ((e.pageY - h.offsetTop ) / h.offsetHeight).toFixed(2);
        }
    return { top: top, left: left};
}
function update_pos(div, params)
{
    div.setAttribute('left', params.left);
    div.setAttribute('top', params.top);
    div.style.left=(parseFloat(params.left)*100)+'%';
    div.style.top=(parseFloat(params.top)*100)+'%';

}


function add_object(type,h, params)
{
        object_id++;

        var div = document.createElement('div');
        div.className=type+' object selectable_item';
        div.setAttribute('type',type);
        div.setAttribute('object_id', object_id);
        div.innerText=object_id;
        h.appendChild(div);

        div.addEventListener('mousedown', function()
        {
            moving_item=div;
            moving_hexa=h;
        });

        div.setAttribute('rotation',params.rotation);
        div.style.transform='rotate('+params.rotation+'deg)';
        for(var param in params)
        {
            if(param!='left' && param!='top' && param!='rotation')
            {
                console.log('set ',param , params[param]);
                div.setAttribute(param, params[param]);
            }
        }
        update_pos(div, params);

        div.addEventListener('click', selectItem.bind(this, div, h), true);
        div.click();
        update_lists();
        return object_id;
}


function selectItem(div, hexagone, e)
{
    if(selected_item)
    {
        selected_item.classList.remove('selected');
    }
    selected_item=div;
    selected_item.classList.add('selected');

    var nodes = Array.prototype.slice.call(document.querySelectorAll('.selected_item_action'));
    nodes.forEach(function(node)
    {
        node.removeAttribute('disabled');
    });
    if(selected_item.classList.contains('ennemy'))
    {
        var nodes = Array.prototype.slice.call(document.querySelectorAll('.ennemy_action'));
        nodes.forEach(function(node)
        {
            node.removeAttribute('disabled');
        });
    }
    this.build_form_item();

    e.stopPropagation();
}

function build_form_item()
{
    var container = document.getElementById('edit_item');
    var attributes = Array.prototype.slice.call(selected_item.attributes);
    container.innerText='Type '+selected_item.getAttribute('type');
    attributes.forEach(function(attribute)
    {
        if(hidden_fields.indexOf(attribute.name)===-1)
        {
            var div =document.createElement('div');
            var type='text';
            var extra='';
            if(attribute.value=='true' || attribute.value=='false')
            {
                type='checkbox';
            }
            switch(attribute.name)
            {
                case 'rotation': type = 'range'; extra='min="0" max="360"'; break; 
                case 'left':
                case 'top': 
                    type = 'range'; extra='min="0" max="1" step="0.01"'; break; 
            };
            div.innerHTML='<label>'+attribute.name+'</label><input '+extra+' type="'+type+'" name="'+attribute.name+'" value="'+attribute.value+'" />';
            container.appendChild(div);
        }
    });
    Array.prototype.slice.call(document.querySelectorAll('#edit_item input')).forEach(function(input)
    {
        input.addEventListener('submit', edit_submit);
        input.addEventListener('keyup', edit_submit);
        input.addEventListener('input', edit_submit);
        input.addEventListener('click', edit_submit);
    });
}

function build_form_wall(h)
{
    var container = document.getElementById('edit_item');
    container.innerText='';

    var div = document.createElement('div');
    div.className='wall_editor';
    for(var i=0; i< 6; i++)
    {
        var current = h.querySelector('.type'+i);
        var selectedIndex=0;
        if(current)
        {
            selectedIndex = current.getAttribute('type');
        }
        div.innerHTML+='<select class="type'+i+'" line="'+h.getAttribute('line')+'" row="'+h.getAttribute('row')+'">'+
                '<option '+(selectedIndex=='0' ? 'selected': '')+' value="">None</option>'+
                '<option '+(selectedIndex=='1' ? 'selected': '')+' value="1">Small wall</option>'+
                '<option '+(selectedIndex=='2' ? 'selected': '')+' value="2">Wall</option>'+
                '<option '+(selectedIndex=='3' ? 'selected': '')+' value="3">Opened</option>'+
                '<option '+(selectedIndex=='4' ? 'selected': '')+' value="4">Door</option>'+
            '</select>';
    }
    container.appendChild(div);

    Array.prototype.slice.call(document.querySelectorAll('#edit_item select')).forEach(function(select)
    {
        select.addEventListener('submit', edit_wall);
        select.addEventListener('keyup', edit_wall);
        select.addEventListener('input', edit_wall);
        select.addEventListener('click', edit_wall);
    });
}

function edit_wall()
{
    var select = document.querySelector('#edit_item select');
    var node = document.querySelector('.hexagone[row="'+select.getAttribute('row')+'"][line="'+select.getAttribute('line')+'"]');

    Array.prototype.slice.call(node.querySelectorAll('.smallwall,.wall,.opened,.door')).forEach(function(wall)
    {
        wall.parentElement.removeChild(wall);
    });
    for(var i=0; i< 6; i++)
    {
        select = document.querySelector('#edit_item .type'+i);
        add_walltype(node, i, select.value);
    }
}

function add_walltype(node,i,type)
{
    if(type!='0')
    {
        var wall =  document.createElement('div');
        var classname='';
        switch(type+'')
        {
            case '1': classname = 'smallwall'; break;
            case '2': classname = 'wall'; break;
            case '3': classname = 'opened'; break;
            case '4': classname = 'door'; break;
        }
        if(classname)
        {
            wall.setAttribute('type', type);
            wall.setAttribute('i', i);
            wall.className=classname+' walltype type'+i;

            // If door
            if(type=='4')
            {
                var key = node.getAttribute('row')+'-'+node.getAttribute('line')+'-'+i;
                wall.innerHTML='<span>key'+key+'</span>';
            }
            node.appendChild(wall);
        }
    }
}

function remove(e)
{
    if(!selected_item)
    {
        return false;
    }
    selected_item.parentElement.removeChild(selected_item);
    selected_item=null;

    e.stopPropagation();
    update_lists();
}

function edit_submit()
{
    Array.prototype.slice.call(document.querySelectorAll('#edit_item input')).forEach(function(input)
    {
        if(input.type=='checkbox')
        {
            selected_item.setAttribute(input.name,(!!input.checked)+'');
        }
        else
        {
            selected_item.setAttribute(input.name,input.value);
        }
        // Update style
        if(input.name=='left')
        {
            selected_item.style.left = (parseFloat(input.value)*100)+'%';
        }
        if(input.name=='top')
        {
            selected_item.style.top = (parseFloat(input.value)*100)+'%';
        }
        if(input.name=='rotation')
        {
            selected_item.style.transform='rotate('+input.value+'deg)';
        }
    });
}

