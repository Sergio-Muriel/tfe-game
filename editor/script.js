var p = document.getElementById('editor');
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
        h.addEventListener('click',toggle.bind(this,h, real_line, real_row));
        l.appendChild(h);
    }
    p.appendChild(l);

}


var mode='edit_map';

document.getElementById('edit_map').addEventListener('click',function() { mode='edit_map'; });
document.getElementById('mark_end').addEventListener('click',function() { mode='mark_end'; });
document.getElementById('add_ennemy').addEventListener('click',function() { mode='add_ennemy'; });
document.getElementById('save').addEventListener('click',save);
document.getElementById('load').addEventListener('click',load);

function reset()
{
    var nodes = [...document.querySelectorAll('.hexagone:not(.disabled)')];
    nodes.forEach(function(node)
    {
        if(node.getAttribute('row')!==0 || node.getAttribute('line')!==0)
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
        outside_cells:
        [
        ],
        extracells:
        [
        ],
        end_cell:  null
    };
    var nodes = [...document.querySelectorAll('.hexagone:not(.disabled)')];
    nodes.forEach(function(node)
    {
        map.outside_cells.push({ x: node.getAttribute('row'), z: node.getAttribute('line') });
    });
    var node = document.querySelector('.end_cell');
    map.end_cell = { x: node.getAttribute('row'), z: node.getAttribute('line') };
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
            h.classList.add('disabled');
        }
    }
    else
    {
        if(h.classList.contains('disabled'))
        {
            return;
        }

        if(mode=='mark_end')
        {
            var nodes = [...document.querySelectorAll('.hexagone')];
            nodes.forEach(function(node)
            {
                node.classList.remove('end_cell');
            });
            h.classList.add('end_cell');
        }
        else if(mode=='add_ennemy')
        {
            console.log('add ennemy',(e.clientX - h.offsetLeft) / h.offsetWidth , (e.clientY - h.offsetTop)/h.offsetHeight);
        }
    }
}

var re = /load=(.*)/;
if(result = location.href.match(re))
{
    console.log('result ',result);
    load(result[1]);
}
