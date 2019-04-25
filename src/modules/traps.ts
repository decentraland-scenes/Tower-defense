import { Expiration } from "./expiration";
import { creeps, CreepData } from "./creeps";
import { GameData, Pool } from "./gameData";

const MAX_TRAPS = 3

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
      let trapData = trap.getComponent(TrapData)
      if (trapData.trapState == TrapState.Fired) {
        trapData.remainingTime -= dt
        if (trapData.remainingTime < 0) {
          trap
            .getComponent(Animator)
            .getClip('Despawn')
            .play()
          trapData.trapState = TrapState.NotAvailable
          trap.addComponentOrReplace(new Expiration())
          spawnTrap(this.game)
        }

        for (let creep of creeps.entities) {
          let creepData = creep.getComponent(CreepData)
          if (
            trapData.pathPos == creepData.pathPos &&
            creepData.isDead == false
          ) {
            log('KILL')
            creepData.isDead = true
            creep
              .getComponent(Animator)
              .getClip('Dying')
              .play()
            creep.addComponentOrReplace(new Expiration())

            this.game.humanScore += 1
            trap
              .getComponent(Animator)
              .getClip('Despawn')
              .play()
            trapData.trapState = TrapState.NotAvailable
            trap.addComponentOrReplace(new Expiration())
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
        && traps.entities.filter((t) => posIndex == t.getComponent(TrapData).pathPos).length == 0
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
  let t = trap. getComponentOrCreate(Transform)
  t.position.set(pos.x, 0.11, pos.y)
  t.scale.setAll(0.5)
  
  if ( trap.hasComponent(TrapData)) {
    trap.getComponent(TrapData).reset(posIndex)
  }
  else{
    trap.addComponent(new TrapData(posIndex))
  }

  if ( trap.hasComponent(Expiration)){
    trap.removeComponent(Expiration)
  }

  trap.addComponent(new GLTFShape("models/SpikeTrap/SpikeTrap.gltf"))
  let trapAnimator = new Animator()
  trap.addComponent(trapAnimator)


  const spikeUp = new animationClip("SpikeUp")
  spikeUp.looping = false
  spikeUp.speed = 0.5
  const despawn= new animationClip("Despawn")
  despawn.looping = false
  trapAnimator.addClip(spikeUp)
  trapAnimator.addClip(despawn)
  
  let leftLever
  let rightLever

  if (!trap.children[1]){
    leftLever = new Entity()  
    rightLever = new Entity() 

    let lt = leftLever. getComponentOrCreate(Transform)
    lt.position.set(-1.5, 0, 0)
    lt.rotation.setEuler(0, 90, 0)

    let rt = rightLever. getComponentOrCreate(Transform)
    rt.position.set(1.5, 0, 0)
    rt.rotation.setEuler(0, 90, 0)

    leftLever.setParent(trap)
    rightLever.setParent(trap)
   
    leftLever.addComponent(new OnPointerDown(e => {
      operateLeftLever(leftLever)
    }))
  
    rightLever.addComponent(new OnPointerDown(e => {
      operateRightLever(rightLever)
    }))
  }
  else {
    leftLever = trap.children[0]
    rightLever = trap.children[1]
  }

  engine.addEntity(leftLever)
  engine.addEntity(rightLever) 

  leftLever.addComponent(new GLTFShape("models/Lever/LeverBlue.gltf"))
  let leftAnimator = new Animator()
  leftLever.addComponent(leftAnimator)
  
  const leverOffL = new animationClip("LeverOff")
  leverOffL.looping = false
  leverOffL.speed = 0.5
  const leverOnL= new animationClip("LeverOn")
  leverOnL.looping = false
  leverOnL.speed = 0.5
  const LeverDespawnL= new animationClip("LeverDeSpawn")
  LeverDespawnL.looping = false
  leftAnimator.addClip(leverOffL)
  leftAnimator.addClip(leverOnL)
  leftAnimator.addClip(LeverDespawnL)
  
  rightLever.addComponent(new GLTFShape("models/Lever/LeverRed.gltf"))
  let rightAnimator = new Animator()
  rightLever.addComponent(rightAnimator)
  
  const leverOffR = new animationClip("LeverOff")
  leverOffR.looping = false
  leverOffR.speed = 0.5
  const leverOnR= new animationClip("LeverOn")
  leverOnR.looping = false
  leverOnR.speed = 0.5
  const LeverDespawnR= new animationClip("LeverDeSpawn")
  LeverDespawnR.looping = false
  rightAnimator.addClip(leverOffR)
  rightAnimator.addClip(leverOnR)
  rightAnimator.addClip(LeverDespawnR)

  log("new trap", trapPool.pool.length)
  
}

 // Click interactions


 export function operateLeftLever(lever: Entity){
  let data = lever.getParent().getComponent(TrapData)
  if(!data.leftLever){
  //   data.leftLever = false
  //   lever.getComponent(GLTFShape).getClip("LeverOff").play()
  // } else {
    //log("clicked left lever")
    data.leftLever = true
    lever.getComponent(Animator).getClip("LeverOff").play()
    if (data.rightLever){
      data.trapState = TrapState.Fired
      lever.getParent().getComponent(Animator).getClip("SpikeUp").play()
    }
  }
}

export function operateRightLever(lever: Entity){
  let data = lever.getParent().getComponent(TrapData)
  if(!data.rightLever){
  //   data.rightLever = false
  //   lever.getComponent(GLTFShape).getClip("LeverOff").play()
  // } else {
    //log("clicked right lever")
    data.rightLever = true
    lever.getComponent(Animator).getClip("LeverOff").play()
    if (data.leftLever){
      data.trapState = TrapState.Fired
      lever.getParent().getComponent(Animator).getClip("SpikeUp").play()
    }
  }
}