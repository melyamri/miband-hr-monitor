const MiBand = require('miband');
const bluetooth = navigator.bluetooth;

let bpm = 0
let HRValues = []
let miband;

async function initHRMonitor(){


  try {
    console.log('Initializing Mi Band')

    const device = await bluetooth.requestDevice({
      filters: [
        { services: [ MiBand.advertisementService ] }
      ],
      optionalServices: MiBand.optionalServices
    });
    const server = await device.gatt.connect();

    miband = new MiBand(server);
    await miband.init();

    console.log('Heart Rate Monitor (continuous for 30 sec)...')
    miband.on('heart_rate', (rate) => {
      console.log('Heart Rate:', rate)
      HRValues.push(rate)
      bpm = rate
    })


    await miband.hrmStart();

  } catch(error) {
    console.log('Error', error);
  }

}

async function stopHRMonitor(){

  try {
    console.log('Stopping HR')
    await miband.hrmStop();
    bpm = 0


  } catch(error) {
    console.log('Error', error);
  }

}


