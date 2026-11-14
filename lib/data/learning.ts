import type { ToneName } from "@/lib/tones";
import type { Department } from "./catalog";

export type Recipe = {
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  hours: number;
  /** Product shown on the recipe card */
  product: string;
  tone: ToneName;
  outcome: string;
  parts: string[];
  steps: string[];
  safety?: string;
};

export const recipes: Recipe[] = [
  {
    slug: "obstacle-avoiding-robot", title: "Obstacle-Avoiding Robot", level: "Beginner", hours: 4,
    product: "hc-sr04-ultrasonic-sensor", tone: "sky",
    outcome: "Read an ultrasonic sensor, drive two motors through an H-bridge and write simple decision logic.",
    parts: ["arduino-uno-r3", "hc-sr04-ultrasonic-sensor", "l298n-motor-driver", "sg90-micro-servo", "li-ion-18650-cell", "jumper-wire-set"],
    steps: [
      "Mount the HC-SR04 on the SG90 servo so the robot can look left and right.",
      "Wire the L298N inputs to Arduino PWM pins and the motors to its outputs.",
      "Measure echo pulse width and convert it to centimetres (distance = time × 0.0343 / 2).",
      "Drive forward; when distance drops below 20 cm, stop, scan both sides and turn toward the clearer path.",
    ],
    safety: "Never short Li-ion cells; use a holder with a switch and remove cells when idle.",
  },
  {
    slug: "iot-energy-sub-meter", title: "IoT Energy Sub-Meter", level: "Intermediate", hours: 6,
    product: "acs712-current-sensor", tone: "midnight",
    outcome: "Measure load current, compute energy over time and publish readings to a web dashboard over Wi-Fi.",
    parts: ["esp32-devkit-v1", "acs712-current-sensor", "lcd-16x2-i2c", "lm2596-buck-converter", "dc-power-adapter-12v"],
    steps: [
      "Calibrate the ACS712 zero-current offset with no load connected.",
      "Sample the analog output quickly and compute RMS current in firmware.",
      "Multiply by nominal voltage and integrate over time to estimate kWh.",
      "Show live values on the LCD and send them to a server or MQTT broker.",
    ],
    safety: "Mains wiring must be done by a qualified person inside a closed enclosure.",
  },
  {
    slug: "555-astable-blinker", title: "555 Astable LED Blinker", level: "Beginner", hours: 1,
    product: "ne555-timer-ic", tone: "blue",
    outcome: "Understand RC timing and duty cycle by building the classic astable multivibrator.",
    parts: ["ne555-timer-ic", "resistor-kit", "capacitor-kit-electrolytic", "led-5mm-assorted", "breadboard-830"],
    steps: [
      "Place the NE555 across the breadboard's centre gap and power pins 8 and 1.",
      "Connect R1 and R2 with the timing capacitor between pins 7, 6 and 2.",
      "Drive an LED with a series resistor from pin 3.",
      "Check f ≈ 1.44 / ((R1 + 2R2)·C) against an oscilloscope reading.",
    ],
  },
  {
    slug: "4-bit-counter", title: "4-Bit Counter with 7-Segment Output", level: "Intermediate", hours: 3,
    product: "seven-segment-display", tone: "navy",
    outcome: "Build a synchronous counter from JK flip-flops and display its state — a core DLD sessional.",
    parts: ["ttl-74xx-ic-kit", "seven-segment-display", "breadboard-830", "jumper-wire-set", "led-5mm-assorted"],
    steps: [
      "Cascade 7476 JK flip-flops with a common clock for synchronous counting.",
      "Derive the J/K inputs from the state table and simplify with a K-map.",
      "Show each bit on an LED, then decode the count onto the 7-segment display.",
    ],
  },
  {
    slug: "iot-weather-station", title: "IoT Weather Station", level: "Beginner", hours: 3,
    product: "dht22-temperature-humidity", tone: "yellow",
    outcome: "Log temperature and humidity to the cloud and learn single-wire sensor protocols.",
    parts: ["esp32-devkit-v1", "dht22-temperature-humidity", "lcd-16x2-i2c", "breadboard-830"],
    steps: [
      "Connect the DHT22 data pin to a GPIO with a 10 kΩ pull-up.",
      "Read the sensor every 2 seconds — it cannot sample faster.",
      "Display readings on the LCD and post them to a dashboard over Wi-Fi.",
    ],
  },
  {
    slug: "regulated-dc-supply", title: "Regulated DC Power Supply", level: "Beginner", hours: 2,
    product: "step-down-transformer", tone: "butter",
    outcome: "Step down, rectify, filter and measure ripple — the Electronics I power-supply experiment end to end.",
    parts: ["step-down-transformer", "diode-1n4007-pack", "capacitor-kit-electrolytic", "digital-multimeter", "digital-oscilloscope"],
    steps: [
      "Build a full-wave bridge from four 1N4007 diodes on the transformer secondary.",
      "Add a filter capacitor and observe ripple on the oscilloscope.",
      "Compare ripple for different capacitor values and load resistors.",
    ],
    safety: "Keep the 220 V primary fully insulated; switch off before changing wiring.",
  },
  {
    slug: "wifi-security-camera", title: "Wi-Fi Security Camera", level: "Intermediate", hours: 3,
    product: "esp32-cam", tone: "white",
    outcome: "Stream video over Wi-Fi and trigger snapshots from a motion sensor.",
    parts: ["esp32-cam", "pir-motion-sensor", "lm2596-buck-converter"],
    steps: [
      "Flash the camera web-server example through a USB-UART adapter.",
      "Wire the PIR output to a free GPIO and wake the camera on motion.",
      "Save snapshots to microSD and view the live stream in a browser.",
    ],
  },
  {
    slug: "cnc-plotter", title: "CNC Pen Plotter", level: "Advanced", hours: 12,
    product: "nema17-stepper-motor", tone: "blue",
    outcome: "Combine stepper control, G-code and mechanics in a two-axis drawing machine.",
    parts: ["arduino-mega-2560", "nema17-stepper-motor", "sg90-micro-servo", "dc-power-adapter-12v"],
    steps: [
      "Build two linear axes driven by NEMA 17 steppers.",
      "Flash GRBL-compatible firmware and set steps-per-mm for each axis.",
      "Use a servo to lift and lower the pen, then stream G-code from your PC.",
    ],
  },
];

export type LabGuide = { course: string; kit: string[]; experiments: string };

export const labGuides: { department: Department; title: string; labs: LabGuide[] }[] = [
  {
    department: "EEE", title: "Electrical & Electronic Engineering",
    labs: [
      { course: "Electrical Circuits I & II", kit: ["breadboard-830", "digital-multimeter", "bench-power-supply", "function-generator", "digital-oscilloscope", "resistor-kit", "capacitor-kit-electrolytic", "step-down-transformer"], experiments: "KVL/KCL verification, Thevenin/Norton equivalents, RLC resonance, AC power-factor correction." },
      { course: "Electronics I & II", kit: ["diode-1n4007-pack", "bjt-transistor-kit", "irf540n-mosfet", "lm741-op-amp", "lm358-dual-op-amp", "ne555-timer-ic"], experiments: "Bridge rectifiers with filters, CE/CS amplifiers, active filters, multivibrators, Wien-bridge oscillators." },
      { course: "Digital Logic Design", kit: ["digital-logic-trainer", "ttl-74xx-ic-kit", "seven-segment-display", "led-5mm-assorted"], experiments: "Boolean minimization, multiplexers, full adders, JK/D flip-flops, counters, 4-bit ALU." },
      { course: "Microprocessor & Interfacing", kit: ["microprocessor-8086", "arduino-uno-r3", "arduino-mega-2560", "stm32-blue-pill", "esp32-devkit-v1", "hc-sr04-ultrasonic-sensor", "lcd-16x2-i2c", "sg90-micro-servo", "stepper-28byj48-uln2003", "l298n-motor-driver"], experiments: "Assembly arithmetic and interrupts, ADC/DAC, PWM motor control, UART/I²C/SPI sensors." },
      { course: "Communication & VLSI", kit: ["fiber-patch-cord", "function-generator", "digital-oscilloscope"], experiments: "AM/FM/ASK/FSK/PSK modulation, PCM encoding, optical link budgets." },
    ],
  },
  {
    department: "CSE", title: "Computer Science & Engineering",
    labs: [
      { course: "Digital Logic & Computer Architecture", kit: ["ttl-74xx-ic-kit", "breadboard-830", "usb-logic-analyzer"], experiments: "Combinational and sequential circuits, datapath experiments." },
      { course: "Operating Systems & Networks", kit: ["rj45-crimping-tool", "fiber-patch-cord"], experiments: "Cable termination, socket programming, VLAN/OSPF routing, packet capture." },
      { course: "AI, ML & Microcontrollers", kit: ["raspberry-pi-4", "esp32-cam", "arduino-uno-r3", "esp32-devkit-v1"], experiments: "Edge image classification, IoT telemetry, sensor data pipelines." },
    ],
  },
  {
    department: "CE", title: "Civil Engineering",
    labs: [
      { course: "Practical Surveying", kit: ["digital-theodolite", "auto-level-tripod", "prismatic-compass", "measuring-tape", "handheld-gps"], experiments: "Closed traverse, contour mapping, fly levelling, curve setting-out." },
      { course: "Materials & Concrete", kit: ["slump-cone-set", "vernier-caliper"], experiments: "Concrete workability, mix design, rebar dimension checks." },
      { course: "Environmental Engineering", kit: ["ph-meter", "turbidity-meter"], experiments: "Drinking-water quality, alum coagulation (jar test), wastewater analysis." },
    ],
  },
  {
    department: "ARCH", title: "Architecture",
    labs: [
      { course: "Basic Design & Graphic Communication", kit: ["drafting-board-a1", "t-square", "set-square-pair", "technical-pen-set", "architect-scale-ruler", "balsa-wood-sheets", "foam-board"], experiments: "Orthographic and axonometric drafting, physical massing models." },
      { course: "Building Physics & Climatology", kit: ["lux-meter", "anemometer", "sound-level-meter"], experiments: "Daylight factor, cross-ventilation, reverberation and thermal comfort studies." },
      { course: "Design Studios", kit: ["fdm-3d-printer", "foam-board", "balsa-wood-sheets"], experiments: "Studio models from residence to urban masterplan." },
    ],
  },
  {
    department: "ME", title: "Mechanical Engineering",
    labs: [
      { course: "Machine Shop & Metrology", kit: ["vernier-caliper", "micrometer"], experiments: "Turning, milling and welding with precise inspection." },
      { course: "Thermodynamics & Heat Transfer", kit: ["thermocouple-k-type", "digital-multimeter"], experiments: "IC engine tests, heat exchanger effectiveness, conduction and convection." },
      { course: "Fluid Machinery & Mechatronics", kit: ["plc-trainer", "pneumatic-cylinder", "anemometer"], experiments: "Pump characteristics, airfoil lift/drag, PLC ladder logic, PID tuning." },
    ],
  },
  {
    department: "BME", title: "Biomedical Engineering",
    labs: [
      { course: "Bioinstrumentation", kit: ["pulse-oximeter", "lm358-dual-op-amp", "lm741-op-amp", "digital-oscilloscope"], experiments: "ECG/EMG amplifiers, pulse oximetry, biosignal filtering." },
    ],
  },
];

export const getRecipe = (slug: string) => recipes.find((r) => r.slug === slug);
