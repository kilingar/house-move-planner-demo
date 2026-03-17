export default {
  id: "bathroom-master-attached",
  name: "Bathroom Master",
  icon: "🛁",
  items: [
    { id: "bathroom-master-plan-check-walls", type: "plan", text: "Walls and ceiling are plastered, smooth, and ready for primer and paint", tasks: ["provisional-acceptance"] },
    { id: "bathroom-master-plan-check-floor", type: "plan", text: "Floor finish is complete and protected during remaining works", tasks: ["provisional-acceptance"] },
    { id: "bathroom-master-plan-check-sockets", type: "plan", text: "Sockets, switches, and lights are tested and working", tasks: ["provisional-acceptance"] },
    { id: "bathroom-master-plan-check-doors", type: "plan", text: "Doors and windows open, close, and seal correctly", tasks: ["provisional-acceptance"] },
    { id: "bathroom-master-plan-check-skirting", type: "plan", text: "Skirting, caulk, and paint edges are clean and complete", tasks: ["provisional-acceptance"] },
    { id: "bathroom-master-plan-shutoff", type: "plan", text: "Check shut-off valve and water access for attached WC/bidet setup", tasks: ["provisional-acceptance"] },
    { id: "bathroom-master-plan-bracket-space", type: "plan", text: "Measure bracket space beside attached toilet for hand faucet", tasks: ["provisional-acceptance"] },
    { id: "bathroom-master-plan-pressure", type: "plan", text: "Confirm water pressure is sufficient for hand faucet operation", tasks: ["provisional-acceptance"] },
    { id: "bathroom-master-buy-bidet-kit", type: "buy", group: "Plumbing", text: "Hand faucet / bidet spray kit" },
    { id: "bathroom-master-buy-t-adapter", type: "buy", group: "Plumbing", text: "T-adapter and braided hose" },
    { id: "bathroom-master-do-install-bidet", type: "do", text: "Install hand faucet set on attached toilet and test for leaks" },
  ],
};