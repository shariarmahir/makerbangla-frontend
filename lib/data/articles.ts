// Tech Insights — short, factual explainers for students. Replace or extend once the CMS/backend exists.

export const topics = ["Innovation", "Future Tech", "Learning", "Research"] as const;
export type Topic = (typeof topics)[number];

export type Article = {
  slug: string;
  topic: Topic;
  title: string;
  excerpt: string;
  image: string;
  date: string; // ISO
  minutes: number;
  body: string[];
  products?: string[];
};

export const articles: Article[] = [
  {
    slug: "edge-ai-on-raspberry-pi",
    topic: "Innovation",
    title: "Edge AI on a Raspberry Pi 4: Image Classification Without the Cloud",
    excerpt: "Run a trained vision model on the board itself — faster responses, no internet dependency and your data stays on the device.",
    image: "/images/banners/raspberry-top.webp",
    date: "2026-11-10",
    minutes: 5,
    body: [
      "Edge AI means running a trained machine-learning model on the device that collects the data, instead of sending every image to a server. The result is lower latency, a system that keeps working when the internet drops, and better privacy because raw images never leave the board.",
      "A Raspberry Pi 4 has a quad-core Cortex-A72 CPU, which is enough to run small, optimised vision models such as MobileNet with TensorFlow Lite (now LiteRT). Quantising a model to 8-bit integers shrinks it to roughly a quarter of its size and usually makes it noticeably faster on the CPU, with only a small loss in accuracy.",
      "A good first project: connect a USB webcam, load a pre-trained classifier, and print the top prediction for each frame. Then retrain the last layer on your own photos — for example, sorting recyclable and non-recyclable waste, or detecting whether a parking space is free.",
      "When you need more speed, reduce the input resolution, process every second frame, or add a USB accelerator. Measure before and after each change: frames per second and accuracy are the two numbers your report should show.",
    ],
    products: ["raspberry-pi-4", "esp32-cam"],
  },
  {
    slug: "risc-v-explained",
    topic: "Future Tech",
    title: "RISC-V Explained: The Open Instruction Set You Can Learn Inside Out",
    excerpt: "A royalty-free processor architecture that started at UC Berkeley — and is already inside microcontrollers you can buy.",
    image: "/images/banners/arduino-iso.webp",
    date: "2026-11-05",
    minutes: 4,
    body: [
      "RISC-V is an open instruction set architecture (ISA) that began at UC Berkeley in 2010. Anyone can design a processor that implements it without paying licence fees, which is why it now appears in microcontrollers, storage controllers and research chips around the world.",
      "For students the big advantage is transparency. The base integer instruction set, RV32I, is small enough that a complete single-cycle processor fits in a semester FPGA project, and every detail is documented in a free specification.",
      "You may already own RISC-V hardware: Espressif's ESP32-C3 and ESP32-C6 use RISC-V cores, and they program from the same Arduino IDE and ESP-IDF tools as the classic ESP32.",
      "To start, write a few programs in a simulator such as RARS or Ripes and watch the registers change. Then compare it with the 8086 from your microprocessor course: RISC-V uses fixed-length 32-bit instructions and a load/store design, while x86 uses variable-length instructions that can operate on memory directly.",
    ],
    products: ["microprocessor-8086", "esp32-devkit-v1"],
  },
  {
    slug: "how-to-read-a-datasheet",
    topic: "Learning",
    title: "How to Read a Datasheet in 10 Minutes",
    excerpt: "Absolute maximums, typical values and the application circuit — the four sections that answer most design questions.",
    image: "/images/banners/breadboard.webp",
    date: "2026-10-28",
    minutes: 4,
    body: [
      "Start with Absolute Maximum Ratings. These are limits the part can survive briefly, not values to design around — exceeding them can destroy the chip, and operating near them shortens its life.",
      "Next read Recommended Operating Conditions: the supply range, input levels and temperature over which the manufacturer guarantees behaviour. For the NE555 timer, for example, the supply range is 4.5 V to 16 V.",
      "The Electrical Characteristics table lists minimum, typical and maximum values. Design with the minimum and maximum; typical values describe an average part on a good day.",
      "Finally, study the pin diagram and the application circuit. Manufacturers often show a tested reference design — build that first, confirm it works on your breadboard, and only then modify it for your project.",
    ],
    products: ["ne555-timer-ic", "lm741-op-amp", "breadboard-830"],
  },
  {
    slug: "measuring-power-supply-ripple",
    topic: "Learning",
    title: "Measuring Power-Supply Ripple With an Oscilloscope",
    excerpt: "AC coupling, a short ground spring and one formula — get ripple numbers you can trust in your Electronics I report.",
    image: "/images/banners/lab.webp",
    date: "2026-10-20",
    minutes: 5,
    body: [
      "Ripple is the small AC variation left on a DC supply after rectification and filtering. On Bangladesh's 50 Hz mains, a full-wave rectifier produces ripple at 100 Hz.",
      "Set the channel to AC coupling so the DC level is removed and you can zoom in on the ripple. If your scope has a 20 MHz bandwidth limit, switch it on to suppress high-frequency noise that is not part of the ripple you are measuring.",
      "Use the shortest possible ground connection. The long ground lead on a probe forms a loop that picks up switching noise; a ground spring tip touching the capacitor's negative terminal gives a far cleaner trace.",
      "Compare your reading with the estimate Vr ≈ I / (2·f·C) for a full-wave rectifier. With a 1 A load, f = 50 Hz and C = 2200 µF, the expected peak-to-peak ripple is about 4.5 V — doubling the capacitor halves it.",
    ],
    products: ["digital-oscilloscope", "step-down-transformer", "capacitor-kit-electrolytic"],
  },
  {
    slug: "iot-energy-metering-research",
    topic: "Research",
    title: "Research Starter: IoT Energy Metering for Homes",
    excerpt: "A thesis-sized project: measure current per appliance, compute energy and publish it to a dashboard over Wi-Fi.",
    image: "/images/banners/workbench.webp",
    date: "2026-10-12",
    minutes: 6,
    body: [
      "Knowing how much energy each appliance uses is the first step to saving it. An IoT sub-meter measures current, multiplies by voltage and integrates over time to estimate kWh, then sends the result to a dashboard.",
      "A practical student build pairs an ESP32 with a Hall-effect sensor such as the ACS712, or with a clip-on current transformer that needs no break in the wire. Sample the waveform quickly, compute the RMS current in firmware and publish readings over MQTT.",
      "Good research questions include: how close does the low-cost meter get to a calibrated reference meter, how does accuracy change at very low loads, and what is the total bill of materials compared with commercial smart plugs?",
      "Safety first: any connection to 220 V mains must be done by a qualified person inside a closed, insulated enclosure. Do all firmware development on low-voltage test loads.",
    ],
    products: ["esp32-devkit-v1", "acs712-current-sensor", "lcd-16x2-i2c"],
  },
  {
    slug: "gan-and-sic-power",
    topic: "Future Tech",
    title: "GaN and SiC: The Wide-Bandgap Chips Changing Power Electronics",
    excerpt: "Why phone chargers are shrinking and electric-vehicle inverters are getting more efficient.",
    image: "/images/banners/robotics-lab.webp",
    date: "2026-10-03",
    minutes: 4,
    body: [
      "Silicon has powered electronics for decades, but two wide-bandgap materials — gallium nitride (GaN) and silicon carbide (SiC) — handle higher voltages, temperatures and switching frequencies with lower losses.",
      "GaN transistors switch very fast, so converters can use smaller inductors and capacitors. That is why many compact USB-C laptop chargers now use GaN.",
      "SiC devices excel at high voltage and high power, and are widely used in electric-vehicle traction inverters, fast chargers and solar inverters, where every percent of efficiency saves heat and battery range.",
      "In the lab you can study the same principles with a silicon MOSFET such as the IRF540N: measure switching losses at different frequencies and see why faster, lower-loss devices matter.",
    ],
    products: ["irf540n-mosfet", "lm2596-buck-converter"],
  },
];

export const getArticle = (slug: string) => articles.find((a) => a.slug === slug);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
