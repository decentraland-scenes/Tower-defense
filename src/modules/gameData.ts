import { Expiration } from './expiration'

export class GameData {
  won: boolean
  lost: boolean
  path: Vector2[]
  creeps: Entity[]
  traps: Entity[]
  humanScore: number = 0
  creepScore: number = 0
  creepInterval: number
}

export class UpdateScore implements ISystem {
  game: GameData
  humanScore: TextShape
  creepScore: TextShape
  constructor(gameData, humanScore, creepScore) {
    this.game = gameData,
    this.humanScore = humanScore,
    this.creepScore = creepScore
  }
  update() {
    this.humanScore.value = this.game.humanScore.toString()
    this.creepScore.value = this.game.creepScore.toString()
  }
}

export class Pool {
  pool: Entity[] = []
  max?: number = 1000
  constructor(max: number = 1000) {
    this.pool = []
    this.max = max
  }
  getEntity() {
    for (let i = 0; i < this.pool.length; i++) {
      const entity = this.pool[i]
      if (!entity.alive) {
        return entity
      }
    }
    let expiring = 0
    for (let i = 0; i < this.pool.length; i++) {
      const entity = this.pool[i]
      if (entity.has(Expiration)) {
        expiring += 1
      }
    }
    if (this.pool.length < this.max + expiring) {
      return this.newEntity()
    } else {
      return null
    }
  }
  newEntity() {
    const instance = new Entity()
    instance.name = (Math.random() * 10000).toString()
    this.pool.push(instance)
    return instance
  }
}
