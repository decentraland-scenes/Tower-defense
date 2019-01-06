import { CreepData, TrapData, TrapState, ButtonData, GameData, TilePos, Pool, Expiration } from "./components"
import { creeps, traps, buttons, tiles } from "./components"
import { SpawnCreeps, moveBlobs, killBlobs, PushButton} from "./systems";




const MAX_TRAPS = 2
const MAX_CREEPS = 4




//////////////////////////////////////////
// Scenery


const game = new Entity()
export const gameData = new GameData()
game.set(gameData)

engine.addEntity(game)


const floorMaterial = new Material
floorMaterial.albedoTexture = "materials/WoodFloor.png"

const groundMaterial = new Material
groundMaterial.albedoTexture = "materials/StoneFloor.png"

let ground = new Entity()
ground.set(new Transform({
  position: new Vector3(10, 0, 10),
  rotation: Quaternion.Euler(90, 0, 0),
  scale: new Vector3(20, 20, 20)
}))
ground.set(new PlaneShape)
ground.set(groundMaterial)
engine.addEntity(ground)


let scoreBoard = new Entity()
scoreBoard.set(new GLTFShape("models/ScoreRock/ScoreRock.gltf"))
scoreBoard.set(new Transform({
  position: new Vector3(18.99, 0, 19)
}))
engine.addEntity(scoreBoard)

let buttonMaterial = new Material()
buttonMaterial.albedoColor = Color3.FromHexString("#990000") 

const button = new Entity()
button.setParent(scoreBoard)
button.set(new Transform({
  position: new Vector3(0, 1, -0.3),
  rotation: Quaternion.Euler(90, 0, 0),
  scale: new Vector3(.05, .2, .05)
}))
button.set(new CylinderShape())
button.set(buttonMaterial)
let buttonData = new ButtonData(-0.3, -0.2)
button.set(buttonData)
buttonData.label = "New Game"
button.set(
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
buttonLabel.set(new TextShape("New game"))
buttonLabel.get(TextShape).fontSize = 50
buttonLabel.set(new Transform({
  position: new Vector3(0, 0.85, -.38)
}))
engine.addEntity(buttonLabel)

let scoreText1 = new Entity()
scoreText1.setParent(scoreBoard)
scoreText1.set(new TextShape("humans"))
scoreText1.get(TextShape).fontSize = 50
scoreText1.set(new Transform({
  position: new Vector3(-.4, .1, -.38)
}))
engine.addEntity(scoreText1)

let scoreText2 = new Entity()
scoreText2.setParent(scoreBoard)
scoreText2.set(new TextShape("creps"))
scoreText2.get(TextShape).fontSize = 50
scoreText2.set(new Transform({
  position: new Vector3(.4, .1, -.38)
}))
engine.addEntity(scoreText2)

let scoreText3 = new Entity()
scoreText3.setParent(scoreBoard)
scoreText3.set(new TextShape("vs"))
scoreText3.get(TextShape).fontSize = 100
scoreText3.set(new Transform({
  position: new Vector3(0, .35, -.38)
}))
engine.addEntity(scoreText3)

export let scoreTextHumans = new Entity()
scoreTextHumans.setParent(scoreBoard)
scoreTextHumans.set(new TextShape(gameData.humanScore.toString()))
scoreTextHumans.get(TextShape).fontSize = 200
scoreTextHumans.set(new Transform({
  position: new Vector3(-.4, .35, -.38)
}))
engine.addEntity(scoreTextHumans)

export let scoreTextCreeps = new Entity()
scoreTextCreeps.setParent(scoreBoard)
scoreTextCreeps.set(new TextShape(gameData.creepScore.toString()))
scoreTextCreeps.get(TextShape).fontSize = 200
scoreTextCreeps.set(new Transform({
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
  placeTraps()

}



////////////////////////
// Object spawners & pools

let tilePool = new Pool()
let creepPool = new Pool(MAX_CREEPS)
let trapPool = new Pool(MAX_TRAPS)

export function spawnTrap(){
  const trap = trapPool.getEntity()
  engine.addEntity(trap) 

  let posIndex = randomTrapPosition()

  let pos = gameData.path[posIndex]
  let t = trap.getOrCreate(Transform)
  t.position.set(pos.x, 0.11, pos.y)
  t.scale.setAll(0.5)
  
  if ( trap.has(TrapData)) {
    trap.get(TrapData).reset(posIndex)
  }
  else{
    trap.set(new TrapData(posIndex))
  }

  if ( trap.has(Expiration)){
    trap.remove(Expiration)
  }

  trap.set(new GLTFShape("models/SpikeTrap/SpikeTrap.gltf"))
  const spikeUp = new AnimationClip("SpikeUp", {loop: false, speed: 0.5})
  const despawn= new AnimationClip("Despawn", {loop: false, speed: 1})
  trap.get(GLTFShape).addClip(spikeUp)
  trap.get(GLTFShape).addClip(despawn)
  
  let leftLever
  let rightLever

  if (!trap.children[1]){
    leftLever = new Entity()  
    rightLever = new Entity() 

    let lt = leftLever.getOrCreate(Transform)
    lt.position.set(-1.5, 0, 0)
    lt.rotation.setEuler(0, 90, 0)

    let rt = rightLever.getOrCreate(Transform)
    rt.position.set(1.5, 0, 0)
    rt.rotation.setEuler(0, 90, 0)

    leftLever.setParent(trap)
    rightLever.setParent(trap)
   
    leftLever.set(new OnClick(e => {
      operateLeftLever(leftLever)
    }))
  
    rightLever.set(new OnClick(e => {
      operateRightLever(rightLever)
    }))
  }
  else {
    leftLever = trap.children[0]
    rightLever = trap.children[1]
  }

  engine.addEntity(leftLever)
  engine.addEntity(rightLever) 

  leftLever.set(new GLTFShape("models/Lever/LeverBlue.gltf"))
  const leverOffL = new AnimationClip("LeverOff", {loop: false, speed: 0.5})
  const leverOnL= new AnimationClip("LeverOn", {loop: false, speed: 0.5})
  const LeverDespawnL= new AnimationClip("LeverDeSpawn", {loop: false})
  leftLever.get(GLTFShape).addClip(leverOffL)
  leftLever.get(GLTFShape).addClip(leverOnL)
  leftLever.get(GLTFShape).addClip(LeverDespawnL)
  
  rightLever.set(new GLTFShape("models/Lever/LeverRed.gltf"))
  const leverOffR = new AnimationClip("LeverOff", {loop: false, speed: 0.5})
  const leverOnR= new AnimationClip("LeverOn", {loop: false, speed: 0.5})
  const LeverDespawnR= new AnimationClip("LeverDeSpawn", {loop: false})
  rightLever.get(GLTFShape).addClip(leverOffR)
  rightLever.get(GLTFShape).addClip(leverOnR)
  rightLever.get(GLTFShape).addClip(LeverDespawnR) 

  log("new trap", trapPool.pool.length)
  
}


export function spawnTile(pos: Vector2) {
  const ent = tilePool.getEntity()

  let t = ent.getOrCreate(Transform)
  t.position.set(pos.x, 0.1, pos.y)
  t.rotation.setEuler(90, 0, 0)

  let p = ent.getOrCreate(TilePos)
  p.gridPos = pos

  ent.set(new PlaneShape)
  ent.set(floorMaterial)

  engine.addEntity(ent)
}


export function spawnCreep(){
  let ent = creepPool.getEntity()
  if (!ent) return
  log("new creep", creepPool.pool.length)

  let firstTarget = new Vector3(gameData.path[1].x, 0.25, gameData.path[1].y)

  let t = ent.getOrCreate(Transform)
  t.position.set(10, 0.25, 1)
  t.lookAt(firstTarget)

  let d = ent.getOrCreate(CreepData)
  d.isDead = false
  d.pathPos = 0
  d.lerpFraction = 0

  if (!ent.has(GLTFShape)){
    ent.set(new GLTFShape("models/BlobMonster/BlobMonster.gltf"))
    const clipWalk = new AnimationClip("Walking", {loop: true})
    const clipDie= new AnimationClip("Dying", {loop: false})
    ent.get(GLTFShape).addClip(clipWalk)
    ent.get(GLTFShape).addClip(clipDie)
    clipWalk.play()
  }

  if ( ent.has(Expiration)){
    ent.remove(Expiration)
  }
    
  engine.addEntity(ent)
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

export function placeTraps(){
  for (let i = 0; i < MAX_TRAPS; i ++)
  {
    spawnTrap()
  }
}

// Random trap positions

export function randomTrapPosition()
  {
    let counter = 0;
    while(true)
    {
      if(counter++ > 1000)
      {
        throw new Error("Invalid trap position, try again");
      }
      let path = gameData.path
      const posIndex = Math.floor(Math.random() * path.length)
      const position = gameData.path[posIndex]
      if( path.filter((p) => p.x == position.x - 1 && p.y == position.y).length == 0
        && path.filter((p) => p.x == position.x + 1 && p.y == position.y).length == 0
        && position.y > 2
        && position.y < 18
        && position.x > 2
        && position.x < 18
        && traps.entities.filter((t) => posIndex == t.get(TrapData).pathPos).length == 0
      )
      {
        return posIndex 
      }
    } 
  }

  // Click interactions


export function operateLeftLever(lever: Entity){
  let data = lever.getParent().get(TrapData)
  if(!data.leftLever){
  //   data.leftLever = false
  //   lever.get(GLTFShape).getClip("LeverOff").play()
  // } else {
    //log("clicked left lever")
    data.leftLever = true
    lever.get(GLTFShape).getClip("LeverOff").play()
    if (data.rightLever){
      data.trapState = TrapState.Fired
      lever.getParent().get(GLTFShape).getClip("SpikeUp").play()
    }
  }
}

export function operateRightLever(lever: Entity){
  let data = lever.getParent().get(TrapData)
  if(!data.rightLever){
  //   data.rightLever = false
  //   lever.get(GLTFShape).getClip("LeverOff").play()
  // } else {
    //log("clicked right lever")
    data.rightLever = true
    lever.get(GLTFShape).getClip("LeverOff").play()
    if (data.leftLever){
      data.trapState = TrapState.Fired
      lever.getParent().get(GLTFShape).getClip("SpikeUp").play()
    }
  }
}
