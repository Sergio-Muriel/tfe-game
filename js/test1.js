var game = new Game({
    root: document.getElementById('game_container'),
    door_size: 60,
    debug_level: /debug/.test(location.href) ? 10 : 0,
    enable_shadow: false
    /* 2 = debug enter/maze paths */
    /* 10 = debug walls */
});

game.init();


