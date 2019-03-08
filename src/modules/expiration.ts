
// time for despawn animations
const EXPIRATION_TIME = 2

@Component('expiration')
export class Expiration {
  dying: boolean = false
  timeLeft: number = EXPIRATION_TIME
  reset() {
    this.dying = false
    this.timeLeft = EXPIRATION_TIME
  }
}

export const toExpire = engine.getComponentGroup(Expiration)

export class ExpireDead implements ISystem {
    update(dt: number) {
      for (let ent of toExpire.entities) {
        let exp = ent.getComponent(Expiration)
        exp.timeLeft -= dt
        if (exp.timeLeft < 0) {
          ent.removeComponent(Expiration)
          engine.removeEntity(ent, true)
        }
      }
    }
  }