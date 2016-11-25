var editor = document.getElementById('editor');

var selected_item=null;
var selected_hexagone=null;

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

document.getElementById('reset').addEventListener('click',function() { if(confirm('Are you sure you want to reset the map?')) { reset(); }}, false);
document.getElementById('edit_map').addEventListener('click',function() { mode='edit_map'; }, false);
document.getElementById('mark_end').addEventListener('click',function() { mode='mark_end'; }, false);
document.getElementById('add_ennemy').addEventListener('click',function() { mode='add_ennemy'; }, false);
document.getElementById('add_patrol_point').addEventListener('click',function() { mode='add_patrol_point'; }, false);
document.getElementById('save').addEventListener('click',save, false);
document.getElementById('load').addEventListener('click',load, false);
document.getElementById('rotate_moins').addEventListener('click',rotate.bind(this,10), false);
document.getElementById('rotate_plus').addEventListener('click',rotate.bind(this,-10), false);
document.getElementById('remove').addEventListener('click',remove, false);


var ennemy_id = 0;
var has_ennemy = false;
function update_ennemy_list()
{
    has_ennemy=false;
    var c = document.getElementById('ennemy_list');
    c.innerText='';
    var nodes = [...document.querySelectorAll('.ennemy')];
    nodes.forEach(function(node)
    {
        has_ennemy=true;
        var opt = document.createElement('option');
        opt.setAttribute('value', node.getAttribute('ennemy_id'));
        opt.innerText =  node.innerText;
        c.appendChild(opt);
    });
}

function reset()
{
    var nodes = [...document.querySelectorAll('.hexagone:not(.disabled)')];
    nodes.forEach(function(node)
    {
        if(node.getAttribute('row')!=="0" || node.getAttribute('line')!=="0")
        {
            node.classList.add('disabled');
            node.classList.remove('end_cell');
            node.innerText='';
        }
    });

}
function load(txt)
{
    if(txt || (txt=  prompt('Level string: ')))
    {
        try
        {
            reset();
            // Fix javascript parse format
            txt = txt.replace(/([^{}:",]+):/g,'"$1":')
            var data= JSON.parse(txt);

            if(data && data.outside_cells && data.end_cell)
            {
                // Load walls
                data.outside_cells.forEach(function(cell)
                {
                    var node = document.querySelector('.hexagone[row="'+cell.x+'"][line="'+cell.z+'"]');
                    node.classList.remove('disabled');
                });

                // Load end cell
                node = document.querySelector('.hexagone[row="'+data.end_cell.x+'"][line="'+data.end_cell.z+'"]');
                node.classList.add('end_cell');

                // Load ennemys + patrol points
                data.ennemys.forEach(function(ennemy)
                {
                    var ennemynode = document.querySelector('.hexagone[row="'+ennemy.x+'"][line="'+ennemy.z+'"]');
                    var e_id = self.add_ennemy(ennemynode, ennemy.top, ennemy.left, ennemy.rotation);
                    ennemy.patrol_positions.forEach(function(patrol)
                    {
                        var patrolnode = document.querySelector('.hexagone[row="'+patrol.x+'"][line="'+patrol.z+'"]');
                        self.add_patrol_point(patrolnode, e_id, patrol.top, patrol.left);
                    });
                });

            }
        }
        catch(err)
        {
            console.error('error loading ',txt, err, this);
            alert('Error parseing the level data : '+txt);
        }
    }
}

function save()
{
    var map =
    {
        outside_cells: [ ],
        ennemys: [],
        extracells: [ ],
        end_cell:  null
    };
    // Add outside cells
    var nodes = [...document.querySelectorAll('.hexagone:not(.disabled)')];
    nodes.forEach(function(node)
    {
        map.outside_cells.push({ x: node.getAttribute('row'), z: node.getAttribute('line') });
    });
    // Add end node
    var node = document.querySelector('.end_cell');
    map.end_cell = { x: node.getAttribute('row'), z: node.getAttribute('line') };

    // Add ennemys
    var nodes = [...document.querySelectorAll('.ennemy')];
    nodes.forEach(function(node)
    {
        var p = node.parentElement;
        var e_id = node.getAttribute('ennemy_id');
        var ennemy = 
        {
            x: p.getAttribute('row'),
            z: p.getAttribute('line'),
            top: node.getAttribute('top'),
            left: node.getAttribute('left'),
            patrol_positions : [],
            rotation: node.getAttribute('rotation'),
        };
        // Add patrol positions if any
        var patrols = [...document.querySelectorAll('.patrol_point[ennemy_id="'+e_id+'"]')];
        patrols.forEach(function(patrol)
        {
            var parent_patrol = patrol.parentElement;
            ennemy.patrol_positions.push(
            {
                x: parent_patrol.getAttribute('row'),
                z: parent_patrol.getAttribute('line'),
                top: node.getAttribute('top'),
                left: node.getAttribute('left'),
            });
        });
        map.ennemys.push(ennemy);
    });

    window.open('data:text/plain,'+JSON.stringify(map).replace(/"/g,''));

};

function toggle(h, line, row, e)
{
    console.log('toggle ',mode);
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
    else if(mode=='mark_end')
    {
        var nodes = [...document.querySelectorAll('.hexagone')];
        nodes.forEach(function(node)
        {
            node.classList.remove('end_cell');
        });
        h.classList.add('end_cell');
        h.classList.remove('disabled');
    }
    else if(mode=='add_ennemy')
    {
        if(h.classList.contains('disabled'))
        {
            return;
        }
        var editorLeft =  editor.offsetLeft;
        var editorTop =  editor.offsetTop;
        var left = ((e.pageX - h.offsetLeft - editorLeft ) / h.offsetWidth).toFixed(2);
        var top = ((e.pageY - h.offsetTop - editorTop ) / h.offsetHeight).toFixed(2);

        this.add_ennemy(h, top, left, 0);

        e.stopPropagation();
    }
    else if(mode=='add_patrol_point')
    {
        if(h.classList.contains('disabled') || !has_ennemy)
        {
            return;
        }

        var editorLeft =  editor.offsetLeft;
        var editorTop =  editor.offsetTop;
        var left = ((e.pageX - h.offsetLeft - editorLeft ) / h.offsetWidth).toFixed(2);
        var top = ((e.pageY - h.offsetTop - editorTop ) / h.offsetHeight).toFixed(2);

        var c = document.getElementById('ennemy_list');
        var e_id =  c.options[c.selectedIndex].value;

        self.add_patrol_point(h, e_id, top, left);

        e.stopPropagation();
    }
}

function add_patrol_point(h, e_id, top, left)
{
    var num = [...document.querySelectorAll('.patrol_point[ennemy_id="'+e_id+'"]')].length+1;
    var div = document.createElement('div');
    div.className='patrol_point';
    div.innerText='P.'+num;
    h.appendChild(div);


    div.setAttribute('rotation','0');
    div.setAttribute('left', left);
    div.setAttribute('ennemy_id', e_id);
    div.setAttribute('patrol_id', num);
    div.setAttribute('top', top);
    div.style.left=(left*100)+'%';
    div.style.top=(top*100)+'%';

    div.addEventListener('click', selectItem.bind(this, div, h), true);
    div.click();
    console.log('added patrol point');
}

function add_ennemy(h, top, left, rotation)
{
        ennemy_id++;

        var div = document.createElement('div');
        div.className='ennemy';
        div.setAttribute('ennemy_id', ennemy_id);
        div.innerText='E.'+(ennemy_id);
        h.appendChild(div);

        var editorLeft =  editor.offsetLeft;
        var editorTop =  editor.offsetTop;
        
        div.setAttribute('rotation',rotation);
        div.style.transform='rotate('+rotation+'deg)';
        div.setAttribute('left', left);
        div.setAttribute('top', top);
        div.style.left=(parseFloat(left)*100)+'%';
        div.style.top=(parseFloat(top)*100)+'%';

        div.addEventListener('click', selectItem.bind(this, div, h), true);
        div.click();
        update_ennemy_list();
        return ennemy_id;
}

function selectItem(div, hexagone, e)
{
    if(selected_item)
    {
        selected_item.classList.remove('selected');
    }
    selected_item=div;
    selected_item.classList.add('selected');

    selected_hexagone = hexagone;

    var nodes = [...document.querySelectorAll('.selected_item_action')];
    nodes.forEach(function(node)
    {
        node.removeAttribute('disabled');
    });
    if(selected_item.classList.contains('ennemy'))
    {
        var nodes = [...document.querySelectorAll('.ennemy_action')];
        nodes.forEach(function(node)
        {
            node.removeAttribute('disabled');
        });
    }

    e.stopPropagation();
}

function rotate(num,e)
{
    var rotation = parseInt(selected_item.getAttribute('rotation'),10);
    rotation+=num;

    selected_item.style.transform='rotate('+rotation+'deg)';
    selected_item.setAttribute('rotation',rotation);
    e.stopPropagation();
}

function remove(e)
{
    selected_item.parentElement.removeChild(selected_item);
    selected_item=null;
    selected_hexagone=null;

    var nodes = [...document.querySelectorAll('.selected_item_action, .ennemy_action')];
    nodes.forEach(function(node)
    {
        node.setAttribute('disabled','');
    });

    e.stopPropagation();
    update_ennemy_list();
}

var re = /load=(.*)/;
if(result = location.href.match(re))
{
    load(result[1]);
}
