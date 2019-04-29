import { Pool, GameData } from './gameData';
import { Expiration } from './expiration';

const MAX_CREEPS = 4

@Component('creepData')
export class CreepData {
  isDead: boolean
  pathPos: number
  lerpFraction: number
}

export const creeps = engine.getComponentGroup(CreepData)

export class SpawnCreeps implements ISystem {
  game: GameData
  constructor(gameData){
      this.game = gameData
  }  
  update(dt: number) {
    this.game.creepInterval -= dt
    if (this.game.creepInterval < 0) {
      spawnCreep(this.game.path[1])
      this.game.creepInterval = 3 + Math.random() * 3
    }
  }
}

export class moveBlobs implements ISystem {
  game: GameData
  constructor(gameData){
      this.game = gameData
  }
  update() {
    for (let creep of creeps.entities) {
      let creepData = creep.getComponent(CreepData)
      if (creepData.isDead) {
        break
      }
      let transform = creep.getComponent(Transform)
      let path = this.game.path
      if (creepData.lerpFraction < 1) {
        const pos2d = Vector2.Lerp(
          path[creepData.pathPos],
          path[creepData.pathPos + 1],
          creepData.lerpFraction
        )

        transform.position.set(pos2d.x, 0.25, pos2d.y)
        creepData.lerpFraction += 1 / 60
      } else {
        if (creepData.pathPos >= path.length - 2) {
          this.game.creepScore += 1
          log('LOOOSE ' + this.game.creepScore)
          engine.removeEntity(creep)
        } else {
          creepData.pathPos += 1
          creepData.lerpFraction = 0

          //rotate.previousRot = transform.rotation
          //rotate.targetRot = fromToRotation(transform.position, path.target)
          //rotate.rotateFraction = 0
          let nextPos = new Vector3(
            path[creepData.pathPos + 1].x,
            0.25,
            path[creepData.pathPos + 1].y
          )
          transform.lookAt(nextPos)
        }
      }
    }
  }
}


let creepPool = new Pool(MAX_CREEPS)

// reusable creep 3D model
let creepModel = new GLTFShape("models/BlobMonster/BlobMonster.glb")

export function spawnCreep(spawnLocation: Vector2){
    let ent = creepPool.getEntity()
    if (!ent) return
    log("new creep", creepPool.pool.length)
  
    let firstTarget = new Vector3(spawnLocation.x, 0.25, spawnLocation.y)
  
    let t = ent. getComponentOrCreate(Transform)
    t.position.set(10, 0.25, 1)
    t.lookAt(firstTarget)
  
    let d = ent. getComponentOrCreate(CreepData)
    d.isDead = false
    d.pathPos = 0
    d.lerpFraction = 0
  
    ent.addComponentOrReplace(creepModel)

    if (!ent.hasComponent(Animator)){
      
      const clipWalk = new AnimationState("Walking")
      const clipDie= new AnimationState("Dying")
      clipDie.looping = false
      let anim = new Animator()
      anim.addClip(clipWalk)
      anim.addClip(clipDie)
      clipWalk.play()
      ent.addComponent(anim)
    }
  
    if ( ent.hasComponent(Expiration)){
      ent.removeComponent(Expiration)
    }
      
    engine.addEntity(ent)
  }