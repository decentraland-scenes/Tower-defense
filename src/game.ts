import { tiles, TilePos, spawnTile } from "./modules/tiles";
import { creeps, CreepData, SpawnCreeps, moveBlobs } from "./modules/creeps";
import { traps, TrapData, TrapState, killBlobs, placeTraps } from "./modules/traps";
import { Expiration, ExpireDead } from "./modules/expiration";
import { ButtonData, PushButton } from "./modules/button";
import { Pool, GameData, UpdateScore } from "./modules/gameData";



// object to store game data
export const gameData = new GameData()

//////////////////////////////////////////
// Initial entities


const groundTexture = new Texture("materials/StoneFloor.png")


const groundMaterial = new Material()
groundMaterial.albedoTexture = groundTexture

let ground = new Entity()
ground.addComponent(new Transform({
  position: new Vector3(16, 0, 16),
  rotation: Quaternion.Euler(90, 0, 0),
  scale: new Vector3(32, 32, 32)
}))
ground.addComponent(new PlaneShape())
ground.addComponent(groundMaterial)
engine.addEntity(ground)


let scoreBoard = new Entity()
scoreBoard.addComponent(new GLTFShape("models/ScoreRock/ScoreRock.gltf"))
scoreBoard.addComponent(new Transform({
  position: new Vector3(30, 0, 30),
  rotation: Quaternion.Euler(0, 180, 0)
}))
engine.addEntity(scoreBoard)

let buttonMaterial = new Material()
buttonMaterial.albedoColor = Color3.FromHexString("#990000") 

const button = new Entity()
button.setParent(scoreBoard)
button.addComponent(new Transform({
  position: new Vector3(0, 1, 0.3),
  rotation: Quaternion.Euler(90, 180, 0),
  scale: new Vector3(.05, .2, .05)
}))
button.addComponent(new CylinderShape())
button.addComponent(buttonMaterial)
let buttonData = new ButtonData(0.3, 0.2)
button.addComponent(buttonData)
buttonData.label = "New Game"
button.addComponent(
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
buttonLabel.addComponent(new TextShape("New game"))
buttonLabel.getComponent(TextShape).fontSize = 5
buttonLabel.getComponent(TextShape).color = new Color3(0,1,0)
buttonLabel.addComponent(new Transform({
  position: new Vector3(0, 0.85, .38),
  rotation: Quaternion.Euler(0, 180, 0)
}))

engine.addEntity(buttonLabel)

let scoreText1 = new Entity()
scoreText1.setParent(scoreBoard)
scoreText1.addComponent(new TextShape("humans"))
scoreText1.getComponent(TextShape).fontSize = 5
scoreText1.addComponent(new Transform({
  position: new Vector3(-.4, .1, .38),
  rotation: Quaternion.Euler(0, 180, 0)
}))
engine.addEntity(scoreText1)

let scoreText2 = new Entity()
scoreText2.setParent(scoreBoard)
scoreText2.addComponent(new TextShape("creps"))
scoreText2.getComponent(TextShape).fontSize = 5
scoreText2.addComponent(new Transform({
  position: new Vector3(.4, .1, .38),
  rotation: Quaternion.Euler(0, 180, 0)
}))
engine.addEntity(scoreText2)

let scoreText3 = new Entity()
scoreText3.setParent(scoreBoard)
scoreText3.addComponent(new TextShape("vs"))
scoreText3.getComponent(TextShape).fontSize = 10
scoreText3.addComponent(new Transform({
  position: new Vector3(0, .35, .38),
  rotation: Quaternion.Euler(0, 180, 0)
}))
engine.addEntity(scoreText3)

export let scoreTextHumans = new Entity()
scoreTextHumans.setParent(scoreBoard)
scoreTextHumans.addComponent(new TextShape(gameData.humanScore.toString()))
scoreTextHumans.getComponent(TextShape).fontSize = 10
scoreTextHumans.addComponent(new Transform({
  position: new Vector3(-.4, .35, .38),
  rotation: Quaternion.Euler(0, 180, 0)
}))
engine.addEntity(scoreTextHumans)

export let scoreTextCreeps = new Entity()
scoreTextCreeps.setParent(scoreBoard)
scoreTextCreeps.addComponent(new TextShape(gameData.creepScore.toString()))
scoreTextCreeps.getComponent(TextShape).fontSize = 10
scoreTextCreeps.addComponent(new Transform({
  position: new Vector3(.4, .35, .38),
  rotation: Quaternion.Euler(0, 180, 0)
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
    //creeps.entities[0].getComponent(CreepData).isDead = true;
    engine.removeEntity(creeps.entities[0])
  }

  // get rid of old traps and children
  while(traps.entities.length) {
    engine.removeEntity(traps.entities[0])
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
  let position = new Vector2(16, 1)
  path.push(JSON.parse(JSON.stringify(position)))
  for(let i = 0; i < 2; i++)
  {
    position.y++
    path.push(JSON.parse(JSON.stringify(position)))
  }

  let counter = 0
  while(position.y < 30)
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
    && position.x <= 31 
    && position.y >= 1 
    && position.y <= 30
    && (position.x <= 31 || position.y <= 31)
    && (position.x >= 1 || position.y >= 1);
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