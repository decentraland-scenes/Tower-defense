import { Expiration } from "./expiration";
import { creeps, CreepData } from "./creeps";
import { GameData, Pool } from "./gameData";

const MAX_TRAPS = 2

export const enum TrapState 
{
  Available,
  PreparedOne,
  PreparedBoth,
  Fired,
  NotAvailable,
}

// time for traps to be active
const ACTIVE_TIME = 3 //(seconds)

@Component('trapdata')
export class TrapData {
  pathPos: number
  trapState: TrapState
  leftLever: boolean
  rightLever: boolean
  remainingTime: number
  constructor(pathPos?: number) {
    this.pathPos = pathPos
    this.trapState = TrapState.Available
    this.leftLever = false
    this.rightLever = false
    this.remainingTime = ACTIVE_TIME
  }
  reset(pathPos: number) {
    this.pathPos = pathPos
    this.trapState = TrapState.Available
    this.leftLever = false
    this.rightLever = false
    this.remainingTime = ACTIVE_TIME
  }
}

export const traps = engine.getComponentGroup(TrapData)


export class killBlobs implements ISystem {
  game: GameData
  constructor(gameData){
      this.game = gameData
  }
  update(dt: number) {
    for (let trap of traps.entities) {
      let trapData = trap.get(TrapData)
      if (trapData.trapState == TrapState.Fired) {
        trapData.remainingTime -= dt
        if (trapData.remainingTime < 0) {
          trap
            .get(GLTFShape)
            .getClip('Despawn')
            .play()
          trapData.trapState = TrapState.NotAvailable
          trap.set(new Expiration())
          spawnTrap(this.game)
        }

        for (let creep of creeps.entities) {
          let creepData = creep.get(CreepData)
          if (
            trapData.pathPos == creepData.pathPos &&
            creepData.isDead == false
          ) {
            log('KILL')
            creepData.isDead = true
            creep
              .get(GLTFShape)
              .getClip('Dying')
              .play()
            creep.set(new Expiration())

            this.game.humanScore += 1
            trap
              .get(GLTFShape)
              .getClip('Despawn')
              .play()
            trapData.trapState = TrapState.NotAvailable
            trap.set(new Expiration())
            spawnTrap(this.game)
          }
        }
      }
    }
  }
}

let trapPool = new Pool(MAX_TRAPS)


export function placeTraps(gameData: GameData){
  for (let i = 0; i < MAX_TRAPS; i ++)
  {
    spawnTrap(gameData)
  }
}

// Random trap positions

export function randomTrapPosition(gameData: GameData){
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


export function spawnTrap(gameData: GameData){
  const trap = trapPool.getEntity()
  engine.addEntity(trap) 

  let posIndex = randomTrapPosition(gameData)

  let pos = gameData.path[posIndex]
  let t = trap.getOrCreate(Transform)
  t.position.set(pos.x, 0.11, pos.y)
  t.scale.setAll(0.5)
  
  if ( trap.has(TrapData)) {
    trap.get(TrapData).reset(posIndex)
  }
  else{
    trap.add(new TrapData(posIndex))
  }

  if ( trap.has(Expiration)){
    trap.remove(Expiration)
  }

  trap.add(new GLTFShape("models/SpikeTrap/SpikeTrap.gltf"))
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
   
    leftLever.add(new OnClick(e => {
      operateLeftLever(leftLever)
    }))
  
    rightLever.add(new OnClick(e => {
      operateRightLever(rightLever)
    }))
  }
  else {
    leftLever = trap.children[0]
    rightLever = trap.children[1]
  }

  engine.addEntity(leftLever)
  engine.addEntity(rightLever) 

  leftLever.add(new GLTFShape("models/Lever/LeverBlue.gltf"))
  const leverOffL = new AnimationClip("LeverOff", {loop: false, speed: 0.5})
  const leverOnL= new AnimationClip("LeverOn", {loop: false, speed: 0.5})
  const LeverDespawnL= new AnimationClip("LeverDeSpawn", {loop: false})
  leftLever.get(GLTFShape).addClip(leverOffL)
  leftLever.get(GLTFShape).addClip(leverOnL)
  leftLever.get(GLTFShape).addClip(LeverDespawnL)
  
  rightLever.add(new GLTFShape("models/Lever/LeverRed.gltf"))
  const leverOffR = new AnimationClip("LeverOff", {loop: false, speed: 0.5})
  const leverOnR= new AnimationClip("LeverOn", {loop: false, speed: 0.5})
  const LeverDespawnR= new AnimationClip("LeverDeSpawn", {loop: false})
  rightLever.get(GLTFShape).addClip(leverOffR)
  rightLever.get(GLTFShape).addClip(leverOnR)
  rightLever.get(GLTFShape).addClip(LeverDespawnR) 

  log("new trap", trapPool.pool.length)
  
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