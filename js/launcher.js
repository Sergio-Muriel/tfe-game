var level = 1;
var re;
if(re = location.href.match(/level=(\d+)/))
{
    level=re[1];
    console.log('level ',level);
}
var options = {
    root: document.getElementById('game_container'),
    door_size: 30,
    debug_level: /debug/.test(location.href) ? 10 : 0,
    enable_shadow: false
    /* 2 = debug enter/maze paths */
    /* 10 = debug walls */
};
var assets = new Assets(options);
options.assets = assets;

var game = new Game(options);

game.init({ level: level });


