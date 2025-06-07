import { moveLatLng } from '../useDualTracking';

describe('moveLatLng', () => {
  test('moves north and south correctly', () => {
    const start = { latitude: 0, longitude: 0 };

    const north = moveLatLng(start, 0, 1000);
    expect(north.latitude).toBeCloseTo(0.008983, 5);
    expect(north.longitude).toBeCloseTo(0, 5);

    const south = moveLatLng(start, 180, 1000);
    expect(south.latitude).toBeCloseTo(-0.008983, 5);
    expect(south.longitude).toBeCloseTo(0, 5);
  });

  test('moves east and west correctly at equator', () => {
    const start = { latitude: 0, longitude: 0 };

    const east = moveLatLng(start, 90, 1000);
    expect(east.latitude).toBeCloseTo(0, 5);
    expect(east.longitude).toBeCloseTo(0.008983, 5);

    const west = moveLatLng(start, 270, 1000);
    expect(west.latitude).toBeCloseTo(0, 5);
    expect(west.longitude).toBeCloseTo(-0.008983, 5);
  });

  test('accounts for latitude when moving east', () => {
    const start = { latitude: 45, longitude: 0 };

    const east45 = moveLatLng(start, 90, 1000);
    expect(east45.latitude).toBeCloseTo(45, 5);
    expect(east45.longitude).toBeCloseTo(0.012704, 5);
  });
});
