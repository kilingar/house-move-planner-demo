export default {
  id: "upstairs-corridor",
  name: "Upstairs Corridor",
  icon: "🚪",
  items: [
    { id: "upstairs-plan-check-walls", type: "plan", text: "Walls and ceiling are finished (primer, paint, and touch-ups complete)", tasks: ["provisional-acceptance"] },
    { id: "upstairs-plan-check-floor", type: "plan", text: "Floor finish is complete and protected during remaining works", tasks: ["provisional-acceptance"] },
    { id: "upstairs-plan-check-sockets", type: "plan", text: "Sockets, switches, and lights are tested and working", tasks: ["provisional-acceptance"] },
    { id: "upstairs-plan-check-doors", type: "plan", text: "Doors and windows open, close, and seal correctly", tasks: ["provisional-acceptance"] },
    { id: "upstairs-plan-check-skirting", type: "plan", text: "Skirting, caulk, and paint edges are clean and complete", tasks: ["provisional-acceptance"] },
    { id: "upstairs-plan-pax-dims", type: "plan", text: "IKEA PAX system in Upstairs Corridor - confirm dimensions, depth, and door swing clearance", tasks: ["ikea-pax"] },
    { id: "upstairs-plan-pax-wall", type: "plan", text: "IKEA PAX system in Upstairs Corridor - confirm wall type and fixing points for safe anchoring", tasks: ["ikea-pax"] },
    { id: "upstairs-buy-pax", type: "buy", text: "IKEA PAX frames and interior fittings for Upstairs Corridor", tasks: ["ikea-pax"] },
    { id: "upstairs-buy-anchors", type: "buy", text: "Wall anchors and screws by wall type", tasks: ["ikea-pax"] },
    { id: "upstairs-do-order-pax", type: "do", text: "Order IKEA PAX system for Upstairs Corridor", tasks: ["ikea-pax"] },
    { id: "upstairs-do-assemble-pax", type: "do", text: "Assemble and fix IKEA PAX system in Upstairs Corridor", tasks: ["ikea-pax"] },
  ],
};
