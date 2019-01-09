import { tiles, TilePos, spawnTile } from "./modules/tiles";
import { creeps, CreepData, SpawnCreeps, moveBlobs } from "./modules/creeps";
import { traps, TrapData, TrapState, killBlobs, placeTraps } from "./modules/traps";
import { Expiration, ExpireDead } from "./modules/expiration";
import { ButtonData, PushButton } from "./modules/button";
import { Pool, GameData, UpdateScore } from "./modules/gameState";



// object to store game data
export const gameData = new GameData()

//////////////////////////////////////////
// Initial entities



const groundMaterial = new Material
groundMaterial.albedoTexture = "materials/StoneFloor.png"

let ground = new Entity()
ground.add(new Transform({
  position: new Vector3(10, 0, 10),
  rotation: Quaternion.Euler(90, 0, 0),
  scale: new Vector3(20, 20, 20)
}))
ground.add(new PlaneShape)
ground.add(groundMaterial)
engine.addEntity(ground)


let scoreBoard = new Entity()
scoreBoard.add(new GLTFShape("models/ScoreRock/ScoreRock.gltf"))
scoreBoard.add(new Transform({
  position: new Vector3(18.99, 0, 19)
}))
engine.addEntity(scoreBoard)

let buttonMaterial = new Material()
buttonMaterial.albedoColor = Color3.FromHexString("#990000") 

const button = new Entity()
button.setParent(scoreBoard)
button.add(new Transform({
  position: new Vector3(0, 1, -0.3),
  rotation: Quaternion.Euler(90, 0, 0),
  scale: new Vector3(.05, .2, .05)
}))
button.add(new CylinderShape())
button.add(buttonMaterial)
let buttonData = new ButtonData(-0.3, -0.2)
button.add(buttonData)
buttonData.label = "New Game"
button.add(
  new OnClick(e => {
    //log("clicked")
    buttonData.pressed = true
    newGame()
    // button up
  })
)
engine.addEntity(button)

let buttonLabel = new Entity()
buttonLabel.setParent(scoreBoard)
buttonLabel.add(new TextShape("New game"))
buttonLabel.get(TextShape).fontSize = 50
buttonLabel.add(new Transform({
  position: new Vector3(0, 0.85, -.38)
}))
engine.addEntity(buttonLabel)

let scoreText1 = new Entity()
scoreText1.setParent(scoreBoard)
scoreText1.add(new TextShape("humans"))
scoreText1.get(TextShape).fontSize = 50
scoreText1.add(new Transform({
  position: new Vector3(-.4, .1, -.38)
}))
engine.addEntity(scoreText1)

let scoreText2 = new Entity()
scoreText2.setParent(scoreBoard)
scoreText2.add(new TextShape("creps"))
scoreText2.get(TextShape).fontSize = 50
scoreText2.add(new Transform({
  position: new Vector3(.4, .1, -.38)
}))
engine.addEntity(scoreText2)

let scoreText3 = new Entity()
scoreText3.setParent(scoreBoard)
scoreText3.add(new TextShape("vs"))
scoreText3.get(TextShape).fontSize = 100
scoreText3.add(new Transform({
  position: new Vector3(0, .35, -.38)
}))
engine.addEntity(scoreText3)

export let scoreTextHumans = new Entity()
scoreTextHumans.setParent(scoreBoard)
scoreTextHumans.add(new TextShape(gameData.humanScore.toString()))
scoreTextHumans.get(TextShape).fontSize = 200
scoreTextHumans.add(new Transform({
  position: new Vector3(-.4, .35, -.38)
}))
engine.addEntity(scoreTextHumans)

export let scoreTextCreeps = new Entity()
scoreTextCreeps.setParent(scoreBoard)
scoreTextCreeps.add(new TextShape(gameData.creepScore.toString()))
scoreTextCreeps.get(TextShape).fontSize = 200
scoreTextCreeps.add(new Transform({
  position: new Vector3(.4, .35, -.38)
}))
engine.addEntity(scoreTextCreeps)

///////////////////////////////////
// Startup

function newGame(){

  gameData.humanScore = 0
  gameData.creepScore = 0
  gameData.lost = false
  gameData.won = false
  gameData.creepInterval = 3

  // get rid of old path
  while(tiles.entities.length) {
    engine.removeEntity(tiles.entities[0])
  }
  
  // get rid of old creeps
  while(creeps.entities.length) {
    //creeps.entities[0].get(CreepData).isDead = true;
    engine.removeEntity(creeps.entities[0])
  }

  // get rid of old traps and children
  while(traps.entities.length) {
    engine.removeEntity(traps.entities[0], true)
  }

  // create random path
  gameData.path = generatePath()
  
  // draw path with tiles
  for (let tile in gameData.path){
    let pos = gameData.path[tile]
    spawnTile(pos)
  }

  log('creating tiles',tiles.entities.length)

  // add traps
  placeTraps(gameData)

}



// Random path generator


export function generatePath(): Vector2[]
{
  const path: Vector2[] = []
  let position = new Vector2(10, 1)
  path.push(JSON.parse(JSON.stringify(position)))
  for(let i = 0; i < 2; i++)
  {
    position.y++
    path.push(JSON.parse(JSON.stringify(position)))
  }

  let counter = 0
  while(position.y < 18)
  {
    if(counter++ > 2000)
    {
      throw new Error("Invalid path, try again")
    }
    let nextPosition = new Vector2(position.x, position.y)
    switch(Math.floor(Math.random() * 3))
    {
      case 0:
        nextPosition.x += 1
        break
      case 1:
        nextPosition.x -= 1
        break
      default:
        nextPosition.y += 1
    }
    if(!isValidPosition(nextPosition) 
      || path.filter((p) => p.x == nextPosition.x && p.y == nextPosition.y).length > 0
      || getNeighborCount(path, nextPosition) > 1)
    {
      continue;
    }
    position = nextPosition;
    path.push(JSON.parse(JSON.stringify(position)))
  }
  position.y++;
  path.push(JSON.parse(JSON.stringify(position)));
  return path;
}

export function isValidPosition(position: Vector2)
{
  return position.x >= 1 
    && position.x < 19 
    && position.y >= 1 
    && position.y < 19
    && (position.x < 18 || position.y < 18)
    && (position.x > 1 || position.y > 1);
}

export function getNeighborCount(path: Vector2[], position: Vector2)
{
  const neighbors: {x: number, y: number}[] = [
    {x: position.x + 1, y: position.y},
    {x: position.x - 1, y: position.y},
    {x: position.x, y: position.y + 1},
    {x: position.x, y: position.y - 1},
  ];

  let count = 0;
  for(const neighbor of neighbors)
  {
    if(path.filter((p) => p.x == neighbor.x && p.y == neighbor.y).length > 0)
    {
      count++;
    }
  }

  return count;
}



// Start systems

engine.addSystem(new PushButton())

engine.addSystem(new SpawnCreeps(gameData))

engine.addSystem(new moveBlobs(gameData))

engine.addSystem(new killBlobs(gameData))

engine.addSystem(new ExpireDead())

engine.addSystem(new UpdateScore(gameData, scoreTextHumans, scoreTextCreeps ))