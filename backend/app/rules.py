"""Reviewed low-risk branching definitions, version 1.

Guidance is generic and non-invasive, not a hardware diagnosis. Extending rules
requires graph validation and safety review before changing a live flow version.
"""

SAFETY = "Do you notice swelling, smoke, a burning smell, sparks, liquid damage, or unusually intense heat?"
STOP = "Stop using the device. If safe, disconnect power at the wall without touching damaged or wet parts. Do not charge, open, press or handle a swollen battery. Keep away from flammable materials and contact qualified repair support. If there is smoke or fire, move away and contact emergency services."
OPTIONS = ["Yes", "No", "Not sure", "Not applicable"]


def question(key, text, explanation, component, targets, safety=""):
    return dict(
        key=key,
        question=text,
        explanation=explanation,
        component=component,
        safety=safety,
        targets=targets,
    )


def outcome(key, text, action):
    return dict(
        key=key,
        question="Your next step",
        explanation="Possible explanations based only on what you reported, not a confirmed hardware diagnosis.",
        component="",
        terminal=True,
        result=text,
        recommendation=action,
        targets={},
    )


def branch(yes, no, unsure=None, na=None):
    return dict(zip(OPTIONS, [yes, no, unsure or "support", na or "support"]))


PROBLEMS = [
    (
        "laptop-charge",
        "laptop",
        "Won’t charge",
        "Check the outlet, adapter and charging connection.",
    ),
    (
        "laptop-power",
        "laptop",
        "Won’t turn on",
        "Work through safe external power checks.",
    ),
    (
        "laptop-heat",
        "laptop",
        "Overheating",
        "Check ventilation and workload without opening the device.",
    ),
    (
        "laptop-slow",
        "laptop",
        "Slow performance",
        "Review background workload and free storage.",
    ),
    (
        "laptop-display",
        "laptop",
        "No display",
        "Separate brightness and display-output checks.",
    ),
    (
        "laptop-battery",
        "laptop",
        "Battery drains quickly",
        "Review settings, background use and battery information.",
    ),
    (
        "router-power",
        "router",
        "Won’t power on",
        "Check the outlet and original power connection.",
    ),
    (
        "router-internet",
        "router",
        "No internet connection",
        "Check service status, WAN connection and restart behavior.",
    ),
    (
        "router-wifi",
        "router",
        "Wi-Fi not visible",
        "Check whether other devices see the wireless network.",
    ),
    (
        "router-drop",
        "router",
        "Frequent disconnections",
        "Compare wireless coverage and connection stability.",
    ),
    (
        "router-slow",
        "router",
        "Slow Wi-Fi",
        "Compare distance, device load and connection quality.",
    ),
    (
        "router-connected",
        "router",
        "Connected but no internet",
        "Compare devices, ISP status and router indicators.",
    ),
]


def definitions(pid):
    base = [
        question(
            "safety",
            SAFETY,
            "Hazard signs take priority over every other check.",
            "battery" if pid.startswith("laptop") else "power",
            branch("hazard", "first", "hazard", "hazard"),
            STOP,
        ),
        outcome(
            "hazard", "A potential safety issue needs professional attention.", STOP
        ),
        outcome(
            "support",
            "These external checks cannot safely narrow down the issue.",
            "Contact the manufacturer or a qualified technician with this case history. Do not open power adapters, touch exposed wiring, bypass protections or replace components based on these checks alone.",
        ),
        outcome(
            "improved",
            "You reported that the issue improved after an external check.",
            "Monitor normal use. If the issue returns, reopen the case or consult manufacturer support. This does not confirm which part caused it.",
        ),
    ]
    if pid == "laptop-charge":
        steps = [
            question(
                "first",
                "Does the wall socket work with a known-working, undamaged device?",
                "This helps separate the power source from the laptop.",
                "connector",
                branch("adapter", "outlet", "support", "adapter"),
            ),
            outcome(
                "outlet",
                "The power source may be unavailable.",
                "Use another known-working socket if safe. Do not inspect wiring or attempt electrical repairs; contact a qualified electrician for a faulty socket.",
            ),
            question(
                "adapter",
                "Does the adapter have its usual indicator light, if it has one?",
                "Indicator behavior is one clue, not proof of adapter condition.",
                "connector",
                branch("cable", "cable", "cable", "cable"),
            ),
            question(
                "cable",
                "Is any charging cable, connector or adapter visibly damaged?",
                "Fraying or damaged insulation requires stopping use.",
                "port",
                branch("hazard", "compatible", "support", "compatible"),
            ),
            question(
                "compatible",
                "Can you safely test a known-working charger explicitly compatible with your laptop?",
                "Connector fit alone does not establish compatible voltage, polarity or power.",
                "port",
                branch("response", "support", "support", "support"),
                "Only use a manufacturer-approved or explicitly compatible undamaged charger. Do not improvise adapters.",
            ),
            question(
                "response",
                "With that charger connected, does the laptop show a charging indicator or power response?",
                "A changed response may point to the original charging setup.",
                "battery",
                branch("charger", "support", "support", "support"),
            ),
            outcome(
                "charger",
                "The laptop responded to the compatible charger.",
                "The original charging setup may need inspection. Have the adapter and cable checked; the test does not confirm a failed component.",
            ),
        ]
    elif pid == "laptop-power":
        steps = [
            question(
                "first",
                "Is the compatible charger securely connected to a working outlet?",
                "Verify external power before interpreting a dark screen.",
                "connector",
                branch("response", "reseat", "support", "support"),
            ),
            question(
                "reseat",
                "After safely reconnecting the charger, does the laptop respond normally?",
                "A loose external connection can interrupt power.",
                "port",
                branch("improved", "support", "support", "support"),
            ),
            question(
                "response",
                "Do you see power lights or hear normal startup sounds?",
                "Signs of power can distinguish a display symptom.",
                "battery",
                branch("display", "support", "support", "support"),
            ),
            outcome(
                "display",
                "The laptop shows signs of power, so the display path may need checking.",
                "Try the No display guide. Avoid repeated forced shutdowns and do not open the laptop.",
            ),
        ]
    elif pid == "laptop-heat":
        steps = [
            question(
                "first",
                "Are the external cooling vents blocked or is the laptop on soft bedding?",
                "Soft surfaces can restrict normal airflow.",
                "vents",
                branch("airflow", "workload", "support", "workload"),
            ),
            question(
                "airflow",
                "After moving it to a hard, clear surface and allowing it to cool, is it comfortable during light use?",
                "Allow cooling before resuming; never test a device with hazard signs.",
                "vents",
                branch("improved", "support", "support", "support"),
                "Shut down if heat is unusually intense. Do not open the case or insert objects into vents.",
            ),
            question(
                "workload",
                "Does closing unneeded apps reduce heat during light use?",
                "High workloads can increase normal heat output.",
                "vents",
                branch("improved", "support", "support", "support"),
            ),
        ]
    elif pid == "laptop-slow":
        steps = [
            question(
                "first",
                "Does your system monitor show one app using unusually high CPU or memory?",
                "Workload can explain slow response without a hardware failure.",
                "screen",
                branch("apps", "storage", "support", "storage"),
            ),
            question(
                "apps",
                "After saving your work and closing that app normally, does response improve?",
                "Only close apps whose purpose you recognize.",
                "screen",
                branch("improved", "storage", "support", "support"),
                "Save work first. Do not terminate unknown system processes.",
            ),
            question(
                "storage",
                "Is the system drive nearly full according to its built-in storage settings?",
                "Low free space can affect performance.",
                "screen",
                branch("space", "support", "support", "support"),
            ),
            outcome(
                "space",
                "Low free storage may be contributing.",
                "Back up important files and review storage using your operating system’s built-in tools. Do not delete system files or run untrusted cleanup software.",
            ),
        ]
    elif pid == "laptop-display":
        steps = [
            question(
                "first",
                "Do power lights or normal startup sounds indicate that the laptop is on?",
                "A device without signs of power needs a different path.",
                "screen",
                branch("brightness", "power", "support", "support"),
            ),
            question(
                "brightness",
                "Does increasing brightness using the normal keyboard controls restore the display?",
                "A low brightness setting can mimic a blank panel.",
                "screen",
                branch("improved", "external", "support", "external"),
            ),
            question(
                "external",
                "If a compatible external display is already available, does it show the desktop normally?",
                "An external display can offer another observation without opening the device.",
                "screen",
                branch("panel", "support", "support", "support"),
            ),
            outcome(
                "power",
                "There are no reported signs of startup.",
                "Use the Won’t turn on guide before drawing conclusions about the display.",
            ),
            outcome(
                "panel",
                "The external display works, while the built-in screen does not.",
                "Have the built-in display path inspected by qualified support. This does not identify which component is faulty.",
            ),
        ]
    elif pid == "laptop-battery":
        steps = [
            question(
                "first",
                "Is high brightness or a demanding app active during the rapid drain?",
                "Battery life depends strongly on workload.",
                "battery",
                branch("settings", "report", "support", "report"),
            ),
            question(
                "settings",
                "Does normal battery-saver mode and lower brightness improve runtime?",
                "Use built-in settings, rather than untrusted battery utilities.",
                "battery",
                branch("improved", "report", "support", "support"),
            ),
            question(
                "report",
                "Does the operating system’s built-in battery information recommend service?",
                "System estimates can help decide whether professional evaluation is useful.",
                "battery",
                branch("service", "support", "support", "support"),
            ),
            outcome(
                "service",
                "Your operating system reports a battery service recommendation.",
                "Contact manufacturer support with the battery report. Do not handle or replace a battery yourself, especially if swollen, damaged or hot.",
            ),
        ]
    elif pid == "router-power":
        steps = [
            question(
                "first",
                "Does the wall outlet power another known-working, undamaged device?",
                "Check the external source without accessing wiring.",
                "power",
                branch("adapter", "outlet", "support", "adapter"),
            ),
            question(
                "adapter",
                "Is the original or explicitly compatible power adapter securely connected and undamaged?",
                "Using an incorrect adapter can damage the router.",
                "power",
                branch("lights", "support", "support", "support"),
            ),
            question(
                "lights",
                "After checking the normal power switch, do the router’s status lights appear?",
                "Consult the model label or manual for its switch and normal indicators.",
                "status",
                branch("improved", "support", "support", "support"),
            ),
            outcome(
                "outlet",
                "The outlet may not be supplying power.",
                "Use a known-working outlet if safe; seek an electrician for a faulty outlet. Never open the adapter or inspect live wiring.",
            ),
        ]
    elif pid in ["router-internet", "router-connected"]:
        steps = [
            question(
                "first",
                "Does your internet provider report a service outage in your area?",
                "An upstream outage can affect every connected device.",
                "status",
                branch("outage", "wan", "support", "wan"),
            ),
            outcome(
                "outage",
                "A provider-reported outage may explain the connection problem.",
                "Follow your provider’s service updates. Router resets or security changes are unlikely to resolve a reported service outage.",
            ),
            question(
                "wan",
                "Is the external WAN/Internet cable securely connected and undamaged?",
                "A loose external cable can interrupt upstream access.",
                "wan",
                branch("devices", "cable", "support", "devices"),
            ),
            outcome(
                "cable",
                "The external upstream connection needs attention.",
                "If safe, reseat only an ordinary accessible Ethernet cable. Do not touch optical fiber connectors, exposed wiring or damaged connectors; contact your provider if unsure.",
            ),
            question(
                "devices",
                "Do multiple devices have the same internet problem?",
                "This helps distinguish one device from a network-wide issue.",
                "ethernet",
                branch("restart", "single", "support", "restart"),
            ),
            question(
                "restart",
                "After a normal restart using the manufacturer’s instructions, is internet access restored?",
                "A normal restart is different from a factory reset.",
                "power",
                branch("improved", "support", "support", "support"),
                "Restart interrupts network service. Do not do this during critical work. Do not press a factory-reset button or change firmware.",
            ),
            outcome(
                "single",
                "The problem appears limited to one device based on your report.",
                "Review that device’s normal network settings or contact its support. Do not disable security protections to regain access.",
            ),
        ]
    elif pid == "router-wifi":
        steps = [
            question(
                "first",
                "Can another device nearby see your Wi-Fi network?",
                "Compare devices before assuming the router is at fault.",
                "wifi",
                branch("single", "wireless", "support", "wireless"),
            ),
            question(
                "wireless",
                "Does the router’s Wi-Fi indicator show wireless is enabled according to its manual?",
                "Indicator meanings vary by model.",
                "wifi",
                branch("restart", "manual", "support", "support"),
            ),
            question(
                "restart",
                "Does a normal manufacturer-guided restart make the network visible?",
                "Use a restart, not a factory reset.",
                "power",
                branch("improved", "support", "support", "support"),
                "Restart interrupts service; avoid critical work. Do not reset security settings or install firmware.",
            ),
            outcome(
                "single",
                "Other devices can see the network.",
                "Check the affected device’s supported Wi-Fi bands and normal Wi-Fi controls. Do not turn off wireless security.",
            ),
            outcome(
                "manual",
                "Wireless may be disabled, according to the indicator you checked.",
                "Use the manufacturer’s documented Wi-Fi control or contact support. Do not bypass authentication or disable security protections.",
            ),
        ]
    else:
        steps = [
            question(
                "first",
                "Does moving closer to the router improve the connection?",
                "Distance and obstructions affect wireless signal quality.",
                "wifi",
                branch("coverage", "load", "support", "load"),
            ),
            outcome(
                "coverage",
                "Coverage or local interference may be contributing.",
                "Place the router in an open, elevated location away from heat and obstructions. Follow manufacturer placement advice; do not alter power or security protections.",
            ),
            question(
                "load",
                "Is a large download or stream using the connection on another device?",
                "Shared demand can affect speed and responsiveness.",
                "ethernet",
                branch("pause", "restart", "support", "restart"),
            ),
            question(
                "pause",
                "After pausing that activity with its owner’s agreement, does performance improve?",
                "A change suggests shared load, not necessarily a faulty device.",
                "status",
                branch("improved", "restart", "support", "support"),
            ),
            question(
                "restart",
                "Does a normal restart following the manufacturer’s instructions improve stability?",
                "Persistent issues may require provider or manufacturer testing.",
                "power",
                branch("improved", "support", "support", "support"),
                "Restart interrupts service. Do not factory reset, bypass security or install unverified firmware.",
            ),
        ]
    return base + steps


def validate_graph(nodes):
    keys = {n["key"] for n in nodes}
    assert len(keys) == len(nodes) and "safety" in keys
    graph = {n["key"]: list(n["targets"].values()) for n in nodes}
    for node in nodes:
        assert all(target in keys for target in node["targets"].values())
        if not node.get("terminal"):
            assert set(node["targets"]) == set(OPTIONS)

    def walk(key, seen):
        if key in seen:
            raise ValueError("Diagnostic graph must be acyclic")
        for child in graph[key]:
            walk(child, seen | {key})

    walk("safety", set())
