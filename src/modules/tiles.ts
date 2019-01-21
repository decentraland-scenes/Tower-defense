import { Pool } from "./gameData";

@Component('tilePos')
export class TilePos {
  gridPos: Vector2
}


export const tiles = engine.getComponentGroup(TilePos)

let tilePool = new Pool()

const floorMaterial = new Material
floorMaterial.albedoTexture = "materials/WoodFloor.png"


export function spawnTile(pos: Vector2) {
  const ent = tilePool.getEntity()

  let t = ent.getOrCreate(Transform)
  t.position.set(pos.x, 0.1, pos.y)
  t.rotation.setEuler(90, 0, 0)

  let p = ent.getOrCreate(TilePos)
  p.gridPos = pos

  ent.add(new PlaneShape)
  ent.add(floorMaterial)

  engine.addEntity(ent)
}