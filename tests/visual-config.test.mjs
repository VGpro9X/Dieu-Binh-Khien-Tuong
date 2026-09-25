import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decorNoise, terrainTopColor, TERRAIN_PALETTES,
  FX_BUDGET, UNIT_PROJECTILE_STYLE, projectileColor,
} from '../src/game/visual/visual-config.ts';

test('V0.9: cùng seed và tọa độ cho cùng họa tiết địa hình', () => {
  const original = decorNoise('dieu-binh-v09', 4, 7, 2);
  assert.equal(original, decorNoise('dieu-binh-v09', 4, 7, 2));
  assert.notEqual(original, decorNoise('dieu-binh-v09', 4, 8, 2));
  assert.notEqual(original, decorNoise('map-moi', 4, 7, 2));
  assert.ok(original >= 0 && original < 1);
});

test('V0.9: mọi địa hình có hai tông màu và hai tông được xen kẽ', () => {
  for (const id of ['dong-co', 'rung', 'doi-da', 'nuoc-can']) {
    const palette = TERRAIN_PALETTES[id];
    assert.equal(palette.top.length, 2);
    assert.notEqual(palette.top[0], palette.top[1]);
    assert.equal(terrainTopColor(id, 2, 4), palette.top[0]);
    assert.equal(terrainTopColor(id, 3, 4), palette.top[1]);
  }
});

test('V0.9: giảm hiệu ứng không làm thay đổi sát thương hoặc luật chơi', () => {
  assert.ok(FX_BUDGET['day-du'].impactParticles > FX_BUDGET.gon.impactParticles);
  assert.ok(FX_BUDGET['day-du'].projectileParticles > FX_BUDGET.gon.projectileParticles);
  assert.equal(FX_BUDGET.gon.allowCameraShake, false);
  assert.equal(FX_BUDGET['day-du'].allowCameraShake, true);
});

test('V0.9: sáu lớp quân có biểu hiện đòn đánh và hai phép có màu riêng', () => {
  assert.equal(Object.keys(UNIT_PROJECTILE_STYLE).length, 6);
  assert.equal(UNIT_PROJECTILE_STYLE['cung-thu'], 'ten');
  assert.equal(UNIT_PROJECTILE_STYLE['phap-su'], 'hoa-cau');
  assert.equal(UNIT_PROJECTILE_STYLE['tri-lieu-su'], 'tri-lieu');
  assert.equal(projectileColor('hoa-cau', 'xanh'), projectileColor('hoa-cau', 'do'));
  assert.equal(projectileColor('tri-lieu', 'xanh'), projectileColor('tri-lieu', 'do'));
  assert.notEqual(projectileColor('kiem', 'xanh'), projectileColor('kiem', 'do'));
});
