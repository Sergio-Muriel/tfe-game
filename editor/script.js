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
document.getElementById('save').addEventListener('click',save, false);
document.getElementById('load').addEventListener('click',load, false);
document.getElementById('rotate_moins').addEventListener('click',rotate.bind(this,10), false);
document.getElementById('rotate_plus').addEventListener('click',rotate.bind(this,-10), false);
document.getElementById('remove').addEventListener('click',remove, false);

function reset()
{
    var nodes = [...document.querySelectorAll('.hexagone:not(.disabled)')];
    nodes.forEach(function(node)
    {
        if(node.getAttribute('row')!=="0" || node.getAttribute('line')!=="0")
        {
            node.classList.add('disabled');
            node.classList.remove('end_cell');
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
                data.outside_cells.forEach(function(cell)
                {
                    var node = document.querySelector('.hexagone[row="'+cell.x+'"][line="'+cell.z+'"]');
                    node.classList.remove('disabled');
                });
                node = document.querySelector('.hexagone[row="'+data.end_cell.x+'"][line="'+data.end_cell.z+'"]');
                node.classList.add('end_cell');
            }
        }
        catch(err)
        {
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
        map.ennemys.push({
            x: p.getAttribute('row'),
            z: p.getAttribute('line'),
            top: node.getAttribute('top'),
            left: node.getAttribute('left'),
            rotation: node.getAttribute('rotation'),
        });
    });

    window.open('data:text/plain,'+JSON.stringify(map).replace(/"/g,''));

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
            if(!h.classList.contains('end_cell'))
            {
                h.classList.add('disabled');
            }
        }
    }
    else
    {
        if(mode=='mark_end')
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

            var div = document.createElement('div');
            div.className='ennemy';
            div.innerText='Ennemy';
            h.appendChild(div);

            var editorLeft =  editor.offsetLeft;
            var editorTop =  editor.offsetTop;
            
            var left = ((e.pageX - h.offsetLeft - editorLeft ) / h.offsetWidth).toFixed(2);
            var top = ((e.pageY - h.offsetTop - editorTop ) / h.offsetHeight).toFixed(2);
            div.setAttribute('rotation','0');
            div.setAttribute('left', left);
            div.setAttribute('top', top);
            div.style.left=(left*100)+'%';
            div.style.top=(top*100)+'%';

            div.addEventListener('click', selectItem.bind(this, div, h), true);
            div.click();
            e.stopPropagation();
        }
    }
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

    var nodes = [...document.querySelectorAll('.selected_item_action')];
    nodes.forEach(function(node)
    {
        node.setAttribute('disabled','');
    });

    e.stopPropagation();
}

var re = /load=(.*)/;
if(result = location.href.match(re))
{
    load(result[1]);
}
