import { Expiration } from './expiration'
import { ButtonData } from './button'
import { newGame } from '../game'

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
  constructor(gameData) {
    this.game = gameData
  }
  update() {
    let humanScore = scoreTextHumans.getComponent(TextShape)
    let creepScore = scoreTextCreeps.getComponent(TextShape)
    humanScore.value = this.game.humanScore.toString()
    creepScore.value = this.game.creepScore.toString()
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
      if (entity.hasComponent(Expiration)) {
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

let scoreTextCreeps = new Entity()
let scoreTextHumans = new Entity()

export function addScoreBoard() {
  let scoreBoard = new Entity()
  scoreBoard.addComponent(new GLTFShape('models/ScoreRock/ScoreRock.gltf'))
  scoreBoard.addComponent(
    new Transform({
      position: new Vector3(30, 0, 30),
      rotation: Quaternion.Euler(0, 180, 0)
    })
  )
  engine.addEntity(scoreBoard)

  let buttonMaterial = new Material()
  buttonMaterial.albedoColor = Color3.FromHexString('#990000')

  const button = new Entity()
  button.setParent(scoreBoard)
  button.addComponent(
    new Transform({
      position: new Vector3(0, 1, 0.3),
      rotation: Quaternion.Euler(90, 180, 0),
      scale: new Vector3(0.05, 0.2, 0.05)
    })
  )
  button.addComponent(new CylinderShape())
  button.getComponent(CylinderShape).radiusTop = 1
  button.addComponent(buttonMaterial)
  let buttonData = new ButtonData(0.3, 0.2)
  button.addComponent(buttonData)
  buttonData.label = 'New Game'
  button.addComponent(
    new OnPointerDown(
      e => {
        //log("clicked")
        buttonData.pressed = true
        newGame()
        // button up
      },
      { button: ActionButton.POINTER, hoverText: 'Start!' }
    )
  )
  engine.addEntity(button)

  let buttonLabel = new Entity()
  buttonLabel.setParent(scoreBoard)
  buttonLabel.addComponent(new TextShape('New game'))
  buttonLabel.getComponent(TextShape).fontSize = 2
  buttonLabel.getComponent(TextShape).color = new Color3(0, 1, 0)
  buttonLabel.addComponent(
    new Transform({
      position: new Vector3(0, 0.85, 0.38),
      rotation: Quaternion.Euler(0, 180, 0)
    })
  )

  engine.addEntity(buttonLabel)

  let scoreText1 = new Entity()
  scoreText1.setParent(scoreBoard)
  scoreText1.addComponent(new TextShape('humans'))
  scoreText1.getComponent(TextShape).fontSize = 2.5
  scoreText1.addComponent(
    new Transform({
      position: new Vector3(-0.4, 0.1, 0.38),
      rotation: Quaternion.Euler(0, 180, 0)
    })
  )
  engine.addEntity(scoreText1)

  let scoreText2 = new Entity()
  scoreText2.setParent(scoreBoard)
  scoreText2.addComponent(new TextShape('creps'))
  scoreText2.getComponent(TextShape).fontSize = 2.5
  scoreText2.addComponent(
    new Transform({
      position: new Vector3(0.4, 0.1, 0.38),
      rotation: Quaternion.Euler(0, 180, 0)
    })
  )
  engine.addEntity(scoreText2)

  let scoreText3 = new Entity()
  scoreText3.setParent(scoreBoard)
  scoreText3.addComponent(new TextShape('vs'))
  scoreText3.getComponent(TextShape).fontSize = 2
  scoreText3.addComponent(
    new Transform({
      position: new Vector3(0, 0.35, 0.38),
      rotation: Quaternion.Euler(0, 180, 0)
    })
  )
  engine.addEntity(scoreText3)

  scoreTextHumans.setParent(scoreBoard)
  scoreTextHumans.addComponent(new TextShape('0'))
  scoreTextHumans.getComponent(TextShape).fontSize = 5
  scoreTextHumans.addComponent(
    new Transform({
      position: new Vector3(-0.4, 0.35, 0.38),
      rotation: Quaternion.Euler(0, 180, 0)
    })
  )
  engine.addEntity(scoreTextHumans)

  scoreTextCreeps.setParent(scoreBoard)
  scoreTextCreeps.addComponent(new TextShape('0'))
  scoreTextCreeps.getComponent(TextShape).fontSize = 5
  scoreTextCreeps.addComponent(
    new Transform({
      position: new Vector3(0.4, 0.35, 0.38),
      rotation: Quaternion.Euler(0, 180, 0)
    })
  )
  engine.addEntity(scoreTextCreeps)
}
