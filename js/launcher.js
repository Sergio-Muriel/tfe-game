var level = 1;
var re;
if(re = location.href.match(/level=(\d+)/))
{
    level=re[1];
    console.log('level ',level);
}
var game = new Game({
    root: document.getElementById('game_container'),
    door_size: 30,
    debug_level: /debug/.test(location.href) ? 10 : 0,
    level: level,
    enable_shadow: false
    /* 2 = debug enter/maze paths */
    /* 10 = debug walls */
});

game.init();


