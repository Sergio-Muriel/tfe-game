# Three.js

## 24

- cell scripts (editor+front)
- pinga play help animation when not following
- Pinga now follows with pathFinding
- Add fish to make ennemies move
- Make noise to disturn ennemies

## 23

- move step now include delta to have same speed across the browsers
- audio system with global volume
- change menu sound volume with global/ambient/music
- enable/disable graphics shadows
- rotate camera

## 22

- new common.js class for all objects with interactions
- new characters.js class for all moveable characteres, friends or not.
- added pinga character

## 21

- add emissive red when the player is attacked
- Path Editor
- Hexagone with walls, semiwalls, opened, and door

## 20
- adding new land between mazes, with same hexagone structures
- new ambient volume system
- remove stamina / temperature bar

## 18 ?
- switch weapon!
- assets loader

## 17 weapon attachment
- attach weapon to a bone
- ennemy drop  potions when die
- drinking potion increase life
- add dynamic damage:
    * is hit depending on weapon_hit_chance
    * hit_damage is ( 0.5 + random(0.5) - target defense) * max target damage
- display text for each hit / heal
- search for collisions when droping items to avoid placing them in places not reachable 
by the player


## 16 game improvement
- Fix hover some keys (position y=1)
- add stamina bar
- Ennemy patrol pathes: round or between mazes with path find
- New weight animation update only if needed, compatible with more than 2 animations 

