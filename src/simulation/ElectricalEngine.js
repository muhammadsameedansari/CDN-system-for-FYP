/**
 * Electrical Simulation Engine
 * Graph-based: power source → switches → lights/sockets
 * Each room has its own circuit with independent switches
 */

// ── Room circuit definitions ────────────────────────────────────────────────
const ROOM_CIRCUITS = {
  bedroom: {
    switches: [
      { id: 'sw_main',  label: 'Main Switch',  x: 0.3,  y: 1.2, z: 0.25 },
      { id: 'sw_fan',   label: 'Fan Switch',   x: 0.3,  y: 1.0, z: 0.25 },
    ],
    lights: [
      { id: 'lt_main',  label: 'Main Light',   x: 0.5,  y: 3.0, z: 0.5,  connectedTo: 'sw_main', type: 'ceiling' },
      { id: 'lt_side',  label: 'Side Lamp',    x: 0.15, y: 0.7, z: 0.85, connectedTo: 'sw_main', type: 'lamp'    },
      { id: 'lt_fan',   label: 'Ceiling Fan',  x: 0.5,  y: 2.9, z: 0.5,  connectedTo: 'sw_fan',  type: 'fan'     },
    ],
    sockets: [
      { id: 'sk_1', label: 'Power Socket', x: 0.25, y: 0.4, z: 0.3 },
      { id: 'sk_2', label: 'Power Socket', x: 0.75, y: 0.4, z: 0.3 },
    ],
  },

  kitchen: {
    switches: [
      { id: 'sw_main',    label: 'Main Switch',    x: 0.08, y: 1.2, z: 0.3  },
      { id: 'sw_exhaust', label: 'Exhaust Switch', x: 0.08, y: 1.0, z: 0.3  },
    ],
    lights: [
      { id: 'lt_main',    label: 'Main Light',     x: 0.5,  y: 3.0, z: 0.5,  connectedTo: 'sw_main',    type: 'ceiling' },
      { id: 'lt_counter', label: 'Counter Light',  x: 0.5,  y: 1.8, z: 0.85, connectedTo: 'sw_main',    type: 'strip'   },
      { id: 'lt_exhaust', label: 'Exhaust Fan',    x: 0.5,  y: 2.8, z: 0.9,  connectedTo: 'sw_exhaust', type: 'fan'     },
    ],
    sockets: [
      { id: 'sk_1', label: 'Appliance Socket', x: 0.3,  y: 1.1, z: 0.9 },
      { id: 'sk_2', label: 'Appliance Socket', x: 0.6,  y: 1.1, z: 0.9 },
    ],
  },

  washroom: {
    switches: [
      { id: 'sw_main',  label: 'Main Switch',  x: 0.08, y: 1.2, z: 0.3 },
      { id: 'sw_exh',   label: 'Exhaust',      x: 0.08, y: 1.0, z: 0.3 },
    ],
    lights: [
      { id: 'lt_main',  label: 'Main Light',   x: 0.5,  y: 2.9, z: 0.5,  connectedTo: 'sw_main', type: 'ceiling' },
      { id: 'lt_mirror',label: 'Mirror Light', x: 0.85, y: 2.0, z: 0.25, connectedTo: 'sw_main', type: 'strip'   },
      { id: 'lt_exh',   label: 'Exhaust Fan',  x: 0.5,  y: 2.8, z: 0.9,  connectedTo: 'sw_exh',  type: 'fan'     },
    ],
    sockets: [
      { id: 'sk_1', label: 'Shaver Socket', x: 0.85, y: 1.1, z: 0.25 },
    ],
  },

  lounge: {
    switches: [
      { id: 'sw_main',  label: 'Main Switch',  x: 0.08, y: 1.2, z: 0.4 },
      { id: 'sw_mood',  label: 'Mood Lights',  x: 0.08, y: 1.0, z: 0.4 },
      { id: 'sw_fan',   label: 'Fan Switch',   x: 0.08, y: 0.8, z: 0.4 },
    ],
    lights: [
      { id: 'lt_main',  label: 'Chandelier',   x: 0.5,  y: 3.0, z: 0.5,  connectedTo: 'sw_main', type: 'ceiling' },
      { id: 'lt_mood1', label: 'Mood Light L', x: 0.15, y: 2.5, z: 0.5,  connectedTo: 'sw_mood', type: 'wall'    },
      { id: 'lt_mood2', label: 'Mood Light R', x: 0.85, y: 2.5, z: 0.5,  connectedTo: 'sw_mood', type: 'wall'    },
      { id: 'lt_fan',   label: 'Ceiling Fan',  x: 0.5,  y: 2.9, z: 0.5,  connectedTo: 'sw_fan',  type: 'fan'     },
    ],
    sockets: [
      { id: 'sk_1', label: 'TV Socket',    x: 0.5,  y: 0.4, z: 0.08 },
      { id: 'sk_2', label: 'Side Socket',  x: 0.15, y: 0.4, z: 0.5  },
      { id: 'sk_3', label: 'Side Socket',  x: 0.85, y: 0.4, z: 0.5  },
    ],
  },

  dining: {
    switches: [
      { id: 'sw_main', label: 'Main Switch', x: 0.08, y: 1.2, z: 0.3 },
    ],
    lights: [
      { id: 'lt_main', label: 'Dining Light', x: 0.5, y: 2.8, z: 0.5, connectedTo: 'sw_main', type: 'pendant' },
    ],
    sockets: [
      { id: 'sk_1', label: 'Power Socket', x: 0.15, y: 0.4, z: 0.3 },
    ],
  },

  office: {
    switches: [
      { id: 'sw_main', label: 'Main Switch', x: 0.08, y: 1.2, z: 0.3 },
      { id: 'sw_desk', label: 'Desk Light',  x: 0.08, y: 1.0, z: 0.3 },
    ],
    lights: [
      { id: 'lt_main', label: 'Main Light',  x: 0.5,  y: 3.0, z: 0.5,  connectedTo: 'sw_main', type: 'ceiling' },
      { id: 'lt_desk', label: 'Desk Lamp',   x: 0.35, y: 1.2, z: 0.85, connectedTo: 'sw_desk', type: 'lamp'    },
    ],
    sockets: [
      { id: 'sk_1', label: 'Desk Socket',   x: 0.3,  y: 0.4, z: 0.85 },
      { id: 'sk_2', label: 'Desk Socket',   x: 0.5,  y: 0.4, z: 0.85 },
      { id: 'sk_3', label: 'General Socket',x: 0.15, y: 0.4, z: 0.3  },
    ],
  },

  default: {
    switches: [
      { id: 'sw_main', label: 'Main Switch', x: 0.08, y: 1.2, z: 0.3 },
    ],
    lights: [
      { id: 'lt_main', label: 'Main Light', x: 0.5, y: 3.0, z: 0.5, connectedTo: 'sw_main', type: 'ceiling' },
    ],
    sockets: [
      { id: 'sk_1', label: 'Power Socket', x: 0.15, y: 0.4, z: 0.3 },
    ],
  },
};

// ── ElectricalEngine class ──────────────────────────────────────────────────
export class ElectricalEngine {
  constructor(rooms) {
    // rooms: array of { id, label, count, x, z, w, d } layout positions
    this.circuits = {};   // roomKey → circuit state
    this._buildCircuits(rooms);
  }

  _buildCircuits(rooms) {
    rooms.forEach((room, idx) => {
      const rid      = room.id || 'default';
      const template = ROOM_CIRCUITS[rid] || ROOM_CIRCUITS.default;
      const key      = `${rid}_${idx}`;

      // Clone template and scale to room dimensions
      const w = room.w || 4.5;
      const d = room.d || 4.0;
      const rx = room.x || 0;
      const rz = room.z || 0;

      this.circuits[key] = {
        roomId:    rid,
        roomLabel: room.label || rid,
        roomIdx:   idx,
        x: rx, z: rz, w, d,
        switches:  template.switches.map(sw => ({
          ...sw,
          id:      `${key}_${sw.id}`,
          isOn:    false,
          // Absolute world position
          wx: rx + sw.x * w,
          wy: sw.y,
          wz: rz + sw.z * d,
        })),
        lights: template.lights.map(lt => ({
          ...lt,
          id:          `${key}_${lt.id}`,
          isOn:        false,
          connectedTo: `${key}_${lt.connectedTo}`,
          wx: rx + lt.x * w,
          wy: lt.y,
          wz: rz + lt.z * d,
        })),
        sockets: template.sockets.map(sk => ({
          ...sk,
          id: `${key}_${sk.id}`,
          wx: rx + sk.x * w,
          wy: sk.y,
          wz: rz + sk.z * d,
        })),
      };
    });
  }

  // Toggle a switch and propagate to connected lights
  toggleSwitch(switchId) {
    for (const circuit of Object.values(this.circuits)) {
      const sw = circuit.switches.find(s => s.id === switchId);
      if (sw) {
        sw.isOn = !sw.isOn;
        // Update all lights connected to this switch
        circuit.lights.forEach(lt => {
          if (lt.connectedTo === switchId) {
            lt.isOn = sw.isOn;
          }
        });
        return { switchId, isOn: sw.isOn, circuit };
      }
    }
    return null;
  }

  // Turn all lights on/off for a room
  toggleRoomPower(roomKey) {
    const circuit = this.circuits[roomKey];
    if (!circuit) return null;
    const anyOn = circuit.switches.some(s => s.isOn);
    circuit.switches.forEach(sw => { sw.isOn = !anyOn; });
    circuit.lights.forEach(lt => { lt.isOn = !anyOn; });
    return { roomKey, isOn: !anyOn };
  }

  // Turn everything off
  allOff() {
    Object.values(this.circuits).forEach(circuit => {
      circuit.switches.forEach(sw => { sw.isOn = false; });
      circuit.lights.forEach(lt => { lt.isOn = false; });
    });
  }

  // Turn everything on
  allOn() {
    Object.values(this.circuits).forEach(circuit => {
      circuit.switches.forEach(sw => { sw.isOn = true; });
      circuit.lights.forEach(lt => { lt.isOn = true; });
    });
  }

  getState() {
    return JSON.parse(JSON.stringify(this.circuits));
  }

  getAllSwitches() {
    return Object.values(this.circuits).flatMap(c => c.switches);
  }

  getAllLights() {
    return Object.values(this.circuits).flatMap(c => c.lights);
  }

  getAllSockets() {
    return Object.values(this.circuits).flatMap(c => c.sockets);
  }

  getCircuitKeys() {
    return Object.keys(this.circuits);
  }

  getCircuit(key) {
    return this.circuits[key];
  }
}
