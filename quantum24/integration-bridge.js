/* Quantum24 Universal Integration Bridge v1 — capability discovery only; no hidden permissions or unsafe actuation. */
(()=>{"use strict";
const api="/api/integrations/certification";
const caps={
 web:{available:true,secureContext:window.isSecureContext},
 bluetooth:{available:"bluetooth" in navigator},
 usb:{available:"usb" in navigator},
 serial:{available:"serial" in navigator},
 hid:{available:"hid" in navigator},
 nfc:{available:"NDEFReader" in window},
 media:{available:!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)},
 vibration:{available:"vibrate" in navigator},
 share:{available:"share" in navigator},
 payments:{available:"PaymentRequest" in window},
 fullscreen:{available:!!document.documentElement.requestFullscreen}
};
async function refresh(){
 let registry=null; try{const r=await fetch(api,{cache:"no-store"});if(r.ok)registry=await r.json()}catch{}
 const state={at:new Date().toISOString(),secureContext:window.isSecureContext,capabilities:caps,registry:registry?.capabilities||[]};
 window.Quantum24IntegrationState=state;
 window.Quantum24QHash?.record("integration_bridge_discovery",state);
 document.dispatchEvent(new CustomEvent("q24:integration-state",{detail:state}));
 return state;
}
window.Quantum24IntegrationBridge={refresh,getState:()=>window.Quantum24IntegrationState||null,
 requestBluetooth:async()=>navigator.bluetooth?.requestDevice({acceptAllDevices:true}),
 requestUsb:async()=>navigator.usb?.requestDevice({filters:[]}),
 requestSerial:async()=>navigator.serial?.requestPort(),
 requestHid:async()=>navigator.hid?.requestDevice({filters:[]}),
 requestNfc:async()=>window.NDEFReader?new NDEFReader():null};
refresh();
})();