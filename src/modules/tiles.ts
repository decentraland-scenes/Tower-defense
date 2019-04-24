import { Pool } from "./gameData";

@Component('tilePos')
export class TilePos {
  gridPos: Vector2
}


export const tiles = engine.getComponentGroup(TilePos)

let tilePool = new Pool()

const floorTexture = new Texture("materials/WoodFloor.png")

const floorMaterial = new Material
floorMaterial.albedoTexture = floorTexture


export function spawnTile(pos: Vector2) {
  const ent = tilePool.getEntity()

  let t = ent. getComponentOrCreate(Transform)
  t.position.set(pos.x, 0.1, pos.y)
  t.rotation.setEuler(90, 0, 0)

  let p = ent. getComponentOrCreate(TilePos)
  p.gridPos = pos

  ent.addComponent(new PlaneShape)
  ent.addComponent(floorMaterial)

  engine.addEntity(ent)
}