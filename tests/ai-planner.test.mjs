import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseAISummon, distance, planUnitAction } from '../src/game/ai/AIPlanner.ts';

const fort = { x: 12, y: 5 };
const enemyFort = { x: 1, y: 4 };

const unit = (id, team, position, changes = {}) => ({
  id, team, position, classId: 'linh', name: 'Lính', shortLabel: 'L',
  hp: 100, maxHp: 100, movement: 4, movementType: 'bo-binh',
  attack: 24, magicAttack: 0, armor: 12, resistance: 8,
  minAttackRange: 1, maxAttackRange: 1, damageType: 'vat-ly',
  summonCost: 3, hasMoved: false, hasActed: false, role: 'Cân bằng',
  ...changes,
});
const point = (id, position, owner = null, balanceValue = 14) => ({
  id, position, owner, type: 'nha', name: 'Nhà', shortLabel: 'NH',
  income: 1, balanceValue, armorBonus: 0, resistanceBonus: 0,
  healPerTurn: 0, enablesSummoning: false, effectText: '',
});
function context(units, points = [], mana = 0, tiles = []) {
  return {
    team: 'do', units, points, ownFortress: fort, enemyFortress: enemyFort,
    getMana: () => mana,
    getReachable: () => tiles.map((position, i) => ({ position, cost: i + 1 })),
  };
}

test('Tính khoảng cách và ưu tiên chiếm đóng so với tấn công', () => {
  assert.equal(distance({ x: 2, y: 2 }, { x: 5, y: 7 }), 8);
  const red = unit('red', 'do', { x: 7, y: 5 });
  const blue = unit('blue', 'xanh', { x: 7, y: 6 });
  assert.deepEqual(
    planUnitAction(context([red, blue], [point('gold', { x: 7, y: 5 })]), red),
    { type: 'capture', unitId: 'red' },
  );
});

test('Pháp Sư dùng Hỏa Cầu đủ Mana, tấn công thường khi không đủ', () => {
  const red = unit('mage', 'do', { x: 8, y: 3 }, {
    classId: 'phap-su', damageType: 'phep', magicAttack: 35,
    minAttackRange: 2, maxAttackRange: 3,
  });
  const blue = unit('enemy', 'xanh', { x: 5, y: 3 });
  assert.deepEqual(
    planUnitAction(context([red, blue], [], 40), red),
    { type: 'skill', unitId: 'mage', targetId: 'enemy' },
  );
  assert.deepEqual(
    planUnitAction(context([red, blue], [], 20), red),
    { type: 'attack', unitId: 'mage', targetId: 'enemy' },
  );
});

test('Trị Liệu Sư ưu tiên chữa đồng minh bị thương', () => {
  const red = unit('healer', 'do', { x: 9, y: 4 }, { classId: 'tri-lieu-su' });
  const ally = unit('ally', 'do', { x: 10, y: 4 }, { hp: 40 });
  const enemy = unit('enemy', 'xanh', { x: 9, y: 6 });
  assert.deepEqual(
    planUnitAction(context([red, ally, enemy], [], 50), red),
    { type: 'skill', unitId: 'healer', targetId: 'ally' },
  );
});

test('Quân di chuyển gần điểm chưa chiếm, không đi vào ô có quân', () => {
  const red = unit('red', 'do', { x: 11, y: 4 }, { hasActed: true });
  const ally = unit('ally', 'do', { x: 10, y: 4 });
  const occupied = [{ x: 12, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 3 }];
  const chosen = planUnitAction(
    context([red, ally], [point('p', { x: 8, y: 4 })], 0, occupied),
    red,
  );
  assert.notDeepEqual(chosen, { type: 'move', unitId: 'red', position: { x: 10, y: 4 } });
  const approach = planUnitAction(
    context([red], [point('p', { x: 7, y: 4 })], 0,
      [{ x: 10, y: 4 }, { x: 11, y: 5 }]),
    red,
  );
  assert.deepEqual(approach, { type: 'move', unitId: 'red', position: { x: 10, y: 4 } });
});

test('Máy triệu hồi mở đầu rồi biết tích điểm nếu đã đông quân', () => {
  const starter = chooseAISummon({
    team: 'do', round: 0, points: 8, units: [], strategicPoints: [],
    ownFortress: fort, getValidSpawnTiles: () => [{ x: 11, y: 4 }, { x: 13, y: 5 }],
  });
  assert.equal(starter.classId, 'linh');

  const allies = Array.from({ length: 5 }, (_, i) =>
    unit('red' + i, 'do', { x: 8 + i, y: 2 }));
  const save = chooseAISummon({
    team: 'do', round: 3, points: 7,
    units: [...allies, unit('blue', 'xanh', { x: 1, y: 2 })],
    strategicPoints: [], ownFortress: fort,
    getValidSpawnTiles: () => [{ x: 11, y: 4 }],
  });
  assert.equal(save, null);
});

test('Máy ưu tiên Trọng Binh khi địch áp sát Thành Chính', () => {
  const red = unit('red', 'do', { x: 11, y: 5 });
  const blue = unit('blue', 'xanh', { x: 10, y: 5 });
  const choice = chooseAISummon({
    team: 'do', round: 3, points: 8, units: [red, blue],
    strategicPoints: [], ownFortress: fort,
    getValidSpawnTiles: () => [{ x: 12, y: 4 }],
  });
  assert.equal(choice.classId, 'trong-binh');
});

test('Quân đã dùng cả di chuyển và hành động không ra lệnh thêm', () => {
  const red = unit('spent', 'do', { x: 9, y: 5 }, { hasMoved: true, hasActed: true });
  assert.deepEqual(planUnitAction(context([red], [point('p', { x: 9, y: 5 })]), red),
    { type: 'wait', unitId: 'spent' });
});
