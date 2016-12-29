<p>Here is the article 17 about my series of posts about the game creation.</p>
<p>If you missed it, check out the <a href="/blog/game-creation-rescue-all-the-pingus.html">previous part</a>.</p>


<p>
    <a href="/share/blog/three_17.jpg"><img src="/share/blog/three_17.jpg" alt="Game threejs on github" /></a>
</p>

<h4>Global audio system and volumes</h4>
<p>To be able to adjust the global volume and music/ambient volumes separetely, i made a new volume system which:</p>
<p>Volume is set by the multiplication of:</p>
<ul>
    <li>Global volume value: the same for every audio asset</li>
    <li>Volume type value: different value for music assets, ambient audio assets, etc...</li>
    <li>Default volume asset value: The default value of a single audio file, which can be usefull to made some tests with volume adjustements</li>
</ul>

<p>In the game it is coded as:</p>
<pre>
    this.sounds.forEach(function(sound)
    {
        var mul=1;
        if(sound.getAttribute('volume_target_type'))
        {
            mul = game.gui.get_value(sound.getAttribute('volume_target_type'));
        }
        var val = game.gui.get_value('global_volume') * parseFloat(sound.getAttribute('initial_volume')) * mul;
        sound.volume = val;
    });
</pre>
<p>This function is pretty heavy to call, so we need a throttle to avoid calling it too ofter:</p>
<pre>
    // The function called by the main menu every time the volume slider is modified
    this.update_volumes_delay = throttle(this.update_volumes.bind(this), 200);
</pre>

<h4>Locales translation</h4>
<p>To be able to fetch strings that can be later translated, i made a new simple class: </p>
<pre>
    Game.prototype.labels =
    {
        locale: 'en',
        get: function(data)
        {
            return this[this.locale][data];
        },
        'en':
        {
            'game_name': 'The Unnamed game',
            'life': 'Life',
            'loading_assets': 'Loading game data'
            /* etc... */
        } 
    };
</pre>
<p>This is used to create the main menu system using variable strings.</p> 

<h4>Main menu layout</h4>
<p>To create the main menu, i used the same idea i used to create the game gui: a new html layout.</p>
<p>By pressing the 'Escape' key the &lt;div&gt; is displayed/hidden.</p>

<p>By now, there are only 3 types of menu items:</p>
<ul>
    <li>Buttons with a callback</li>
    <li>Sliders (to adjust volume  ranges)</li>
    <li>Checkboxes (to enable/disable a setting)</li>
</ul>
<p>Take a look at the <a href="https://github.com/Sergio-Muriel/tfe-game/blob/master/js/gui.js">gui.js</a> file, if you are interested on how it is done.</p>


<h4>Camera zoom levels and rotations</h4>
<p>Each level has now a default camera setting value, so i will be able to adjust it depending on the level the user is.</p>
<p>The whole camera system is in the <a href="https://github.com/Sergio-Muriel/tfe-game/blob/master/js/game.js">game.js</a> file</a>.
<p>There are 4 parameters to adjust the camera:</p>
<ol>
    <li>opt.level: Height of the camera (Z distance from the floor to the camera)</li>
    <li>opt.angle: Angle between the camera and the character</li>
    <li>opt.distance: Distance betwwn the camera and the character</li>
    <li>opt.time: Time to take to do the transition</li>
</ol>

<h4>Sources!</h4>

<p>The sources are now directly <a href="https://github.com/Sergio-Muriel/tfe-game/">available on github</a>.</p>
<p>I created the tag "<a href="https://github.com/Sergio-Muriel/tfe-game/releases/tag/blog-23">blog-23</a>" to be able to reach the state of the project corresponding to this blog post.</p>
<p>You can also test the demo of the <a href="/tfe-game/">latest state of the project</a>.
<p>A <a href="https://tfeserver.be/tfe-game/editor/">demo of the editor</a> is also available.</p>

