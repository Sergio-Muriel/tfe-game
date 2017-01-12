Game.prototype.gui =
{
    weapons: [],

    bind: function()
    {
        var self=this;

        this.menu = document.querySelector('.menu');
        this.menu_list = document.querySelector('.menu ul');
        this.menu_header = document.querySelector('.menu_header');
        this.bone_attachments_container = document.querySelector('.bones_attachments');
        this.bone_attachments = Array.prototype.slice.call(document.querySelectorAll('.bone_attachment'));
        this.gui_container = document.querySelector('.gui');
        this.game_container = document.querySelector('#game_container');
        this.loader_container = document.querySelector('.loader');
        this.loader_text = document.querySelector('.loader-text');
        this.loader_progress_container = document.querySelector('.loader-progress span');
        this.loading_txt = document.querySelector('.loader-content h1');

        this.build_gui();
    },

    add_loading: function(txt)
    {
        this.loading_txt.innerText = txt;
        this.loader_container.classList.remove('hidden');
    },
    remove_loading: function()
    {
        this.loader_container.classList.add('hidden');
    },

    build_gui: function()
    {
        document.querySelector('.life label').innerText= game.labels.get('life');
    },

    toggle_menu: function()
    {
        if(this.menu.classList.contains('visible'))
        {
            this.close_menu();
        }
        else
        {
            this.open_menu();
        }
    },

    open_menu: function(section)
    {
        game.pause();
        this.menu_list.innerText='';
        this.menu_header.innerText='';

        // Open specific section
        if(section)
        {
            switch(section)
            {
                case 'options':
                    this.menu_header.innerText = game.labels.get('menu_options');
                    this.create_menu_option('menu_sound', this.open_menu.bind(this,'sound'));
                    this.create_menu_option('menu_graphic', this.open_menu.bind(this,'graphic'));
                    this.create_menu_option('menu_back', this.open_menu.bind(this));
                    break;
                case 'sound':
                    this.menu_header.innerText = game.labels.get('menu_sound');
                    this.create_menu_level('global_volume', 'global_volume', game.assets.update_volumes_delay.bind(game.assets));
                    this.create_menu_level('ambient_volume', 'ambient_volume', game.assets.update_volumes_delay.bind(game.assets));
                    this.create_menu_level('music_volume', 'music_volume', game.assets.update_volumes_delay.bind(game.assets));
                    this.create_menu_option('menu_back', this.open_menu.bind(this,'options'));
                    break;
                case 'graphic':
                    this.menu_header.innerText = game.labels.get('menu_graphic');
                    this.create_menu_toggle('menu_shadow', 'shadow', game.update_shadow.bind(game, 'reload'));
                    this.create_menu_option('menu_back', this.open_menu.bind(this,'options'));
                    break;
                break;
            }
        }
        // Open dead menu
        else if(game.focus_perso.is_dead)
        {
            this.menu_header.innerText = game.labels.get('gameover');
            this.create_menu_option('menu_retry', game.reload.bind(game));
        }
        // Open menu when playing
        else if(game.started)
        {
            this.menu_header.innerText = game.labels.get('game_name');
            this.create_menu_option('menu_restart', game.reload.bind(game));
            this.create_menu_option('menu_options', this.open_menu.bind(this,'options'));
            this.create_menu_option('menu_back', this.close_menu.bind(this));
        }
        // Open menu when not playing (intro?)
        else
        {
            this.menu_header.innerText = game.labels.get('game_name');
            this.create_menu_option('menu_play', game.reload.bind(game));
            this.create_menu_option('menu_options', this.open_menu.bind(this,'options'));
        }


        this.menu.classList.add('visible');
    },

    create_menu_level: function(text, key, callback)
    {
        var self=this;
        var li =  document.createElement('li');
        li.classList.add('menu_level');

        var label = document.createElement('label');
        label.innerText = game.labels.get(text);

        var input = document.createElement('input');
        input.setAttribute('type','range');
        input.setAttribute('min','0');
        input.setAttribute('max','1');
        input.setAttribute('step','0.01');
        input.setAttribute('value', this.get_value(key));

        li.appendChild(label);
        li.appendChild(input);

        this.menu_list.appendChild(li);
        input.addEventListener('input',function()
        {
            self.set_value(key, input.value);
            callback();
        });
    },

    create_menu_toggle: function(text, key, callback)
    {
        var self=this;
        var li =  document.createElement('li');
        li.classList.add('menu_level');

        var label = document.createElement('label');
        label.innerText = game.labels.get(text);

        var input = document.createElement('input');
        input.setAttribute('type','checkbox');
        input.checked = this.get_value(key);

        li.appendChild(label);
        li.appendChild(input);

        this.menu_list.appendChild(li);
        input.addEventListener('click',function()
        {
            self.set_value(key, input.checked);
            callback();
        });
    },
    set_value: function(data, value)
    {
        localStorage.setItem(data,value);
    },
    get_value: function(data)
    {
        var value = JSON.parse(localStorage.getItem(data) || game.config[data]);
        return value;
    },

    create_menu_option : function(text, callback)
    {
        var self=this;
        var li =  document.createElement('li');
        li.classList.add('menu_entry');
        li.innerText = game.labels.get(text);
        this.menu_list.appendChild(li);
        li.addEventListener('click',function()
        {
            self.close_menu();
            callback();
        });
    },

    close_menu: function()
    {
        this.menu_list.innerText='';
        this.menu_header.innerText='';
        game.resume();
        this.menu.classList.remove('visible');
    },

    toggle_weapon : function(bone, e)
    {
        if(!bone)
        {
            return false;
        }
        var self=this;
        this.bone_attachments.forEach(function(subbone)
        {
            if(subbone!==bone)
            {
                subbone.classList.remove('selected');
            }
        });
        game.focus_perso.hand_equip(bone.getAttribute('data-type'));
        bone.classList.add('selected');
        if(e)
        {
            e.stopPropagation();
        }
        if(this.weapons.length>1)
        {
            play_multiple(game.assets.weapon_switch_sound);
        }

        return false;
    },
    update_loading: function(current, total)
    {
        this.bind();
        var x = (current/total*100).toFixed(2);
        this.loader_progress_container.style.width = (x)+'%';
        this.loader_text.innerText=(x)+'%';
    },

    init: function()
    {
        var self=this;
        this.bind();
        
        this.gui_container.classList.remove('hidden');
        this.remove_loading();

        this.keydown_bind = this.keydown.bind(this);
        this.keyup_bind = this.keyup.bind(this);
        // Keys handle
        document.addEventListener( 'keydown', this.keydown_bind);
        document.addEventListener( 'keyup', this.keyup_bind);

    },
    loaded: function()
    {
        this.add_weapon('punch');
    },

    unload: function()
    {
        // Reset weapons
        this.weapons=[];
        this.bone_attachments_container.innerText='';

        this.game_container.innerText='';
        this.menu_list.innerText='';
        this.menu_header.innerText='';
        document.removeEventListener( 'keydown', this.keydown_bind);
        document.removeEventListener( 'keyup', this.keyup_bind);
    },

    keyup: function(e)
    {
        switch(e.key)
        {
        }
    },
    keydown: function(e)
    {
        if(this.any_key_callback)
        {
            switch(e.key)
            {
                case ' ' : /*Space key */
                case 'Escape' :
                case 'Enter' :
                    return this.any_key_callback(e);
            }
        }
        switch(e.key)
        {
            case 'Escape' :  this.toggle_menu(); break;
            case '1' :  this.toggle_weapon(this.bone_attachments[0],e); break;
            case '2' :  this.toggle_weapon(this.bone_attachments[1],e); break;
            case '3' :  this.toggle_weapon(this.bone_attachments[2],e); break;
            case '4' :  this.toggle_weapon(this.bone_attachments[3],e); break;
            case '5' :  this.toggle_weapon(this.bone_attachments[4],e); break;
            case '6' :  this.toggle_weapon(this.bone_attachments[5],e); break;
            case '7' :  this.toggle_weapon(this.bone_attachments[6],e); break;
            case '8' :  this.toggle_weapon(this.bone_attachments[7],e); break;
            case '9' :  this.toggle_weapon(this.bone_attachments[8],e); break;
        }
    },

    box: function(title, text, pause)
    {
        if(pause)
        {
            game.pause();
        }
        var div = document.createElement('div');
        div.className='textbox';

        div.innerHTML=
            '<div class="textbox-content">'+
                '<h2>'+title+'</h2>'+
                '<button class="box_close"></button>'+
                '<p>'+text+'</p>'+
            '</div>';
        this.game_container.appendChild(div);
        this.any_key_callback = this.remove_box.bind(this, div, pause);
        div.addEventListener('mousedown', this.any_key_callback);
    },
    remove_box: function(div, pause, e)
    {
        if(pause)
        {
            game.resume();
        }
        div.parentElement.removeChild(div);
        this.any_key_callback = null;
        e.stopPropagation();
    },

    add_weapon: function(type)
    {
        if(this.weapons.indexOf(type)!==-1)
        {
            return;
        }
        this.weapons.push(type);
        var div = document.createElement('div');
        div.setAttribute('class', 'bone_attachment '+type);
        div.setAttribute('data-type', type);

        var div_hover = document.createElement('div');
        div_hover.setAttribute('class', 'bone_attachment-hover');
        div_hover.innerHTML = 'Select <span>['+(this.bone_attachments.length+1)+']</span>';

        div.addEventListener('mousedown', this.toggle_weapon.bind(this,div));


        this.bone_attachments_container.appendChild(div);
        this.bind();
        this.toggle_weapon(div);
    },

};
