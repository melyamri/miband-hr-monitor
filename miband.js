const MiBand = require('miband');
const bluetooth = navigator.bluetooth;

let HRValues = []

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

    let miband = new MiBand(server);
    await miband.init();

    console.log('Heart Rate Monitor (continuous for 30 sec)...')
    miband.on('heart_rate', (rate) => {
      console.log('Heart Rate:', rate)
      updateHRValue(rate)
      HRValues.push(rate)

    })


    await miband.hrmStart();
    // await delay(30000);
    // await miband.hrmStop();



  } catch(error) {
    console.log('Error', error);
  }

}

async function monitorHR(){

}


