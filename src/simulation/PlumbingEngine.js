/**
 * Plumbing Simulation Engine
 * Graph-based: water mains → pipes → fixtures (taps, showers, sinks)
 * Each room has its own set of water fixtures
 */

// ── Room fixture definitions ────────────────────────────────────────────────
const ROOM_FIXTURES = {
  washroom: {
    mainValve: { id: 'valve_main', label: 'Main Valve', x: 0.08, y: 0.3, z: 0.5 },
    fixtures: [
      { id: 'tap_sink',   label: 'Sink Tap',     x: 0.88, y: 0.92, z: 0.30, type: 'tap',    flowRate: 6  },
      { id: 'tap_shower', label: 'Shower Head',  x: 0.25, y: 2.05, z: 0.85, type: 'shower', flowRate: 10 },
      { id: 'tap_toilet', label: 'Toilet Flush', x: 0.30, y: 0.75, z: 0.20, type: 'flush',  flowRate: 8  },
    ],
    pipes: [
      { from: 'valve_main', to: 'tap_sink',   path: [[0.08,0.3,0.5],[0.88,0.3,0.5],[0.88,0.92,0.30]] },
      { from: 'valve_main', to: 'tap_shower', path: [[0.08,0.3,0.5],[0.08,2.05,0.5],[0.25,2.05,0.85]] },
      { from: 'valve_main', to: 'tap_toilet', path: [[0.08,0.3,0.5],[0.30,0.3,0.5],[0.30,0.75,0.20]] },
    ],
  },

  kitchen: {
    mainValve: { id: 'valve_main', label: 'Main Valve', x: 0.08, y: 0.3, z: 0.9 },
    fixtures: [
      { id: 'tap_sink',   label: 'Kitchen Sink',  x: 0.88, y: 0.95, z: 0.88, type: 'tap',   flowRate: 7 },
      { id: 'tap_fridge', label: 'Water Filter',  x: 0.15, y: 0.5,  z: 0.88, type: 'tap',   flowRate: 2 },
    ],
    pipes: [
      { from: 'valve_main', to: 'tap_sink',   path: [[0.08,0.3,0.9],[0.88,0.3,0.9],[0.88,0.95,0.88]] },
      { from: 'valve_main', to: 'tap_fridge', path: [[0.08,0.3,0.9],[0.15,0.3,0.9],[0.15,0.5,0.88]]  },
    ],
  },

  bedroom: {
    mainValve: null,
    fixtures: [],
    pipes: [],
  },

  lounge: {
    mainValve: null,
    fixtures: [],
    pipes: [],
  },

  dining: {
    mainValve: { id: 'valve_main', label: 'Sink Valve', x: 0.08, y: 0.3, z: 0.8 },
    fixtures: [
      { id: 'tap_bar', label: 'Bar Sink', x: 0.15, y: 0.95, z: 0.85, type: 'tap', flowRate: 5 },
    ],
    pipes: [
      { from: 'valve_main', to: 'tap_bar', path: [[0.08,0.3,0.8],[0.15,0.3,0.8],[0.15,0.95,0.85]] },
    ],
  },

  garden: {
    mainValve: { id: 'valve_main', label: 'Garden Valve', x: 0.08, y: 0.5, z: 0.5 },
    fixtures: [
      { id: 'tap_hose',     label: 'Garden Hose',     x: 0.15, y: 0.6,  z: 0.5,  type: 'hose',   flowRate: 15 },
      { id: 'tap_sprinkler',label: 'Sprinkler',        x: 0.5,  y: 0.15, z: 0.5,  type: 'sprinkler', flowRate: 20 },
    ],
    pipes: [
      { from: 'valve_main', to: 'tap_hose',      path: [[0.08,0.5,0.5],[0.15,0.5,0.5],[0.15,0.6,0.5]]    },
      { from: 'valve_main', to: 'tap_sprinkler', path: [[0.08,0.5,0.5],[0.5,0.5,0.5],[0.5,0.15,0.5]]     },
    ],
  },

  default: {
    mainValve: null,
    fixtures: [],
    pipes: [],
  },
};

// ── PlumbingEngine class ────────────────────────────────────────────────────
export class PlumbingEngine {
  constructor(rooms) {
    this.systems = {};
    this._buildSystems(rooms);
  }

  _buildSystems(rooms) {
    rooms.forEach((room, idx) => {
      const rid      = room.id || 'default';
      const template = ROOM_FIXTURES[rid] || ROOM_FIXTURES.default;
      const key      = `${rid}_${idx}`;

      if (!template.fixtures || template.fixtures.length === 0) return;

      const w  = room.w || 4.5;
      const d  = room.d || 4.0;
      const rx = room.x || 0;
      const rz = room.z || 0;

      // Scale positions to room world coords
      const scalePos = (x, y, z) => [rx + x*w, y, rz + z*d];

      this.systems[key] = {
        roomId:    rid,
        roomLabel: room.label || rid,
        roomIdx:   idx,
        x: rx, z: rz, w, d,

        mainValve: template.mainValve ? {
          ...template.mainValve,
          id: `${key}_${template.mainValve.id}`,
          isOpen: true,
          worldPos: scalePos(template.mainValve.x, template.mainValve.y, template.mainValve.z),
        } : null,

        fixtures: template.fixtures.map(fx => ({
          ...fx,
          id:       `${key}_${fx.id}`,
          isOpen:   false,
          isFlowing: false,
          worldPos: scalePos(fx.x, fx.y, fx.z),
        })),

        pipes: template.pipes.map(pipe => ({
          ...pipe,
          id:       `${key}_pipe_${pipe.from}_${pipe.to}`,
          from:     `${key}_${pipe.from}`,
          to:       `${key}_${pipe.to}`,
          isActive: false,
          // Scale path points
          worldPath: pipe.path.map(([px, py, pz]) => scalePos(px, py, pz)),
        })),
      };
    });
  }

  // Toggle a fixture (tap/shower/etc)
  toggleFixture(fixtureId) {
    for (const system of Object.values(this.systems)) {
      const fx = system.fixtures.find(f => f.id === fixtureId);
      if (fx) {
        // Check main valve
        const valveOpen = !system.mainValve || system.mainValve.isOpen;
        if (!valveOpen) {
          return { fixtureId, isOpen: false, blocked: true, message: 'Main valve is closed!' };
        }
        fx.isOpen    = !fx.isOpen;
        fx.isFlowing = fx.isOpen;

        // Update connected pipes
        system.pipes.forEach(pipe => {
          if (pipe.to === fixtureId) {
            pipe.isActive = fx.isOpen;
          }
        });

        return { fixtureId, isOpen: fx.isOpen, isFlowing: fx.isFlowing, system };
      }
    }
    return null;
  }

  // Toggle main valve for a room
  toggleMainValve(systemKey) {
    const system = this.systems[systemKey];
    if (!system || !system.mainValve) return null;

    system.mainValve.isOpen = !system.mainValve.isOpen;

    // If closing valve, stop all fixtures
    if (!system.mainValve.isOpen) {
      system.fixtures.forEach(fx => { fx.isOpen = false; fx.isFlowing = false; });
      system.pipes.forEach(pipe => { pipe.isActive = false; });
    }

    return { systemKey, valveOpen: system.mainValve.isOpen };
  }

  // Turn all taps off
  allOff() {
    Object.values(this.systems).forEach(system => {
      system.fixtures.forEach(fx => { fx.isOpen = false; fx.isFlowing = false; });
      system.pipes.forEach(pipe => { pipe.isActive = false; });
    });
  }

  getState() {
    return JSON.parse(JSON.stringify(this.systems));
  }

  getAllFixtures() {
    return Object.values(this.systems).flatMap(s => s.fixtures);
  }

  getAllPipes() {
    return Object.values(this.systems).flatMap(s => s.pipes);
  }

  getSystemKeys() {
    return Object.keys(this.systems);
  }

  getSystem(key) {
    return this.systems[key];
  }

  hasPlumbing(roomId) {
    const template = ROOM_FIXTURES[roomId] || ROOM_FIXTURES.default;
    return template.fixtures && template.fixtures.length > 0;
  }
}
